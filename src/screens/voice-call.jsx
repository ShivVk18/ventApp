import { useEffect, useState, useRef } from "react";
import { Text, StyleSheet, Alert, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import GradientContainer from "../components/ui/GradientContainer";
import StatusBar from "../components/ui/StatusBar";
import SessionTimer from "../components/session/SessionTimer";
import ConnectionStatus from "../components/session/ConnectionStatus";
import VoiceControls from "../components/voice/VoiceControls";
import useTimer from "../hooks/useTimer";
import VoiceCallService from "../services/VoiceCallService";
import RoomService from "../services/RoomService";
import { auth } from "../config/firebase.config";

const AGORA_APP_ID = "f16b94ea49fd47b5b65e86d20ef1badd";

/**
 * @typedef {object} RouteParams
 * @property {string} ventText
 * @property {string} plan
 * @property {string} channelName
 * @property {boolean} isHost
 * @property {boolean} isListener
 */

export default function VoiceCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  /** @type {RouteParams} */
  const { ventText, plan, channelName, isHost, isListener } = route.params;

  // State management
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [remoteUserIds, setRemoteUserIds] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("requesting_permissions");
  const [localUid, setLocalUid] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const roomUnsubscribeRef = useRef(null);

  // Timer configuration
  const initialCallDuration = RoomService.getDurationInSeconds(plan);

  const handleTimeUp = () => {
    Alert.alert("Session Ended", "Your session has ended automatically.", [
      {
        text: "OK",
        onPress: async () => {
          await handleEndCall(true);
        },
      },
    ]);
  };

  const { sessionTime, timeRemaining, stopTimer } = useTimer(
    initialCallDuration,
    handleTimeUp
  );

  // Initialize voice call service
  useEffect(() => {
    const initializeVoiceCall = async () => {
      try {
        console.log("🎬 Initializing voice call...", {
          channelName,
          isHost,
          isListener,
          plan,
        });

        // Request permissions
        setConnectionStatus("requesting_permissions");
        const hasPermissions = await VoiceCallService.requestPermissions();

        if (!hasPermissions) {
          Alert.alert(
            "Permission Required",
            "Microphone access is required for voice calls.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
          return;
        }

        setPermissionsGranted(true);
        setConnectionStatus("connecting");

        // Initialize voice service
        const initialized = await VoiceCallService.initialize({
          appId: AGORA_APP_ID,
          channelName,
          token: null,
          isHost,
          onJoinSuccess: handleJoinSuccess,
          onUserJoined: handleUserJoined,
          onUserLeft: handleUserLeft,
          onConnectionStateChanged: handleConnectionStateChanged,
          onError: handleVoiceError,
        });

        if (!initialized) {
          throw new Error("Failed to initialize voice service");
        }

        // Join channel
        const joined = await VoiceCallService.joinChannel();
        if (!joined) {
          throw new Error("Failed to join voice channel");
        }
      } catch (error) {
        console.error("❌ Voice call initialization failed:", error);
        setConnectionStatus("failed");
        Alert.alert("Connection Failed", "Unable to initialize voice call.");
      }
    };

    initializeVoiceCall();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up voice call...");
      stopTimer();
      VoiceCallService.destroy();
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
      }
    };
  }, [channelName, isHost, isListener, navigation, plan]);

  // Room status listener
  useEffect(() => {
    if (channelName) {
      roomUnsubscribeRef.current = RoomService.listenToRoom(channelName, (room) => {
        if (room) {
          console.log("📡 Room status update:", room.status);

          // Handle room ending
          if (room.status === "ended" && isJoined) {
            Alert.alert("Session Ended", "The session has been ended by the host.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          }
        }
      });
    }

    return () => {
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current();
      }
    };
  }, [channelName, isJoined, navigation]);

  // Voice call event handlers
  const handleJoinSuccess = async (uid) => {
    console.log("🎉 Successfully joined voice channel:", uid);
    setIsJoined(true);
    setLocalUid(uid);
    setConnectionStatus("connected");

    // Update room status
    const user = auth.currentUser;
    if (user) {
      await RoomService.updateParticipantConnection(channelName, user.uid, true, uid);

      if (isHost) {
        await RoomService.updateRoomStatus(channelName, "active");
      }
    }
  };

  const handleUserJoined = (uid) => {
    console.log("👤 Remote user joined:", uid);
    setRemoteUserIds((prev) => {
      if (!prev.includes(uid)) {
        return [...prev, uid];
      }
      return prev;
    });
  };

  const handleUserLeft = (uid) => {
    console.log("👋 Remote user left:", uid);
    setRemoteUserIds((prev) => prev.filter((id) => id !== uid));
  };

  const handleConnectionStateChanged = (state) => {
    console.log("🔗 Connection state:", state);

    switch (state) {
      case "CONNECTING":
        setConnectionStatus("connecting");
        break;
      case "CONNECTED":
        setConnectionStatus("connected");
        break;
      case "RECONNECTING":
        setConnectionStatus("reconnecting");
        break;
      case "FAILED":
        setConnectionStatus("failed");
        break;
      case "DISCONNECTED":
        setConnectionStatus("connecting");
        break;
      default:
        console.warn(`Unhandled connection state: ${state}`);
        break;
    }
  };

  const handleVoiceError = (error) => {
    console.error("❌ Voice call error:", error);

    if (error.code === 101) {
      Alert.alert("Configuration Error", "Invalid App ID or configuration.");
    } else if (error.code === 109) {
      Alert.alert("Session Expired", "Please restart the session.");
    } else if (error.code === 110) {
      Alert.alert("Token Invalid", "The authentication token is invalid. Please restart the app.");
    } else {
      console.log("⚠️ Non-critical voice error:", error);
    }
  };

  // Control handlers
  const handleToggleMute = async () => {
    const success = await VoiceCallService.toggleMute(!isMuted);
    if (success) {
      setIsMuted(!isMuted);
    } else {
      Alert.alert("Error", "Failed to toggle microphone");
    }
  };

  const handleToggleSpeaker = async () => {
    const success = await VoiceCallService.toggleSpeaker(!isSpeakerEnabled);
    if (success) {
      setIsSpeakerEnabled(!isSpeakerEnabled);
    } else {
      Alert.alert("Error", "Failed to toggle speaker");
    }
  };

  const handleEndCall = async (autoEnded = false) => {
    if (!autoEnded) {
      Alert.alert("End Session", "Are you sure you want to end this session?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          onPress: async () => {
            await performEndCall(false);
          },
        },
      ]);
    } else {
      await performEndCall(true);
    }
  };

  const performEndCall = async (autoEnded) => {
    console.log("👋 Ending call...", { autoEnded });

    try {
      stopTimer();

      await VoiceCallService.destroy();

      await RoomService.leaveRoom(channelName, isListener);

      navigation.navigate("SessionEnd", {
        sessionTime,
        plan,
        autoEnded,
      });
    } catch (error) {
      console.error("❌ Error ending call:", error);
      navigation.goBack();
    }
  };

  const handleRetryConnection = async () => {
    console.log("🔄 Retrying connection...");
    setConnectionStatus("connecting");

    try {
      const joined = await VoiceCallService.joinChannel();
      if (!joined) {
        setConnectionStatus("failed");
      }
    } catch (error) {
      console.error("❌ Retry failed:", error);
      setConnectionStatus("failed");
    }
  };

  return (
    <GradientContainer>
      <StatusBar />

      <View style={styles.container}>
        <SessionTimer sessionTime={sessionTime} timeRemaining={timeRemaining} plan={plan} />

        <Text style={styles.ventTextDisplay}>{ventText}</Text>

        <ConnectionStatus
          joined={isJoined}
          remoteUsers={remoteUserIds}
          timeRemaining={timeRemaining}
          connectionStatus={connectionStatus}
          onRetry={handleRetryConnection}
          isHost={isHost}
        />

        <VoiceControls
          muted={isMuted}
          speakerEnabled={isSpeakerEnabled}
          onToggleMute={handleToggleMute}
          onToggleSpeaker={handleToggleSpeaker}
          onEndCall={() => handleEndCall(false)}
          disabled={!isJoined || connectionStatus === "requesting_permissions"}
          connectionStatus={connectionStatus}
        />
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  ventTextDisplay: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
    paddingHorizontal: 24,
    lineHeight: 22,
    maxHeight: 100,
  },
});