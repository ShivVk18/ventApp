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
    marginBottom: 30,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mutedButton: {
    backgroundColor: "rgba(255, 107, 107, 0.8)",
  },
  endCallButton: {
    backgroundColor: "#ff6b6b",
  },
  controlButtonText: {
    fontSize: 28,
    marginBottom: 4,
  },
  controlLabel: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
})

export default VoiceControls