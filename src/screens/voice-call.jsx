import { useEffect, useState, useRef } from "react";
import { Text, StyleSheet, Alert, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { request, PERMISSIONS } from 'react-native-permissions';
import GradientContainer from "../../components/ui/GradientContainer";
import StatusBar from "../../components/ui/StatusBar";
import SessionTimer from "../../components/session/SessionTimer";
import ConnectionStatus from "../../components/session/ConnectionStatus";
import VoiceControls from "../../components/session/VoiceControls";
import useTimer from "../../hooks/useTimer";
import { firestore } from "../../config/firebase.config";
import { doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { auth } from "../../config/firebase.config";

import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngineEventHandler,
} from "react-native-agora";

const AGORA_APP_ID = "f16b94ea49fd47b5b65e86d20ef1badd";
// Note: In production, generate unique tokens for each session
const AGORA_TOKEN = null; // Using null for testing - should work for development

export default function VoiceCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { ventText, plan, channelName, isHost, isListener } = route.params;

  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [remoteUserIds, setRemoteUserIds] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("requesting_permissions");
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const engine = useRef(null);
  const [localUid, setLocalUid] = useState(0);
  const joinAttempts = useRef(0);
  const maxJoinAttempts = 3;

  // Enhanced logging for debugging
  const logWithPrefix = (message, data = null) => {
    const userType = isHost ? "VENTER" : "LISTENER";
    const prefix = `[${userType}] [${channelName}]`;
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  };

  const getDurationInSeconds = (planName) => {
    switch (planName) {
      case "10-Min Vent":
        return 10 * 60;
      case "30-Min Vent":
        return 30 * 60;
      default:
        return 20 * 60;
    }
  };

  const initialCallDuration = getDurationInSeconds(plan);

  const handleTimeUp = () => {
    Alert.alert("Session Ended", "Your session has ended automatically.", [
      {
        text: "OK",
        onPress: async () => {
          await destroyAgora();
          await updateRoomStatusInFirebase("ended");
          navigation.navigate("SessionEnd", {
            sessionTime: initialCallDuration,
            plan,
            autoEnded: true,
          });
        },
      },
    ]);
  };

  const { sessionTime, timeRemaining, stopTimer } = useTimer(initialCallDuration, handleTimeUp);

  // Request microphone permissions
  const requestPermissions = async () => {
    try {
      setConnectionStatus("requesting_permissions");
      logWithPrefix("Requesting microphone permissions...");
      
      const micPermission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.MICROPHONE 
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(micPermission);
      logWithPrefix("Permission result:", result);
      
      if (result === 'granted') {
        logWithPrefix("✅ Microphone permission granted");
        setPermissionsGranted(true);
        setConnectionStatus("connecting");
        return true;
      } else {
        logWithPrefix("❌ Microphone permission denied:", result);
        Alert.alert(
          "Permission Required",
          "Microphone access is required for voice calls. Please enable it in settings.",
          [
            { text: "Cancel", onPress: () => navigation.goBack() },
            { text: "Settings", onPress: () => {
              navigation.goBack();
            }}
          ]
        );
        return false;
      }
    } catch (error) {
      logWithPrefix("❌ Permission request error:", error);
      Alert.alert("Permission Error", "Failed to request microphone permission.");
      return false;
    }
  };

  const joinChannelWithRetry = async (engine, channelName, uid, hasPermissions = null) => {
    // Use the passed parameter or check the state
    const permissionCheck = hasPermissions !== null ? hasPermissions : permissionsGranted;
    if (!permissionCheck) {
      logWithPrefix("❌ Cannot join channel: permissions not granted", {
        hasPermissions,
        permissionsGranted,
        permissionCheck
      });
      return;
    }

    joinAttempts.current++;
    logWithPrefix(`🔄 Join attempt ${joinAttempts.current}/${maxJoinAttempts}`, {
      channelName,
      uid,
      isHost,
      isListener
    });

    try {
      setConnectionStatus("connecting");

      await engine.joinChannel(AGORA_TOKEN, channelName, uid, {
        autoSubscribeAudio: true,
        autoSubscribeVideo: false,
        publishMicrophoneTrack: true,
        publishCameraTrack: false,
      });

      logWithPrefix("✅ Join channel request sent successfully", {
        channelName,
        uid,
        token: AGORA_TOKEN ? "WITH_TOKEN" : "NULL_TOKEN"
      });
      
      joinAttempts.current = 0; // Reset on successful initiation
    } catch (error) {
      logWithPrefix(`❌ Join attempt ${joinAttempts.current} failed:`, error);

      if (joinAttempts.current < maxJoinAttempts) {
        logWithPrefix(`🔄 Retrying in 2 seconds...`);
        setConnectionStatus("reconnecting");

        setTimeout(() => {
          joinChannelWithRetry(engine, channelName, uid);
        }, 2000);
      } else {
        logWithPrefix("❌ Max join attempts reached");
        setConnectionStatus("failed");
        Alert.alert(
          "Connection Failed",
          "Unable to connect to voice channel after multiple attempts. Please check your internet connection and try again.",
          [
            {
              text: "Retry",
              onPress: () => {
                joinAttempts.current = 0;
                setConnectionStatus("connecting");
                joinChannelWithRetry(engine, channelName, uid);
              },
            },
            {
              text: "Exit",
              onPress: () => {
                navigation.navigate("SessionEnd", {
                  sessionTime: initialCallDuration,
                  plan,
                  autoEnded: true,
                });
              },
            },
          ]
        );
      }
    }
  };

  const initAgora = async (hasPermissions = null) => {
    try {
      if (!AGORA_APP_ID) {
        logWithPrefix("❌ Agora App ID is missing");
        Alert.alert("Configuration Error", "Agora App ID is missing");
        navigation.replace("Dashboard");
        return;
      }

      // Use the passed parameter or check the state
      const permissionCheck = hasPermissions !== null ? hasPermissions : permissionsGranted;
      if (!permissionCheck) {
        logWithPrefix("❌ Cannot initialize Agora: permissions not granted", {
          hasPermissions,
          permissionsGranted,
          permissionCheck
        });
        return;
      }

      logWithPrefix("🚀 Initializing Agora engine...", {
        appId: AGORA_APP_ID,
        channelName,
        isHost,
        isListener
      });

      engine.current = createAgoraRtcEngine();

      // Initialize the engine
      await engine.current.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      logWithPrefix("✅ Agora engine initialized");

      // Set client role - both host and listener should be broadcasters for two-way communication
      await engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      logWithPrefix("✅ Client role set to broadcaster");

      // Enable audio
      await engine.current.enableAudio();
      logWithPrefix("✅ Audio enabled");
      
      // Set audio profile for voice chat
      await engine.current.setAudioProfile(1, 1); // Music standard, stereo
      logWithPrefix("✅ Audio profile set");
      
      // Enable speaker by default
      await engine.current.setEnableSpeakerphone(true);
      setIsSpeakerEnabled(true);
      logWithPrefix("✅ Speaker enabled");

      // Set up event handlers
      const eventHandler: IRtcEngineEventHandler = {
        onJoinChannelSuccess: (connection, elapsed) => {
          logWithPrefix("🎉 SUCCESS: Joined channel!", {
            localUid: connection.localUid,
            channelName: connection.channelId,
            elapsed
          });
          
          setIsJoined(true);
          setConnectionStatus("connected");
          setLocalUid(connection.localUid || 0);
          
          // Ensure we're not muted initially
          engine.current?.muteLocalAudioStream(false);
          setIsMuted(false);
          joinAttempts.current = 0;

          // Update Firebase room when user joins
          updateRoomOnUserJoin(connection.localUid);
        },

        onUserJoined: (connection, remoteUid, elapsed) => {
          logWithPrefix("👤 Remote user joined:", {
            remoteUid,
            elapsed,
            totalRemoteUsers: remoteUserIds.length + 1
          });
          
          setRemoteUserIds((prev) => {
            if (!prev.includes(remoteUid)) {
              logWithPrefix("➕ Adding remote user to list:", remoteUid);
              return [...prev, remoteUid];
            }
            logWithPrefix("ℹ️ Remote user already in list:", remoteUid);
            return prev;
          });
        },

        onUserOffline: (connection, remoteUid, reason) => {
          logWithPrefix("👋 Remote user left:", {
            remoteUid,
            reason,
            reasonText: reason === 0 ? "User quit" : reason === 1 ? "Network lost" : "Unknown"
          });
          
          setRemoteUserIds((prev) => prev.filter((id) => id !== remoteUid));
        },

        onAudioVolumeIndication: (connection, speakers, speakerNumber, totalVolume) => {
          // Only log when there's actual audio activity
          if (speakers && speakers.length > 0) {
            speakers.forEach(speaker => {
              if (speaker.volume > 10) { // Only log significant volume
                logWithPrefix(`🔊 Audio activity from UID ${speaker.uid}: volume ${speaker.volume}`);
              }
            });
          }
        },

        onError: (err, msg) => {
          logWithPrefix("❌ Agora Error:", { errorCode: err, message: msg });

          // Handle specific error codes
          switch (err) {
            case 110:
              logWithPrefix("ℹ️ Error 110 - Known false positive, ignoring...");
              return; // Ignore this error
            case 101:
              setConnectionStatus("failed");
              Alert.alert("Configuration Error", "Invalid App ID or configuration.");
              break;
            case 2:
              logWithPrefix("⚠️ Invalid argument error - continuing...");
              break;
            case 17:
              logWithPrefix("🔄 SDK not initialized - reinitializing...");
              setTimeout(() => {
                // Pass true since we already have permissions if we got this far
                initAgora(true);
              }, 1000);
              break;
            case 109:
              logWithPrefix("🔑 Token expired - need to refresh token");
              setConnectionStatus("failed");
              Alert.alert("Session Expired", "Please restart the session.");
              break;
            default:
              logWithPrefix(`⚠️ Unhandled error ${err}: ${msg}`);
          }
        },

        onLeaveChannel: (connection, stats) => {
          logWithPrefix("👋 Left channel", stats);
          setIsJoined(false);
          setRemoteUserIds([]);
          setLocalUid(0);
          setConnectionStatus("connecting");
          stopTimer();
        },

        onConnectionStateChanged: (connection, state, reason) => {
          const stateNames = {
            1: "DISCONNECTED",
            2: "CONNECTING", 
            3: "CONNECTED",
            4: "RECONNECTING",
            5: "FAILED"
          };
          
          logWithPrefix("🔗 Connection state changed:", {
            state: stateNames[state] || state,
            reason,
            isCurrentlyJoined: isJoined
          });

          switch (state) {
            case 1: // DISCONNECTED
              setConnectionStatus("connecting");
              break;
            case 2: // CONNECTING
              setConnectionStatus("connecting");
              break;
            case 3: // CONNECTED
              setConnectionStatus("connected");
              break;
            case 4: // RECONNECTING
              setConnectionStatus("reconnecting");
              break;
            case 5: // FAILED
              logWithPrefix("❌ Connection failed - reason:", reason);
              if (!isJoined && joinAttempts.current < maxJoinAttempts) {
                logWithPrefix("🔄 Will retry due to connection state failure");
                setTimeout(() => {
                  const uid = Math.floor(Math.random() * 1000000);
                  joinChannelWithRetry(engine.current, channelName, uid, true);
                }, 2000);
              } else if (!isJoined) {
                setConnectionStatus("failed");
                Alert.alert("Connection Failed", "Unable to establish voice connection.");
              }
              break;
          }
        },

        onRejoinChannelSuccess: (connection, elapsed) => {
          logWithPrefix("🔄 Rejoin channel success", { elapsed });
          setIsJoined(true);
          setConnectionStatus("connected");
        },

        onConnectionLost: (connection) => {
          logWithPrefix("📡 Connection lost - will attempt to reconnect");
          setConnectionStatus("reconnecting");
        },

        onConnectionInterrupted: (connection) => {
          logWithPrefix("⚠️ Connection interrupted");
          setConnectionStatus("reconnecting");
        },

        onAudioRouteChanged: (routing) => {
          logWithPrefix("🔊 Audio route changed:", routing);
        },

        onRemoteAudioStateChanged: (connection, remoteUid, state, reason, elapsed) => {
          const stateNames = {
            0: "STOPPED",
            1: "STARTING", 
            2: "DECODING",
            3: "FROZEN",
            4: "FAILED"
          };
          
          logWithPrefix(`🎵 Remote audio state changed:`, {
            remoteUid,
            state: stateNames[state] || state,
            reason
          });
        },
      };

      engine.current.registerEventHandler(eventHandler);
      logWithPrefix("✅ Event handlers registered");

      if (!channelName) {
        logWithPrefix("❌ No channel name provided");
        Alert.alert("Session Error", "No channel name provided.");
        navigation.replace("Dashboard");
        return;
      }

      // Generate a random UID
      const uid = Math.floor(Math.random() * 1000000);
      logWithPrefix("🎯 Starting channel join process:", {
        channelName,
        uid,
        userType: isHost ? "VENTER" : "LISTENER"
      });

      // Join the channel
      await joinChannelWithRetry(engine.current, channelName, uid, permissionCheck);

    } catch (error) {
      logWithPrefix("❌ Agora Init Error:", error);
      setConnectionStatus("failed");
      Alert.alert("Setup Failed", `Failed to initialize voice call: ${error.message || error.toString()}`);
      navigation.replace("Dashboard");
    }
  };

  const updateRoomOnUserJoin = async (localUid) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        logWithPrefix("❌ No authenticated user found");
        return;
      }

      const roomRef = doc(firestore, "rooms", channelName);
      
      if (isHost) {
        // Venter joining - update room with venter info and start time
        await updateDoc(roomRef, {
          status: "active",
          startTime: serverTimestamp(),
          venterUid: localUid,
          lastActivity: serverTimestamp()
        });
        logWithPrefix("✅ Room updated - VENTER joined", { localUid });
      } else {
        // Listener joining - increment listener count
        await updateDoc(roomRef, {
          currentListeners: increment(1),
          lastActivity: serverTimestamp()
        });
        logWithPrefix("✅ Room updated - LISTENER joined", { localUid });
      }
    } catch (error) {
      logWithPrefix("❌ Failed to update room on user join:", error);
    }
  };

  const destroyAgora = async () => {
    if (engine.current) {
      try {
        logWithPrefix("🧹 Cleaning up Agora resources...");
        
        // Leave channel first
        if (isJoined) {
          await engine.current.leaveChannel();
          logWithPrefix("✅ Left channel");
        }
        
        // Release the engine
        engine.current.release();
        engine.current = null;
        logWithPrefix("✅ Engine released");
        
        setIsJoined(false);
        setRemoteUserIds([]);
        setConnectionStatus("connecting");
      } catch (error) {
        logWithPrefix("❌ Agora Cleanup Error:", error);
      }
    }
  };

  const updateRoomStatusInFirebase = async (status) => {
    if (channelName) {
      try {
        const roomRef = doc(firestore, "rooms", channelName);
        const updateData = {
          status,
          endTime: serverTimestamp(),
        };

        // If it's a listener leaving, decrement the count
        if (isListener && status === "ended") {
          updateData.currentListeners = increment(-1);
        }

        await updateDoc(roomRef, updateData);
        logWithPrefix("✅ Room status updated:", { status });
      } catch (error) {
        logWithPrefix("❌ Firebase Update Error:", error);
      }
    }
  };

  useEffect(() => {
    logWithPrefix("🎬 Component mounted - initializing call...", {
      ventText: ventText?.substring(0, 50) + "...",
      plan,
      channelName,
      isHost,
      isListener
    });

    const initializeCall = async () => {
      logWithPrefix("🎬 Starting initialization process...");
      const hasPermissions = await requestPermissions();
      logWithPrefix("📋 Permission check result:", { hasPermissions });
      
      if (hasPermissions) {
        logWithPrefix("✅ Proceeding to initialize Agora...");
        await initAgora(hasPermissions); // Pass the permission result directly
      } else {
        logWithPrefix("❌ Cannot proceed - no permissions");
      }
    };

    initializeCall();

    return () => {
      logWithPrefix("🎬 Component unmounting - cleaning up...");
      stopTimer();
      destroyAgora();
      if (isJoined) {
        updateRoomStatusInFirebase("ended");
      }
    };
  }, []);

  const toggleMute = async () => {
    if (engine.current && isJoined) {
      try {
        const newMutedState = !isMuted;
        await engine.current.muteLocalAudioStream(newMutedState);
        setIsMuted(newMutedState);
        logWithPrefix("🎤 Mute toggled:", { muted: newMutedState });
      } catch (error) {
        logWithPrefix("❌ Toggle mute error:", error);
        Alert.alert("Error", "Failed to toggle microphone");
      }
    } else {
      logWithPrefix("⚠️ Cannot toggle mute: engine not ready or not joined");
    }
  };

  const toggleSpeaker = async () => {
    if (engine.current && isJoined) {
      try {
        const newSpeakerState = !isSpeakerEnabled;
        await engine.current.setEnableSpeakerphone(newSpeakerState);
        setIsSpeakerEnabled(newSpeakerState);
        logWithPrefix("🔊 Speaker toggled:", { enabled: newSpeakerState });
      } catch (error) {
        logWithPrefix("❌ Toggle speaker error:", error);
        Alert.alert("Error", "Failed to toggle speaker");
      }
    } else {
      logWithPrefix("⚠️ Cannot toggle speaker: engine not ready or not joined");
    }
  };

  const handleEndCall = async () => {
    Alert.alert("End Session", "Are you sure you want to end this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        onPress: async () => {
          logWithPrefix("👋 User ended call manually");
          stopTimer();
          await destroyAgora();
          await updateRoomStatusInFirebase("ended");
          navigation.navigate("SessionEnd", {
            sessionTime,
            plan,
            autoEnded: false,
          });
        },
      },
    ]);
  };

  const handleRetryConnection = async () => {
    logWithPrefix("🔄 Retrying connection...");
    
    if (!permissionsGranted) {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;
    }

    joinAttempts.current = 0;
    setConnectionStatus("connecting");
    
    if (engine.current && channelName) {
      const uid = Math.floor(Math.random() * 1000000);
      await joinChannelWithRetry(engine.current, channelName, uid, true);
    } else {
      // Re-initialize if engine is null
      await initAgora(true);
    }
  };

  return (
    <GradientContainer>
      <StatusBar />
      <SessionTimer sessionTime={sessionTime} timeRemaining={timeRemaining} plan={plan} />
      <Text style={styles.ventTextDisplay}>{ventText}</Text>

      <ConnectionStatus
        joined={isJoined}
        remoteUsers={remoteUserIds}
        timeRemaining={timeRemaining}
        connectionStatus={connectionStatus}
        onRetry={handleRetryConnection}
      />

      <VoiceControls
        muted={isMuted}
        speakerEnabled={isSpeakerEnabled}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onEndCall={handleEndCall}
        disabled={!isJoined || connectionStatus === "requesting_permissions"}
        connectionStatus={connectionStatus}
      />
      
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  ventTextDisplay: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
    paddingHorizontal: 24,
    lineHeight: 22,
  },
});  