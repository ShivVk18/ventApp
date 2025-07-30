import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

// JSDoc for VoiceControlsProps to document the component's props
/**
 * @typedef {object} VoiceControlsProps
 * @property {boolean} muted - Whether the microphone is muted.
 * @property {boolean} [speakerEnabled=true] - Whether the speaker is enabled (true) or earpiece (false).
 * @property {() => void} onToggleMute - Callback function to toggle microphone mute state.
 * @property {() => void} [onToggleSpeaker] - Optional callback function to toggle speaker state.
 * @property {() => void} onEndCall - Callback function to end the call.
 * @property {boolean} [disabled=false] - Whether the controls should be disabled.
 * @property {string} [connectionStatus="connected"] - The current connection status.
 */

/**
 * VoiceControls component for managing call actions (mute, speaker, end call).
 *
 * @param {VoiceControlsProps} props - The props for the VoiceControls component.
 */
const VoiceControls = ({
  muted,
  speakerEnabled = true, // Default value directly in destructuring
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  disabled = false, // Default value directly in destructuring
  connectionStatus = "connected", // Default value directly in destructuring
}) => {
  const isConnected = connectionStatus === "connected";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.controlButton, muted && styles.mutedButton, disabled && styles.disabledButton]}
        onPress={onToggleMute}
        disabled={disabled || !isConnected}
      >
        <Text style={styles.controlButtonText}>{muted ? "🔇" : "🎤"}</Text>
        <Text style={styles.controlLabel}>{muted ? "Unmute" : "Mute"}</Text>
      </TouchableOpacity>

      {onToggleSpeaker && ( // Conditionally render speaker button if onToggleSpeaker prop is provided
        <TouchableOpacity
          style={[styles.controlButton, !speakerEnabled && styles.speakerOffButton, disabled && styles.disabledButton]}
          onPress={onToggleSpeaker}
          disabled={disabled || !isConnected}
        >
          <Text style={styles.controlButtonText}>{speakerEnabled ? "🔊" : "🔇"}</Text>
          <Text style={styles.controlLabel}>{speakerEnabled ? "Speaker" : "Earpiece"}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.controlButton, styles.endCallButton]}
        onPress={onEndCall}
        // End call button should usually be always enabled to allow leaving the call,
        // but adding disabled check for consistency if needed.
        disabled={disabled}
      >
        <Text style={styles.controlButtonText}>📞</Text>
        <Text style={styles.controlLabel}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mutedButton: {
    backgroundColor: "rgba(255, 107, 107, 0.8)",
  },
  speakerOffButton: {
    backgroundColor: "rgba(156, 163, 175, 0.8)",
  },
  endCallButton: {
    backgroundColor: "#ef4444",
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 32,
    marginBottom: 4,
  },
  controlLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default VoiceControls;