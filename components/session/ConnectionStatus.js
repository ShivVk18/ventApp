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
        {remoteUsers.length > 0 ? `${remoteUsers + 1} participants` : "Waiting for listener..."}
      </Text>

      {timeRemaining <= 300 && timeRemaining > 0 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Session ending in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </Text>
        </View>
      )}

      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 48, // theme.spacing.xxl
  },
  statusText: {
    fontSize: 24, // theme.typography.h2.fontSize
    fontWeight: "bold", // theme.typography.h2.fontWeight
    marginBottom: 16, // theme.spacing.md
    textAlign: "center",
  },
  participantsText: {
    color: "rgba(255, 255, 255, 0.8)", // theme.colors.text.secondary
    fontSize: 16, // theme.typography.body.fontSize
    marginBottom: 16, // theme.spacing.md
  },
  warningContainer: {
    backgroundColor: "rgba(255, 167, 38, 0.2)", // Keeping original for specific warning tint
    paddingVertical: 10, // theme.spacing.sm + 2
    paddingHorizontal: 28, // theme.spacing.lg + 4
    borderRadius: 16, // theme.borderRadius.lg
    borderWidth: 1,
    borderColor: "#f59e0b", // theme.colors.warning
    marginTop: 20, // theme.spacing.md + 4
  },
  warningText: {
    color: "#f59e0b", // theme.colors.warning
    fontSize: 14, // theme.typography.caption.fontSize
    fontWeight: "600", // theme.typography.h3.fontWeight
    textAlign: "center",
  },
  expoGoIndicator: {
    marginTop: 20, // theme.spacing.md + 4
    backgroundColor: "rgba(74, 222, 128, 0.1)", // theme.colors.secondary + "1A"
    paddingVertical: 5, // theme.spacing.xs + 1
    paddingHorizontal: 18, // theme.spacing.md + 2
    borderRadius: 20, // theme.borderRadius.xl
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)", // theme.colors.secondary + "4D"
  },
  expoGoText: {
    color: "#4ade80", // theme.colors.secondary
    fontSize: 12, // theme.typography.small.fontSize
    fontWeight: "600", // theme.typography.h3.fontWeight
  },
})

export default ConnectionStatus