import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, Alert, BackHandler } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import GradientContainer from "../../components/ui/GradientContainer"
import StatusBar from "../../components/ui/StatusBar"
import SessionTimer from "../../components/session/SessionTimer"
import VoiceControls from "../../components/voice/VoiceControl"
import useTimer from "../../hooks/useTimer"
import ZegoExpressService from "../../services/ZegoExpressService"
import RoomService from "../../services/RoomService"
import { auth } from "../../config/firebase.config"

// Replace with your ZegoCloud credentials
const ZEGO_APP_ID = 348919014 // Your App ID
const ZEGO_APP_SIGN = "3e1bd2e901019273151648fbb35d45e912425fcf93e07e38a571dca4c58688d1" 

export default function VoiceCallScreen() {
  const navigation = useNavigation()
  const route = useRoute()

  const { ventText, plan, roomId, isHost } = route.params

  // State management
  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [remoteUsers, setRemoteUsers] = useState([])
  const [soundLevels, setSoundLevels] = useState({})
  const [networkQuality, setNetworkQuality] = useState({})

  const roomUnsubscribeRef = useRef(null)
  const callEndedRef = useRef(false)

  const initialCallDuration = RoomService.getDurationInSeconds(plan)

  const handleTimeUp = () => {
    Alert.alert("Session Ended", "Your session has ended automatically.", [
      {
        text: "OK",
        onPress: async () => {
          await handleEndCall(true)
        },
      },
    ])
  }

  const { sessionTime, timeRemaining, stopTimer } = useTimer(initialCallDuration, handleTimeUp)

  const handleBackPress = () => {
    Alert.alert("End Session", "Are you sure you want to end this session?", [
      { text: "Cancel", style: "cancel" },
      { text: "End", onPress: () => handleEndCall(false) },
    ])
    return true
  }

  const initializeVoiceCall = async () => {
    try {
      console.log("🎬 Initializing voice call...", { roomId, isHost })

      setConnectionStatus("requesting_permissions")

      // Request permissions
      const hasPermissions = await ZegoExpressService.requestPermissions()
      if (!hasPermissions) {
        Alert.alert("Permission Required", "Microphone access is required for voice calls.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ])
        return
      }

      setConnectionStatus("initializing")

      // Create engine
      const engineCreated = await ZegoExpressService.createEngine(ZEGO_APP_ID, ZEGO_APP_SIGN)
      if (!engineCreated) {
        throw new Error("Failed to create ZegoExpressEngine")
      }

      setConnectionStatus("connecting")

      // Login to room
      const user = auth.currentUser
      const userID = user?.uid || `user_${Math.floor(Math.random() * 10000)}`
      const userName = user?.email || `User_${userID.slice(0, 6)}`

      const joined = await ZegoExpressService.loginRoom(roomId, userID, userName, {
        onRoomStateUpdate: handleRoomStateUpdate,
        onUserUpdate: handleUserUpdate,
        onStreamUpdate: handleStreamUpdate,
        onSoundLevelUpdate: handleSoundLevelUpdate,
        onNetworkQuality: handleNetworkQuality,
      })

      if (!joined) {
        throw new Error("Failed to join voice room")
      }

      // Enable audio volume evaluation
      await ZegoExpressService.enableAudioVolumeEvaluation(true)
    } catch (error) {
      console.error("❌ Voice call initialization failed:", error)
      setConnectionStatus("failed")
      Alert.alert("Connection Failed", `Unable to initialize voice call: ${error.message}`, [
        { text: "Retry", onPress: () => initializeVoiceCall() },
        { text: "Cancel", onPress: () => navigation.goBack() },
      ])
    }
  }

  const handleRoomStateUpdate = (state, errorCode) => {
    console.log("🏠 Room state update:", { state, errorCode })

    if (errorCode !== 0) {
      console.error("❌ Room error:", errorCode)
      setConnectionStatus("failed")
      return
    }

    switch (state) {
      case "CONNECTED":
        setConnectionStatus("connected")
        setIsJoined(true)
        break
      case "CONNECTING":
        setConnectionStatus("connecting")
        break
      case "DISCONNECTED":
        setConnectionStatus("disconnected")
        break
    }
  }

  const handleUserUpdate = (updateType, userList) => {
    console.log("👥 User update:", { updateType, userCount: userList.length })

    if (updateType === 0) {
      // User added
      setRemoteUsers((prev) => [...prev, ...userList])
    } else {
      // User removed
      const removedUserIDs = userList.map((user) => user.userID)
      setRemoteUsers((prev) => prev.filter((user) => !removedUserIDs.includes(user.userID)))
    }
  }

  const handleStreamUpdate = (updateType, streamList) => {
    console.log("🌊 Stream update:", { updateType, streamCount: streamList.length })
    // ZegoExpressService handles stream playback internally
  }

  const handleSoundLevelUpdate = (soundLevels) => {
    setSoundLevels(soundLevels)
  }

  const handleNetworkQuality = (userID, upstreamQuality, downstreamQuality) => {
    setNetworkQuality((prev) => ({
      ...prev,
      [userID]: { upstreamQuality, downstreamQuality },
    }))
  }

  const handleToggleMute = async () => {
    if (!isJoined) return

    const success = await ZegoExpressService.toggleMicrophone(!isMuted)
    if (success) {
      setIsMuted(!isMuted)
    } else {
      Alert.alert("Error", "Failed to toggle microphone")
    }
  }

  const handleToggleSpeaker = async () => {
    if (!isJoined) return

    const success = await ZegoExpressService.toggleSpeaker(!isSpeakerMuted)
    if (success) {
      setIsSpeakerMuted(!isSpeakerMuted)
    } else {
      Alert.alert("Error", "Failed to toggle speaker")
    }
  }

  const handleEndCall = async (autoEnded = false) => {
    if (callEndedRef.current) return
    callEndedRef.current = true

    if (!autoEnded) {
      Alert.alert("End Session", "Are you sure you want to end this session?", [
        { text: "Cancel", style: "cancel", onPress: () => (callEndedRef.current = false) },
        {
          text: "End",
          onPress: async () => {
            await performEndCall(false)
          },
        },
      ])
    } else {
      await performEndCall(true)
    }
  }

  const performEndCall = async (autoEnded) => {
    console.log("👋 Ending call...", { autoEnded })

    try {
      stopTimer()

      // Leave voice room
      await ZegoExpressService.destroy()

      // Update Firebase room
      if (isHost) {
        await RoomService.endRoom(roomId)
      }

      // Navigate to session end screen
      navigation.replace("SessionEnd", {
        sessionTime,
        plan,
        autoEnded,
      })
    } catch (error) {
      console.error("❌ Error ending call:", error)
      navigation.goBack()
    }
  }

  useEffect(() => {
    initializeVoiceCall()

    // Handle Android back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress)

    return () => {
      console.log("🧹 Cleaning up voice call...")
      stopTimer()
      ZegoExpressService.destroy()
      backHandler.remove()
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current()
      }
    }
  }, [])

  // Room status listener
  useEffect(() => {
    if (roomId && isJoined) {
      roomUnsubscribeRef.current = RoomService.listenToRoom(roomId, (room) => {
        if (room && room.status === "ended" && !callEndedRef.current) {
          Alert.alert("Session Ended", "The session has been ended.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ])
        }
      })
    }

    return () => {
      if (roomUnsubscribeRef.current) {
        roomUnsubscribeRef.current()
      }
    }
  }, [roomId, isJoined, navigation])

  // Get remote streams count
  const remoteStreamsCount = ZegoExpressService.getRemoteStreamsCount()

  return (
    <GradientContainer>
      <StatusBar />
      <View style={styles.container}>
        <SessionTimer sessionTime={sessionTime} timeRemaining={timeRemaining} plan={plan} />

        <View style={styles.ventContainer}>
          <Text style={styles.ventLabel}>{isHost ? "Your Vent:" : "Listening to:"}</Text>
          <Text style={styles.ventTextDisplay}>{ventText}</Text>
        </View>

        <View style={styles.participantsContainer}>
          <Text style={styles.participantsText}>
            👥 {remoteStreamsCount + 1} participant{remoteStreamsCount !== 0 ? "s" : ""} connected
          </Text>
          {isHost && remoteStreamsCount === 0 && (
            <Text style={styles.waitingText}>Waiting for a listener to join...</Text>
          )}
        </View>

        <VoiceControls
          muted={isMuted}
          speakerMuted={isSpeakerMuted}
          onToggleMute={handleToggleMute}
          onToggleSpeaker={handleToggleSpeaker}
          onEndCall={() => handleEndCall(false)}
          disabled={!isJoined}
          connectionStatus={connectionStatus}
        />
      </View>
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  ventContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  ventLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  ventTextDisplay: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 22,
    maxHeight: 100,
  },
  participantsContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  participantsText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 5,
  },
  waitingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontStyle: "italic",
  },
})
