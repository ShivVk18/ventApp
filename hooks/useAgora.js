import { useState, useEffect, useRef } from "react"
import { Alert, PermissionsAndroid, Platform } from "react-native"
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  AudioProfileType,
  AudioScenarioType,
} from "react-native-agora"

import { AGORA_APP_ID, AGORA_TOKEN, validateAgoraConfig } from "../config/agora.config"

const useAgora = (channelName, onUserJoined, onUserLeft) => {
  const [engine, setEngine] = useState(null)
  const [joined, setJoined] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [muted, setMuted] = useState(false)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [connectionState, setConnectionState] = useState("disconnected")
  const [isInitialized, setIsInitialized] = useState(false)

  // Use ref to store engine instance for cleanup
  const engineRef = useRef(null)

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.MODIFY_AUDIO_SETTINGS,
        ])

        return (
          granted["android.permission.RECORD_AUDIO"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.MODIFY_AUDIO_SETTINGS"] === PermissionsAndroid.RESULTS.GRANTED
        )
      } catch (err) {
        console.warn("Permission request error:", err)
        return false
      }
    }
    return true
  }

  const initAgora = async () => {
    try {
      // Validate configuration
      validateAgoraConfig()

      // Request permissions
      const hasPermission = await requestPermissions()
      if (!hasPermission) {
        Alert.alert("Permission Required", "Audio permissions are required for voice calls")
        return
      }

      // Create RTC engine
      const agoraEngine = createAgoraRtcEngine()
      engineRef.current = agoraEngine
      setEngine(agoraEngine)

      // Initialize the engine
      agoraEngine.initialize({
        appId: AGORA_APP_ID,
        // Enable audio processing
        audioScenario: AudioScenarioType.AudioScenarioMeeting,
      })

      // Set up event listeners
      setupEventListeners(agoraEngine)

      // Enable audio module
      agoraEngine.enableAudio()

      // Set channel profile
      agoraEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication)

      // Set audio profile
      agoraEngine.setAudioProfile(AudioProfileType.AudioProfileSpeechStandard)

      // Set client role (for communication, both are broadcasters)
      agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster)

      // Enable speaker by default
      agoraEngine.setEnableSpeakerphone(true)

      setIsInitialized(true)

      // Join channel
      const result = await agoraEngine.joinChannel(AGORA_TOKEN, channelName, 0, {
        // Optional: set user account
      })

      console.log("Join channel result:", result)
    } catch (error) {
      console.error("Agora initialization error:", error)

      let errorMessage = "Failed to initialize voice call"
      if (error.message?.includes("App ID") || error.message?.includes("appId")) {
        errorMessage = "Invalid Agora App ID. Please check your configuration."
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your internet connection."
      } else if (error.message?.includes("permission")) {
        errorMessage = "Audio permission denied. Please enable microphone access."
      }

      Alert.alert("Voice Call Error", errorMessage)
      setConnectionState("failed")
    }
  }

  const setupEventListeners = (agoraEngine) => {
    // Register event handlers
    agoraEngine.registerEventHandler({
      // User joined channel
      onUserJoined: (connection, remoteUid, elapsed) => {
        console.log("User joined:", remoteUid, elapsed)
        setRemoteUsers((users) => {
          if (!users.includes(remoteUid)) {
            return [...users, remoteUid]
          }
          return users
        })
        onUserJoined?.(remoteUid)
      },

      // User left channel
      onUserOffline: (connection, remoteUid, reason) => {
        console.log("User offline:", remoteUid, reason)
        setRemoteUsers((users) => users.filter((user) => user !== remoteUid))
        onUserLeft?.(remoteUid)
      },

      // Successfully joined channel
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log("Join channel success:", connection.channelId, elapsed)
        setJoined(true)
        setConnectionState("connected")
      },

      // Left channel
      onLeaveChannel: (connection, stats) => {
        console.log("Leave channel:", stats)
        setJoined(false)
        setRemoteUsers([])
        setConnectionState("disconnected")
      },

      // Connection state changed
      onConnectionStateChanged: (connection, state, reason) => {
        console.log("Connection state changed:", state, reason)
        setConnectionState(state.toString().toLowerCase())
      },

      // Error occurred
      onError: (err, msg) => {
        console.error("Agora Error:", err, msg)

        let errorMessage = "Voice call error occurred"
        switch (err) {
          case 2:
            errorMessage = "Invalid App ID"
            break
          case 5:
            errorMessage = "Invalid token"
            break
          case 17:
            errorMessage = "Channel join failed"
            break
          case 1001:
            errorMessage = "Network connection lost"
            break
          default:
            errorMessage = msg || "Unknown error occurred"
        }

        Alert.alert("Voice Call Error", errorMessage)
        setConnectionState("failed")
      },

      // Audio route changed
      onAudioRouteChanged: (routing) => {
        console.log("Audio route changed:", routing)
      },

      // Local audio state changed
      onLocalAudioStateChanged: (connection, state, error) => {
        console.log("Local audio state changed:", state, error)
      },

      // Remote audio state changed
      onRemoteAudioStateChanged: (connection, remoteUid, state, reason, elapsed) => {
        console.log("Remote audio state changed:", remoteUid, state, reason)
      },
    })
  }

  const toggleMute = async () => {
    if (engine && isInitialized) {
      try {
        const newMutedState = !muted
        await engine.muteLocalAudioStream(newMutedState)
        setMuted(newMutedState)
        console.log("Mute toggled:", newMutedState)
      } catch (error) {
        console.error("Error toggling mute:", error)
      }
    }
  }

  const toggleSpeaker = async () => {
    if (engine && isInitialized) {
      try {
        const newSpeakerState = !speakerEnabled
        await engine.setEnableSpeakerphone(newSpeakerState)
        setSpeakerEnabled(newSpeakerState)
        console.log("Speaker toggled:", newSpeakerState)
      } catch (error) {
        console.error("Error toggling speaker:", error)
      }
    }
  }

  const leaveChannel = async () => {
    if (engine && isInitialized && joined) {
      try {
        await engine.leaveChannel()
        setJoined(false)
        setRemoteUsers([])
        setConnectionState("disconnected")
        console.log("Left channel successfully")
      } catch (error) {
        console.error("Error leaving channel:", error)
      }
    }
  }

  const destroy = async () => {
    if (engineRef.current) {
      try {
        // Leave channel first if joined
        if (joined) {
          await engineRef.current.leaveChannel()
        }

        // Unregister event handlers
        engineRef.current.unregisterEventHandler()

        // Release engine
        engineRef.current.release()

        engineRef.current = null
        setEngine(null)
        setIsInitialized(false)
        setJoined(false)
        setRemoteUsers([])
        setConnectionState("disconnected")

        console.log("Agora engine destroyed")
      } catch (error) {
        console.error("Error destroying engine:", error)
      }
    }
  }

  // Initialize when channel name is provided
  useEffect(() => {
    if (channelName && !isInitialized) {
      initAgora()
    }

    // Cleanup on unmount or channel change
    return () => {
      if (channelName) {
        destroy()
      }
    }
  }, [channelName])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [])

  return {
    // Connection state
    joined,
    remoteUsers,
    connectionState,
    isInitialized,

    // Audio controls
    muted,
    speakerEnabled,
    toggleMute,
    toggleSpeaker,

    // Channel controls
    leaveChannel,

    // Engine instance (for advanced usage)
    engine,
  }
}

export default useAgora