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
    this.isPublishing = false
    this.callbacks = {}
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
    this.callbacks = config

    // Set up event handlers BEFORE logging in
    this.setupEventHandlers(config)

    // Login to room
    const result = await this.engine.loginRoom(roomID, {
      userID: userID,
      userName: userName,
    })

    console.log("🚪 Login room result:", result)

    if (result.errorCode !== 0) {
      console.error("❌ Failed to login room:", result)
      return false
    }

    console.log("✅ Logged into room successfully")

    // Enable audio settings
    await this.engine.enableAudioCaptureDevice(true)
    await this.engine.muteMicrophone(false)
    await this.engine.setAudioRouteToSpeaker(true)

    // Start publishing stream
    const publishSuccess = await this.startPublishing()
    if (!publishSuccess) {
      console.warn("⚠ Publishing failed, but room join was successful")
    }

    // Force trigger connected state after successful login
    setTimeout(() => {
      console.log("🔄 Force triggering CONNECTED state")
      config.onRoomStateUpdate?.("CONNECTED", 0)
    }, 1000)

    return true
  } catch (error) {
    console.error("❌ Failed to login room:", error)
    return false
  }
}

  async startPublishing() {
    if (!this.isInitialized || !this.engine || !this.roomID || this.isPublishing) {
      console.error("❌ Cannot start publishing: not ready or already publishing")
      return false
    }

    try {
      console.log("📢 Starting publishing stream:", this.streamID)
      await this.engine.startPublishingStream(this.streamID)
      this.isPublishing = true
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

  // Room state update - FIXED VERSION
  this.engine.on("roomStateUpdate", (roomID, state, errorCode, extendedData) => {
    console.log("🏠 Zego Room state update:", { roomID, state, errorCode, stateType: typeof state })
    
    // Don't modify the state here - let the VoiceCallScreen handle it
    // Just pass the raw state value
    config.onRoomStateUpdate?.(state, errorCode)
  })

  // Rest of your event handlers remain the same...
  this.engine.on("roomUserUpdate", (roomID, updateType, userList) => {
    console.log("👥 Room user update:", {
      roomID,
      updateType: updateType === 0 ? "ADD" : "DELETE",
      userCount: userList.length,
      users: userList.map(u => ({ userID: u.userID, userName: u.userName }))
    })
    
    config.onUserUpdate?.(updateType, userList)
  })

  this.engine.on("roomStreamUpdate", (roomID, updateType, streamList) => {
    console.log("🌊 Room stream update:", {
      roomID,
      updateType: updateType === 0 ? "ADD" : "DELETE",
      streamCount: streamList.length,
      streams: streamList.map(s => ({ streamID: s.streamID, userID: s.user?.userID }))
    })

    if (updateType === 0) {
      // Stream added - start playing remote streams
      streamList.forEach(async (stream) => {
        if (stream.streamID !== this.streamID) {
          this.remoteStreams.set(stream.streamID, stream)
          try {
            await this.engine.startPlayingStream(stream.streamID)
            console.log("▶ Started playing remote stream:", stream.streamID)
          } catch (error) {
            console.error("❌ Failed to start playing stream:", error)
          }
        }
      })
    } else {
      // Stream deleted - stop playing removed streams
      streamList.forEach(async (stream) => {
        if (this.remoteStreams.has(stream.streamID)) {
          try {
            await this.engine.stopPlayingStream(stream.streamID)
            this.remoteStreams.delete(stream.streamID)
            console.log("⏹ Stopped playing remote stream:", stream.streamID)
          } catch (error) {
            console.error("❌ Failed to stop playing stream:", error)
          }
        }
      })
    }

    config.onStreamUpdate?.(updateType, streamList)
  })

  // Audio volume callbacks
  this.engine.on("capturedSoundLevelUpdate", (soundLevel) => {
    config.onSoundLevelUpdate?.({ [this.userID]: soundLevel })
  })

  this.engine.on("remoteSoundLevelUpdate", (soundLevels) => {
    config.onSoundLevelUpdate?.(soundLevels)
  })

  // Network quality update
  this.engine.on("networkQuality", (userID, upstreamQuality, downstreamQuality) => {
    config.onNetworkQuality?.(userID, upstreamQuality, downstreamQuality)
  })

  // Store callbacks for cleanup
  this.eventListeners.set("roomStateUpdate", true)
  this.eventListeners.set("roomUserUpdate", true)
  this.eventListeners.set("roomStreamUpdate", true)
  this.eventListeners.set("capturedSoundLevelUpdate", true)
  this.eventListeners.set("remoteSoundLevelUpdate", true)
  this.eventListeners.set("networkQuality", true)
}

  removeEventHandlers() {
    if (!this.engine) return

    console.log("🧹 Removing event handlers...")
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
      console.log("⚠ Not logged in, nothing to logout")
      return true
    }

    try {
      console.log("🚪 Logging out of room:", this.roomID)

      // Stop publishing
      if (this.streamID && this.isPublishing) {
        await this.engine.stopPublishingStream()
        this.isPublishing = false
      }

      // Stop all remote streams
      for (const streamID of this.remoteStreams.keys()) {
        try {
          await this.engine.stopPlayingStream(streamID)
        } catch (error) {
          console.error("❌ Error stopping stream:", streamID, error)
        }
      }
      this.remoteStreams.clear()

      
      this.removeEventHandlers()

      // Logout from room
      await this.engine.logoutRoom(this.roomID)

      // Reset room info
      this.roomID = null
      this.streamID = null
      this.callbacks = {}

      console.log("✅ Logged out of room successfully")
      return true
    } catch (error) {
      console.error("❌ Failed to logout room:", error)
      return false
    }
  }

  async toggleMicrophone(muted) {
    if (!this.isInitialized || !this.engine) {
      console.error("❌ Engine not initialized for microphone toggle")
      return false
    }

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
    if (!this.isInitialized || !this.engine) {
      console.error("❌ Engine not initialized for speaker toggle")
      return false
    }

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
    if (!this.isInitialized || !this.engine) {
      console.error("❌ Engine not initialized for volume evaluation")
      return false
    }

    try {
      await this.engine.startSoundLevelMonitor({
        enableVUMeter: enable, 
        interval: interval,
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
      console.log("⚠ Engine not initialized, nothing to destroy")
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
      this.isPublishing = false

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
  return !!this.roomID && this.isInitialized
}   

  // Helper method to get connection info
  getConnectionInfo() {
    return {
      isInitialized: this.isInitialized,
      isInRoom: this.isInRoom(),
      isPublishing: this.isPublishing,
      remoteStreamsCount: this.getRemoteStreamsCount(),
      roomID: this.roomID,
      userID: this.userID
    }
  }

  checkConnectionState() {
  return {
    isInitialized: this.isInitialized,
    isInRoom: this.isInRoom(),
    isPublishing: this.isPublishing,
    roomID: this.roomID,
    userID: this.userID,
    remoteStreamsCount: this.getRemoteStreamsCount(),
    hasEngine: !!this.engine
  }
}
}

export default new ZegoExpressService()