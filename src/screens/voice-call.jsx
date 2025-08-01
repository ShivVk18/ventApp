import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  BackHandler,
  Animated,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GradientContainer from '../../components/ui/GradientContainer';
import StatusBar from '../../components/ui/StatusBar';
import VoiceControls from '../../components/voice/VoiceControl';
import useTimer from '../../hooks/useTimer';
import ZegoExpressService from '../../services/ZegoExpressService';
import RoomService from '../../services/RoomService';
import { auth } from '../../config/firebase.config';

const ZEGO_APP_ID = 348919014;
const ZEGO_APP_SIGN =
  '3e1bd2e901019273151648fbb35d45e912425fcf93e07e38a571dca4c58688d1';

export default function VoiceCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();


  const { ventText, plan, roomId, isHost } = route.params;

  // State management
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteStreamsCount, setRemoteStreamsCount] = useState(0);
  const [soundLevels, setSoundLevels] = useState({});
  const [networkQuality, setNetworkQuality] = useState({});

  // Animation refs
  const listenerFadeAnim = useRef(new Animated.Value(0)).current;
  const venterPulseAnim = useRef(new Animated.Value(1)).current;

  const roomUnsubscribeRef = useRef(null);
  const callEndedRef = useRef(false);
  const connectionCheckInterval = useRef(null);

  const initialCallDuration = RoomService.getDurationInSeconds(plan);

  const handleTimeUp = () => {
    Alert.alert('Session Ended', 'Your session has ended.', [
      {
        text: 'OK',
        onPress: async () => {
          await handleEndCall(true);
        },
      },
    ]);
  };

  const { sessionTime, timeRemaining, stopTimer } = useTimer(
    initialCallDuration,
    handleTimeUp,
  );

  const handleBackPress = () => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', onPress: () => handleEndCall(false) },
    ]);
    return true;
  };

  // Format time display
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Animate listener joining
  const animateListenerJoin = () => {
    Animated.timing(listenerFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  // Animate venter speaking
  const animateVenterSpeaking = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(venterPulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(venterPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

 
 const startConnectionCheck = () => {
  connectionCheckInterval.current = setInterval(() => {
    const info = ZegoExpressService.getConnectionInfo();
    console.log('🔄 Connection check:', info);

    // Force update isJoined based on actual connection state
    if (info.isInRoom && !isJoined) {
      console.log('🔄 Connection check: In room but not joined, updating state');
      setIsJoined(true);
      setConnectionStatus('connected');
    } else if (!info.isInRoom && isJoined) {
      console.log('🔄 Connection check: Not in room but marked as joined, updating state');
      setIsJoined(false);
      setConnectionStatus('disconnected');
    }

    const currentRemoteCount = ZegoExpressService.getRemoteStreamsCount();
    if (currentRemoteCount !== remoteStreamsCount) {
      console.log('📊 Remote streams count changed:', currentRemoteCount);
      setRemoteStreamsCount(currentRemoteCount);

      if (currentRemoteCount > 0 && remoteStreamsCount === 0) {
        animateListenerJoin();
      }
    }
  }, 2000);
};

  const stopConnectionCheck = () => {
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current);
      connectionCheckInterval.current = null;
    }
  };

 const initializeVoiceCall = async () => {
  try {
    setConnectionStatus('requesting_permissions');

    const hasPermissions = await ZegoExpressService.requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        'Permission Required',
        'Microphone access is required for voice calls.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
      return;
    }

    setConnectionStatus('initializing');

    const engineCreated = await ZegoExpressService.createEngine(
      ZEGO_APP_ID,
      ZEGO_APP_SIGN,
    );
    if (!engineCreated) {
      throw new Error('Failed to create ZegoExpressEngine');
    }

    setConnectionStatus('connecting');

    const user = auth.currentUser;
    const userID = user?.uid || `user_${Math.floor(Math.random() * 10000)}`;
    const userName = user?.email || `User_${userID.slice(0, 6)}`;

    const joinSuccess = await ZegoExpressService.loginRoom(
      roomId,
      userID,
      userName,
      {
        onRoomStateUpdate: handleRoomStateUpdate,
        onUserUpdate: handleUserUpdate,
        onStreamUpdate: handleStreamUpdate,
        onSoundLevelUpdate: handleSoundLevelUpdate,
        onNetworkQuality: handleNetworkQuality,
      },
    );

    if (!joinSuccess) {
      throw new Error('Failed to join voice room');
    }

    // CRITICAL: Set isJoined to true immediately after successful login
    console.log('✅ Room join successful, setting isJoined to true');
    setIsJoined(true);
    setConnectionStatus('connected');

    // Enable audio volume monitoring
    await ZegoExpressService.enableAudioVolumeEvaluation(true);

    // Start periodic connection checks
    startConnectionCheck();
  } catch (error) {
    console.error('❌ Voice call initialization failed:', error);
    setConnectionStatus('failed');
    setIsJoined(false);
    Alert.alert(
      'Connection Failed',
      `Unable to initialize voice call: ${error.message}`,
      [
        { text: 'Retry', onPress: () => initializeVoiceCall() },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ],
    );
  }
};

  const handleRoomStateUpdate = (state, errorCode) => {
  console.log('🏠 Room state updated:', { 
    state, 
    errorCode, 
    isHost, 
    stateType: typeof state,
    currentIsJoined: isJoined 
  });

  if (errorCode !== 0) {
    console.error('❌ Room state error:', errorCode);
    setConnectionStatus('failed');
    // Don't set isJoined to false here unless it's a critical error
    if (errorCode === 1002001 || errorCode === 1002002) { // Room doesn't exist or login failed
      setIsJoined(false);
    }
    return;
  }

  let normalizedState = state;
  
  if (typeof state === 'number') {
    switch (state) {
      case 0:
        normalizedState = 'DISCONNECTED';
        break;
      case 1:
        normalizedState = 'CONNECTED';
        break;
      case 2:
        normalizedState = 'CONNECTING';
        break;
      default:
        console.warn('Unknown numeric state:', state);
        normalizedState = 'UNKNOWN';
    }
  }

  console.log('🏠 Normalized state:', normalizedState);

  switch (normalizedState) {
    case 'DISCONNECTED':
    case 0:
      console.log('⚠ Zego Room Disconnected.');
      setConnectionStatus('disconnected');
      setIsJoined(false);
      break;
      
    case 'CONNECTING':
    case 2:
      console.log('🔄 Zego Room Connecting...');
      setConnectionStatus('connecting');
      // Don't set isJoined to false if we're already connected
      if (!isJoined) {
        console.log('Still connecting, isJoined remains false');
      }
      break;
      
    case 'CONNECTED':
    case 1:
      console.log('✅ Zego Room Connected successfully!');
      setConnectionStatus('connected');
      setIsJoined(true);
      
      if (isHost) {
        animateVenterSpeaking();
        console.log('✅ Host successfully connected to room');
      } else {
        console.log('✅ Listener successfully joined the room');
        animateListenerJoin();
      }
      break;
      
    default:
      console.warn('Unhandled Zego Room State:', normalizedState);
  }
};


const handleUserUpdate = (updateType, userList) => {
  console.log('👥 User update:', {
    updateType: updateType === 0 ? 'ADD' : 'DELETE',
    userCount: userList.length,
    isHost,
    currentIsJoined: isJoined,
  });

  if (updateType === 0) {
    // Users added
    setRemoteUsers(prev => {
      const newUsers = userList.filter(
        newUser =>
          !prev.some(existingUser => existingUser.userID === newUser.userID),
      );
      
      console.log('New users joined:', newUsers.length);
      
      // If we're not joined yet but users are joining, force connection
      if (!isJoined && newUsers.length > 0) {
        console.log('🔄 Users joined but not marked as joined, updating state');
        setIsJoined(true);
        setConnectionStatus('connected');
      }
      
      return [...prev, ...newUsers];
    });

    if (userList.length > 0) {
      console.log('👋 New users joined, triggering animation');
      animateListenerJoin();
    }
  } else {
    // Users removed
    const removedUserIDs = userList.map(user => user.userID);
    setRemoteUsers(prev =>
      prev.filter(user => !removedUserIDs.includes(user.userID)),
    );

    console.log('👋 Users left:', removedUserIDs.length);
  }
};

  const handleStreamUpdate = (updateType, streamList) => {
  console.log('🌊 Stream update:', {
    updateType: updateType === 0 ? 'ADD' : 'DELETE',
    streamCount: streamList.length,
    streams: streamList.map(s => s.streamID),
    isHost,
    currentIsJoined: isJoined,
  });

  // Update remote streams count immediately
  const currentCount = ZegoExpressService.getRemoteStreamsCount();
  setRemoteStreamsCount(currentCount);

  if (updateType === 0 && streamList.length > 0) {
    console.log('📺 New streams detected');
    
    // If we have streams but aren't marked as joined, update the state
    if (!isJoined) {
      console.log('🔄 Streams available but not marked as joined, updating state');
      setIsJoined(true);
      setConnectionStatus('connected');
    }
    
    animateListenerJoin();
  }
};

// Add a connection verification effect
useEffect(() => {
  // Verify connection after a delay
  const verifyConnection = setTimeout(() => {
    const info = ZegoExpressService.getConnectionInfo();
    console.log('🔍 Connection verification:', info);
    
    if (info.isInRoom && !isJoined) {
      console.log('🔄 In room but not marked as joined, correcting state');
      setIsJoined(true);
      setConnectionStatus('connected');
    }
  }, 3000); // Check after 3 seconds

  return () => clearTimeout(verifyConnection);
}, [connectionStatus]);


  const handleSoundLevelUpdate = soundLevels => {
    setSoundLevels(soundLevels);
  };

  const handleNetworkQuality = (userID, upstreamQuality, downstreamQuality) => {
    setNetworkQuality(prev => ({
      ...prev,
      [userID]: { upstreamQuality, downstreamQuality },
    }));
  };

  const handleToggleMute = async () => {
    const success = await ZegoExpressService.toggleMicrophone(!isMuted);
    if (success) {
      setIsMuted(!isMuted);
    } else {
      Alert.alert('Error', 'Failed to toggle microphone');
    }
  };

  const handleToggleSpeaker = async () => {
    const success = await ZegoExpressService.toggleSpeaker(!isSpeakerMuted);
    if (success) {
      setIsSpeakerMuted(!isSpeakerMuted);
    } else {
      Alert.alert('Error', 'Failed to toggle speaker');
    }
  };

  const handleEndCall = async (autoEnded = false) => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;

    if (!autoEnded) {
      Alert.alert('End Session', 'Are you sure you want to end this session?', [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => (callEndedRef.current = false),
        },
        {
          text: 'End',
          onPress: async () => {
            await performEndCall(false);
          },
        },
      ]);
    } else {
      await performEndCall(true);
    }
  };

  const performEndCall = async autoEnded => {
    try {
      console.log('🔚 Ending call...', { isHost, autoEnded });

      // Set flag to prevent multiple alerts
      callEndedRef.current = true;

      stopTimer();
      stopConnectionCheck();

      // Clean up room listener first to prevent additional alerts
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
        roomUnsubscribeRef.current = null;
      }

      await ZegoExpressService.destroy();

      if (isHost) {
        await RoomService.endRoom(roomId);
      } else {
        await RoomService.leaveRoom(roomId);
      }

      navigation.replace('SessionEnd', {
        sessionTime,
        plan,
        autoEnded,
      });
    } catch (error) {
      console.error('❌ Error ending call:', error);
      navigation.goBack();
    }
  };
  console.log(isJoined);
  useEffect(() => {
    console.log('🚀 VoiceCallScreen mounted', { isHost, roomId });
    initializeVoiceCall();

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      console.log('🧹 VoiceCallScreen cleanup');
      stopTimer();
      stopConnectionCheck();
      ZegoExpressService.destroy();
      backHandler.remove();
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
      }
    };
  }, []);

  // Enhanced room listener effect
  useEffect(() => {
    if (roomId) {
      console.log('👂 Setting up room listener for:', roomId, {
        isHost,
        isJoined,
      });

      roomUnsubscribeRef.current = RoomService.listenToRoom(roomId, room => {
        console.log('📡 Room update received:', {
          roomExists: !!room,
          status: room?.status,
          participantCount: room?.participantCount,
          hasListener: !!room?.listenerId,
          isHost,
          callEnded: callEndedRef.current,
        });

        // Skip processing if call already ended
        if (callEndedRef.current) {
          console.log('🚫 Ignoring room update - call already ended');
          return;
        }

        if (!room) {
          console.log('❌ Room no longer exists');
          Alert.alert('Session Ended', 'The room no longer exists.', [
            { text: 'OK', onPress: () => performEndCall(true) },
          ]);
          return;
        }

        // Handle room status changes
        if (room.status === 'ended') {
          console.log('🔚 Room ended by host/system');
          Alert.alert('Session Ended', 'The session has been ended.', [
            { text: 'OK', onPress: () => performEndCall(true) },
          ]);
          return;
        }

        // For listeners: detect when venter leaves
        if (!isHost && room.status === 'waiting' && isJoined) {
          console.log('🚪 Venter left the room, ending session for listener');
          Alert.alert('Session Ended', 'The venter has left the session.', [
            { text: 'OK', onPress: () => performEndCall(true) },
          ]);
          return;
        }

        // For hosts: detect when listener leaves during active session
        if (
          isHost &&
          room.status === 'active' &&
          !room.listenerId &&
          isJoined
        ) {
          console.log('🚪 Listener left the room');
          setRemoteStreamsCount(0);
          setRemoteUsers([]);
        }
      });
    }

    return () => {
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
        roomUnsubscribeRef.current = null;
      }
    };
  }, [roomId, isHost, isJoined]);

  // Debug logging effect
  useEffect(() => {
    console.log('📊 State update:', {
      isJoined,
      connectionStatus,
      remoteUsers: remoteUsers.length,
      remoteStreamsCount,
      isHost,
    });
  }, [isJoined, connectionStatus, remoteUsers.length, remoteStreamsCount]);
   
  useEffect(() => {
  console.log('🔍 isJoined state changed:', isJoined);
}, [isJoined]);
   

useEffect(() => {
  const debugInterval = setInterval(() => {
    const zegoInfo = ZegoExpressService.getConnectionInfo();
    console.log('🔍 Debug State Check:', {
      isJoined,
      connectionStatus,
      zegoInfo,
      remoteUsers: remoteUsers.length,
      remoteStreamsCount
    });
  }, 5000);

  return () => clearInterval(debugInterval);
}, [isJoined, connectionStatus, remoteUsers.length, remoteStreamsCount]);

  return (

    <GradientContainer>
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>
      <StatusBar />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.anonymousText}>You are anonymous</Text>
        </View>

        {/* Venter Avatar */}
        <View style={styles.venterContainer}>
          <Animated.View
            style={[
              styles.participantAvatar,
              styles.venterAvatar,
              { transform: [{ scale: venterPulseAnim }] },
            ]}
          >
            <Image
              source={require('../../assets/venter.jpeg')}
              style={styles.avatarImage}
            />
          </Animated.View>
          <Text style={styles.statusText}>
            {isHost ? 'Speaking...' : 'Listening...'}
          </Text>
          {isHost && (
            <View style={styles.youIndicator}>
              <Text style={styles.youText}>You</Text>
            </View>
          )}
        </View>

        {/* Timer & Vent Text */}
        <View style={styles.timerContainer}>
          <Text style={styles.planText}>{plan}</Text>
          <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
          <Text style={styles.timerRemainingText}>time remaining : {formatTime(timeRemaining)}</Text>
          <Text style={styles.timerSubtext}>
            {isJoined
              ? remoteStreamsCount > 0 || !isHost
                ? 'Connected! You can begin'
                : 'Waiting for listener...'
              : 'Connecting...'}
          </Text>

          {/* Vent Text */}
          {ventText && (
            <View style={styles.ventTextContainer}>
              <Text style={styles.ventLabel}>
                {isHost ? 'Your Vent:' : 'Listening to:'}
              </Text>
              <Text
                style={styles.ventText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                "{ventText}"
              </Text>
            </View>
          )}
        </View>

        {/* Listener Avatar */}
        <View style={styles.listenerContainer}>
          <Animated.View
            style={[
              styles.participantAvatar,
              styles.listenerAvatar,
              {
                opacity:
                  remoteStreamsCount > 0 || !isHost ? listenerFadeAnim : 0.3,
                transform: [
                  {
                    scale:
                      remoteStreamsCount > 0 || !isHost
                        ? listenerFadeAnim
                        : 0.8,
                  },
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/listener.png')}
              style={styles.avatarImage}
            />
          </Animated.View>
          <Text style={styles.statusText}>
            {!isHost
              ? 'You - Listening...'
              : remoteStreamsCount > 0
              ? 'Listening...'
              : 'Waiting...'}
          </Text>
          {!isHost && (
            <View style={styles.youIndicator}>
              <Text style={styles.youText}>You</Text>
            </View>
          )}
        </View>

        {/* Show controls for both host and listener when joined */}
        {isHost && (
          <VoiceControls
            muted={isMuted}
            speakerMuted={isSpeakerMuted}
            onToggleMute={handleToggleMute}
            onToggleSpeaker={handleToggleSpeaker}
            onEndCall={() => handleEndCall(false)}
            connectionStatus={connectionStatus}
            isHost={isHost}
          />
        )}
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circle1: {
    width: 120,
    height: 120,
    top: '15%',
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    top: '60%',
    left: -20,
  },
  circle3: {
    width: 200,
    height: 200,
    bottom: '10%',
    right: -60,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 5,
  },

  anonymousText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Venter (Top)
  venterContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  // Listener (Bottom)
  listenerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  // Participant Avatars
  participantAvatar: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },

  venterAvatar: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },

  listenerAvatar: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },

  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  youIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  youText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Timer & Vent Container
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    marginHorizontal: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  planText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },

  timerText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '200',
    fontFamily: 'monospace',
    marginBottom: 4,
    letterSpacing: 1.2,
  },
  
  timerRemainingText: {
    color: '#e41212ff',
    fontSize: 12
,    fontWeight: '50',
    fontFamily: 'center',
    marginBottom: 4,
    letterSpacing: 1.2,
  },

  timerSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 16,
    marginBottom: 8,
  },

  // Vent Text
  ventTextContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  ventLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  ventText: {
    color: 'rgba(34, 157, 176, 0.85)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
    fontStyle : 'bold',
  },
});