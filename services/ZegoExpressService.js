import ZegoExpressEngine from "zego-express-engine-reactnative"
import { Platform } from "react-native"
import { request, PERMISSIONS } from "react-native-permissions"

class ZegoExpressService {
  constructor() {
    this.engine = null
    this.isInitialized = false
    this.roomID = null
    this.userID = null
    this.userName = null
    this.streamID = null
    this.remoteStreams = new Map()
    this.eventListeners = new Map()
  }

  async requestPermissions() {
    const permission = Platform.OS === "ios" ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO

    const result = await request(permission)
    console.log("🎤 Microphone permission result:", result)
    return result === "granted"
  }

  async createEngine(appID, appSign) {
    if (this.isInitialized) {
      console.log("✅ Engine already initialized")
      return true
    }

    try {
      console.log("🚀 Creating ZegoExpressEngine...")
      this.engine = await ZegoExpressEngine.createEngineWithProfile({
        appID: appID,
        appSign: appSign,
        scenario: 0, // General scenario
        enablePlatformView: false, 
      })

      console.log("✅ ZegoExpressEngine created successfully")
      this.isInitialized = true
      return true
    } catch (error) {
      console.error("❌ Failed to create ZegoExpressEngine:", error)
      return false
    }
  }

  async loginRoom(roomID, userID, userName, config = {}) {
    if (!this.isInitialized || !this.engine) {
      console.error("❌ Engine not initialized")
      return false
    }

    try {
      console.log("🚪 Logging into room:", roomID)
      this.roomID = roomID
      this.userID = userID
      this.userName = userName
      this.streamID = `stream_${userID}`

      // Set up event handlers
      this.setupEventHandlers(config)

      // Login to room
      const result = await this.engine.loginRoom(roomID, {
        userID: userID,
        userName: userName,
      })

      if (result.errorCode !== 0) {
        console.error("❌ Failed to login room:", result)
        return false
      }

      console.log("✅ Logged into room successfully")

      // Enable audio capture and unmute microphone
      await this.engine.enableAudioCaptureDevice(true)
      await this.engine.muteMicrophone(false)
      
      // Enable speaker output (route audio to speaker)
      await this.engine.setAudioRouteToSpeaker(true)

      // Start publishing
      await this.startPublishing()

      return true
    } catch (error) {
      console.error("❌ Failed to login room:", error)
      return false
    }
  }

  async startPublishing() {
    if (!this.isInitialized || !this.engine || !this.roomID) {
      console.error("❌ Cannot start publishing: not logged in")
      return false
    }

    try {
      console.log("📢 Starting publishing stream:", this.streamID)
      await this.engine.startPublishingStream(this.streamID)
      console.log("✅ Started publishing successfully")
      return true
    } catch (error) {
      console.error("❌ Failed to start publishing:", error)
      return false
    }
  }

  setupEventHandlers(config) {
    if (!this.engine) return

    // Clear any existing event handlers
    this.removeEventHandlers()

    // Room state update
    this.engine.on("roomStateUpdate", (roomID, state, errorCode, extendedData) => {
      console.log("🏠 Room state update:", { roomID, state, errorCode })
      config.onRoomStateUpdate?.(state, errorCode)
    })

    // Room user update
    this.engine.on("roomUserUpdate", (roomID, updateType, userList) => {
      console.log("👥 Room user update:", {
        roomID,
        updateType: updateType === 0 ? "ADD" : "DELETE",
        userCount: userList.length,
      })
      config.onUserUpdate?.(updateType, userList)
    })

    // Room stream update
    this.engine.on("roomStreamUpdate", (roomID, updateType, streamList) => {
      console.log("🌊 Room stream update:", {
        roomID,
        updateType: updateType === 0 ? "ADD" : "DELETE",
        streamCount: streamList.length,
      })

      if (updateType === 0) {
        // Stream added
        streamList.forEach((stream) => {
          if (stream.streamID !== this.streamID) {
            this.remoteStreams.set(stream.streamID, stream)
            this.engine.startPlayingStream(stream.streamID)
            console.log("▶️ Started playing remote stream:", stream.streamID)
          }
        })
      } else {
        // Stream deleted
        streamList.forEach((stream) => {
          if (this.remoteStreams.has(stream.streamID)) {
            this.engine.stopPlayingStream(stream.streamID)
            this.remoteStreams.delete(stream.streamID)
            console.log("⏹️ Stopped playing remote stream:", stream.streamID)
          }
        })
      }

      config.onStreamUpdate?.(updateType, streamList)
    })

    // Audio volume callback - corrected event name
    this.engine.on("capturedSoundLevelUpdate", (soundLevel) => {
      config.onSoundLevelUpdate?.(soundLevel)
    })

    // Remote sound level callback
    this.engine.on("remoteSoundLevelUpdate", (soundLevels) => {
      config.onRemoteSoundLevelUpdate?.(soundLevels)
    })

    // Network quality update
    this.engine.on("networkQuality", (userID, upstreamQuality, downstreamQuality) => {
      config.onNetworkQuality?.(userID, upstreamQuality, downstreamQuality)
    })

    
    this.eventListeners.set("roomStateUpdate", config.onRoomStateUpdate)
    this.eventListeners.set("roomUserUpdate", config.onUserUpdate)
    this.eventListeners.set("roomStreamUpdate", config.onStreamUpdate)
    this.eventListeners.set("capturedSoundLevelUpdate", config.onSoundLevelUpdate)
    this.eventListeners.set("remoteSoundLevelUpdate", config.onRemoteSoundLevelUpdate)
    this.eventListeners.set("networkQuality", config.onNetworkQuality)
  }

  removeEventHandlers() {
    if (!this.engine) return

    this.engine.off("roomStateUpdate")
    this.engine.off("roomUserUpdate")
    this.engine.off("roomStreamUpdate")
    this.engine.off("capturedSoundLevelUpdate")
    this.engine.off("remoteSoundLevelUpdate")
    this.engine.off("networkQuality")

    this.eventListeners.clear()
  }

  async logoutRoom() {
  if (!this.isInitialized || !this.engine || !this.roomID) {
    console.log("⚠️ Not logged in, nothing to logout")
    return true
  }

  try {
    console.log("🚪 Logging out of room:", this.roomID)

    // Stop publishing
    if (this.streamID) {
      await this.engine.stopPublishingStream()
    }

    // Stop all remote streams
    for (const streamID of this.remoteStreams.keys()) {
      await this.engine.stopPlayingStream(streamID)
    }
    this.remoteStreams.clear()

    // Logout from room
    await this.engine.logoutRoom(this.roomID)

    // Remove event handlers
    this.removeEventHandlers()

    // Reset room info
    this.roomID = null
    this.streamID = null

    console.log("✅ Logged out of room successfully")
    return true
  } catch (error) {
    console.error("❌ Failed to logout room:", error)
    return false
  }
}

  async toggleMicrophone(muted) {
    if (!this.isInitialized || !this.engine) return false

    try {
      await this.engine.muteMicrophone(muted)
      console.log(`🎤 Microphone ${muted ? "muted" : "unmuted"}`)
      return true
    } catch (error) {
      console.error("❌ Failed to toggle microphone:", error)
      return false
    }
  }

  async toggleSpeaker(enableSpeaker) {
    if (!this.isInitialized || !this.engine) return false

    try {
      await this.engine.setAudioRouteToSpeaker(enableSpeaker)
      console.log(`🔊 Speaker ${enableSpeaker ? "enabled" : "disabled"}`)
      return true
    } catch (error) {
      console.error("❌ Failed to toggle speaker:", error)
      return false
    }
  }

  async enableAudioVolumeEvaluation(enable, interval = 1000) {
    if (!this.isInitialized || !this.engine) return false

    try {
      // The correct API for Zego Express is enableSoundLevelMonitor
      await this.engine.startSoundLevelMonitor({
      enableVUMeter: enable, // Use enableVUMeter for enabling/disabling the sound level monitor
      // Zego documentation states 'enable_vumeter', but it's common for JS/TS bindings to use camelCase.
      // If 'enableVUMeter' doesn't work, try 'enable_vumeter'.
      // However, the error message indicates the *type* of argument, not the property name within the object.
      // The primary issue is passing a boolean instead of an object.
      interval: interval,
      // You might also have other properties like `enableSpeaker` or `enableMic`,
      // but for basic sound level monitoring, `enableVUMeter` and `interval` are key.
    })
      console.log(`🔊 Audio volume evaluation ${enable ? "enabled" : "disabled"}`)
      return true
    } catch (error) {
      console.error("❌ Failed to toggle audio volume evaluation:", error)
      return false
    }
  }

  async destroy() {
    if (!this.isInitialized || !this.engine) {
      console.log("⚠️ Engine not initialized, nothing to destroy")
      return true
    }

    try {
      console.log("🧹 Destroying ZegoExpressEngine...")

      // Logout from room if needed
      if (this.roomID) {
        await this.logoutRoom()
      }

      // Destroy engine
      await ZegoExpressEngine.destroyEngine()

      // Reset state
      this.engine = null
      this.isInitialized = false

      console.log("✅ ZegoExpressEngine destroyed successfully")
      return true
    } catch (error) {
      console.error("❌ Failed to destroy ZegoExpressEngine:", error)
      return false
    }
  }

  getRemoteStreamsCount() {
    return this.remoteStreams.size
  }

  isInRoom() {
    return !!this.roomID
  }
}

export default new ZegoExpressService()