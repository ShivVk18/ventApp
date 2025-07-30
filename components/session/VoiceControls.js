import { View, TouchableOpacity, Text, StyleSheet } from "react-native"

const VoiceControls = ({ muted, onToggleMute, onEndCall, disabled = false }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.controlButton, muted && styles.mutedButton]}
        onPress={onToggleMute}
        disabled={disabled}
      >
        <Text style={styles.controlButtonText}>{muted ? "🔇" : "🎤"}</Text>
        <Text style={styles.controlLabel}>{muted ? "Unmute" : "Mute"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={onEndCall}>
        <Text style={styles.controlButtonText}>📞</Text>
        <Text style={styles.controlLabel}>End Call</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "70%",
    marginBottom: 32, // theme.spacing.xl
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 9999, // theme.borderRadius.full
    backgroundColor: "rgba(255, 255, 255, 0.2)", // theme.colors.overlayStrong
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // theme.shadows.small
  },
  mutedButton: {
    backgroundColor: "rgba(255, 107, 107, 0.8)", // Keeping original for specific muted tint
  },
  endCallButton: {
    backgroundColor: "#ef4444", // theme.colors.error
  },
  controlButtonText: {
    fontSize: 32, // theme.typography.h1.fontSize
    marginBottom: 4, // theme.spacing.xs
  },
  controlLabel: {
    color: "#ffffff", // theme.colors.text.primary
    fontSize: 12, // theme.typography.small.fontSize
    fontWeight: "600", // theme.typography.h3.fontWeight
    textAlign: "center",
  },
})

export default VoiceControls