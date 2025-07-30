import { View, Text, StyleSheet } from "react-native"

const ConnectionStatus = ({ joined, remoteUsers, timeRemaining, status, statusColor }) => {
  const getStatusEmoji = () => {
    if (status === "Connected") return "✅"
    if (status === "Waiting for listener...") return "⏳"
    if (status === "Connection Failed") return "❌"
    return "🔄"
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.statusText, { color: statusColor }]}>
        {getStatusEmoji()} {status}
      </Text>
      <Text style={styles.participantsText}>
        {remoteUsers > 0 ? `${remoteUsers + 1} participants` : "Waiting for listener..."}
      </Text>

      {timeRemaining <= 300 && timeRemaining > 0 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Session ending in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </Text>
        </View>
      )}

      <View style={styles.expoGoIndicator}>
        <Text style={styles.expoGoText}>📱 Expo Go Compatible</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 50,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  participantsText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    marginBottom: 10,
  },
  warningContainer: {
    backgroundColor: "rgba(255, 167, 38, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ffa726",
    marginTop: 15,
  },
  warningText: {
    color: "#ffa726",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  expoGoIndicator: {
    marginTop: 15,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
  },
  expoGoText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "600",
  },
})

export default ConnectionStatus
