import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from "react-native-agora";
import { Platform } from "react-native";
import { request, PERMISSIONS } from "react-native-permissions";

// No need for explicit interface in JS, but keeping it as a comment for reference
/**
 * @typedef {object} VoiceCallConfig
 * @property {string} appId
 * @property {string} channelName
 * @property {string | null} [token]
 * @property {boolean} isHost
 * @property {(uid: number) => void} onJoinSuccess
 * @property {(uid: number) => void} onUserJoined
 * @property {(uid: number) => void} onUserLeft
 * @property {(state: string) => void} onConnectionStateChanged
 * @property {(error: any) => void} onError
 */

export class VoiceCallService {
  /** @type {import("react-native-agora").RtcEngine | null} */
  engine = null;
  /** @type {VoiceCallConfig | null} */
  config = null;
  /** @type {boolean} */
  isInitialized = false;
  /** @type {number} */
  joinAttempts = 0;
  /** @type {number} */
  maxJoinAttempts = 3;

  /**
   * Requests microphone permission.
   * @returns {Promise<boolean>} True if permission is granted, false otherwise.
   */
  async requestPermissions() {
    try {
      const micPermission =
        Platform.OS === "ios"
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(micPermission);
      return result === "granted";
    } catch (error) {
      console.error("Permission request error:", error);
      return false;
    }
  }

  /**
   * Initializes the Agora RTC engine.
   * @param {VoiceCallConfig} config - The configuration for the voice call.
   * @returns {Promise<boolean>} True if initialization is successful, false otherwise.
   */
  async initialize(config) {
    try {
      if (this.isInitialized) {
        console.log("Voice service already initialized");
        return true;
      }

      this.config = config;

      // Create engine
      this.engine = createAgoraRtcEngine();

      // Initialize with app ID
      await this.engine.initialize({
        appId: config.appId,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      // Set client role
      await this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Enable audio
      await this.engine.enableAudio();

      // Set audio profile for voice chat
      await this.engine.setAudioProfile(1, 1); // Sample rate 16kHz, mono

      // Enable speaker by default
      await this.engine.setEnableSpeakerphone(true);

      // Register event handlers
      this.registerEventHandlers();

      this.isInitialized = true;
      console.log("✅ Voice service initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Voice service initialization failed:", error);
      this.config?.onError(error);
      return false;
    }
  }

  /**
   * Registers Agora RTC engine event handlers.
   * @private
   */
  registerEventHandlers() {
    if (!this.engine || !this.config) return;

    // In JS, we define the event handler object directly
    const eventHandler = {
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log("🎉 Joined channel successfully:", connection.localUid);
        this.joinAttempts = 0;
        this.config?.onJoinSuccess(connection.localUid || 0);
      },

      onUserJoined: (connection, remoteUid, elapsed) => {
        console.log("👤 Remote user joined:", remoteUid);
        this.config?.onUserJoined(remoteUid);
      },

      onUserOffline: (connection, remoteUid, reason) => {
        console.log("👋 Remote user left:", remoteUid, "reason:", reason);
        this.config?.onUserLeft(remoteUid);
      },

      onConnectionStateChanged: (connection, state, reason) => {
        const stateNames = {
          1: "DISCONNECTED",
          2: "CONNECTING",
          3: "CONNECTED",
          4: "RECONNECTING",
          5: "FAILED",
        };

        const stateName = stateNames[state] || `UNKNOWN(${state})`;
        console.log("🔗 Connection state changed:", stateName);
        this.config?.onConnectionStateChanged(stateName);

        // Handle failed connections with retry
        if (state === 5 && this.joinAttempts < this.maxJoinAttempts) {
          console.log("🔄 Connection failed, retrying...");
          setTimeout(() => {
            this.retryJoinChannel();
          }, 2000);
        }
      },

      onError: (err, msg) => {
        // Filter out known false positive errors
        if (err === 110) {
          console.log("ℹ️ Ignoring error 110 (known false positive)");
          return;
        }

        console.error("❌ Agora Error:", err, msg);
        this.config?.onError({ code: err, message: msg });
      },

      onLeaveChannel: (connection, stats) => {
        console.log("👋 Left channel");
      },

      onAudioVolumeIndication: (
        connection,
        speakers,
        speakerNumber,
        totalVolume
      ) => {
        // Optional: Handle volume indication for UI feedback
      },
    };

    this.engine.registerEventHandler(eventHandler);
  }

  /**
   * Joins the Agora channel.
   * @returns {Promise<boolean>} True if the join request is sent successfully, false otherwise.
   */
  async joinChannel() {
    if (!this.engine || !this.config) {
      console.error("❌ Cannot join channel: service not initialized");
      return false;
    }

    try {
      this.joinAttempts++;
      console.log(`🔄 Join attempt ${this.joinAttempts}/${this.maxJoinAttempts}`);

      // Generate a random UID for the local user
      // Note: If you need a consistent UID across sessions or for specific user identification,
      // you should derive it from your authentication system (e.g., Firebase UID).
      const uid = Math.floor(Math.random() * 1000000);

      await this.engine.joinChannel(
        this.config.token || null, // Pass token if available, otherwise null
        this.config.channelName,
        uid,
        {
          autoSubscribeAudio: true,
          autoSubscribeVideo: false,
          publishMicrophoneTrack: true,
          publishCameraTrack: false,
        }
      );

      console.log("✅ Join channel request sent");
      return true;
    } catch (error) {
      console.error("❌ Join channel failed:", error);

      if (this.joinAttempts < this.maxJoinAttempts) {
        console.log("🔄 Will retry in 2 seconds...");
        setTimeout(() => {
          this.retryJoinChannel();
        }, 2000);
      } else {
        this.config?.onError(error);
      }

      return false;
    }
  }

  /**
   * Retries joining the channel if max attempts not reached.
   * @private
   */
  async retryJoinChannel() {
    if (this.joinAttempts < this.maxJoinAttempts) {
      await this.joinChannel();
    }
  }

  /**
   * Toggles local audio mute state.
   * @param {boolean} muted - True to mute, false to unmute.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async toggleMute(muted) {
    if (!this.engine) return false;

    try {
      await this.engine.muteLocalAudioStream(muted);
      console.log("🎤 Mute toggled:", muted);
      return true;
    } catch (error) {
      console.error("❌ Toggle mute failed:", error);
      return false;
    }
  }

  /**
   * Toggles speakerphone state.
   * @param {boolean} enabled - True to enable speakerphone, false to disable.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async toggleSpeaker(enabled) {
    if (!this.engine) return false;

    try {
      await this.engine.setEnableSpeakerphone(enabled);
      console.log("🔊 Speaker toggled:", enabled);
      return true;
    } catch (error) {
      console.error("❌ Toggle speaker failed:", error);
      return false;
    }
  }

  /**
   * Leaves the Agora channel.
   * @returns {Promise<void>}
   */
  async leaveChannel() {
    if (!this.engine) return;

    try {
      await this.engine.leaveChannel();
      console.log("✅ Left channel");
    } catch (error) {
      console.error("❌ Leave channel failed:", error);
    }
  }

  /**
   * Destroys the Agora RTC engine and cleans up resources.
   * @returns {Promise<void>}
   */
  async destroy() {
    if (this.engine) {
      try {
        await this.leaveChannel();
        this.engine.release();
        this.engine = null;
        this.isInitialized = false;
        console.log("✅ Voice service destroyed");
      } catch (error) {
        console.error("❌ Destroy failed:", error);
      }
    }
  }

  /**
   * Checks if the voice service is connected/initialized.
   * @returns {boolean} True if connected, false otherwise.
   */
  isConnected() {
    return this.isInitialized && this.engine !== null;
  }
}

export default new VoiceCallService();