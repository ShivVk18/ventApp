import { Platform } from "react-native"
import { request, PERMISSIONS } from "react-native-permissions"

class ZegoCallService {
  static instance = null

  constructor() {
    if (ZegoCallService.instance) {
      return ZegoCallService.instance
    }
    ZegoCallService.instance = this
  }

  async requestPermissions() {
    const permission = Platform.OS === "ios" ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO

    const result = await request(permission)
    console.log("🎤 Permission result:", result)
    return result === "granted"
  }

  generateCallID(roomId) {
    // Generate a unique call ID based on room ID
    return `call_${roomId}`
  }

  generateUserID(userId) {
    // Generate a user ID for ZegoCloud (must be string and unique)
    return userId || `user_${Math.floor(Math.random() * 10000)}`
  }

  generateUserName(userEmail, isHost) {
    const role = isHost ? "Venter" : "Listener"
    const name = userEmail ? userEmail.split("@")[0] : "Anonymous"
    return `${role} (${name})`
  }

  // Get basic call configuration
  getCallConfig(isHost, onCallEnd) {
    return {
      onCallEnd: (callID, reason, duration) => {
        console.log("📞 Call ended:", { callID, reason, duration })
        onCallEnd?.(callID, reason, duration)
      },
      onOnlySelfInRoom: (callID) => {
        console.log("👤 Only self in room:", callID)
        if (isHost) {
          console.log("🎯 Host waiting for listener...")
        }
      },
      onUserJoin: (users) => {
        console.log("👥 Users joined:", users)
        if (isHost && users.length > 0) {
          console.log("🎉 Listener joined the session!")
        }
      },
      onUserLeave: (users) => {
        console.log("👋 Users left:", users)
      },
      // Simplified UI config
      audioVideoViewConfig: {
        showSoundWavesInAudioMode: true,
      },
      // Keep it simple - let ZegoCloud handle the UI
      turnOnCameraWhenJoining: false,
      turnOnMicrophoneWhenJoining: true,
      useSpeakerWhenJoining: true,
    }
  }
}

export default new ZegoCallService()