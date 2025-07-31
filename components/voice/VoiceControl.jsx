import { View, TouchableOpacity, Text, StyleSheet } from "react-native"

export default function VoiceControls({
  muted = false,
  speakerMuted = false,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  disabled = false,
  connectionStatus = "disconnected",
}) {
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4ade80"
      case "connecting":
        return "#fbbf24"
      case "failed":
      case "disconnected":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: getConnectionColor() }]} />
        <Text style={styles.statusText}>
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
              ? "Connecting..."
              : "Disconnected"}
        </Text>
      </View>

      {/* Voice Controls */}
      <View style={styles.controlsContainer}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[styles.controlButton, muted && styles.activeButton, disabled && styles.disabledButton]}
          onPress={onToggleMute}
          disabled={disabled}
        >
          <Text style={styles.controlIcon}>{muted ? "🔇" : "🎤"}</Text>
          <Text style={styles.controlLabel}>{muted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        {/* Speaker Button */}
        <TouchableOpacity
          style={[styles.controlButton, speakerMuted && styles.activeButton, disabled && styles.disabledButton]}
          onPress={onToggleSpeaker}
          disabled={disabled}
        >
          <Text style={styles.controlIcon}>{speakerMuted ? "🔈" : "🔊"}</Text>
          <Text style={styles.controlLabel}>{speakerMuted ? "Speaker Off" : "Speaker On"}</Text>
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.endCallButton, disabled && styles.disabledButton]}
          onPress={onEndCall}
          disabled={disabled}
        >
          <Text style={styles.endCallIcon}>📞</Text>
          <Text style={styles.endCallLabel}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  endCallButton: {
    backgroundColor: "#ef4444",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  endCallIcon: {
    fontSize: 24,
    marginBottom: 4,
    transform: [{ rotate: "135deg" }],
  },
  endCallLabel: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
})