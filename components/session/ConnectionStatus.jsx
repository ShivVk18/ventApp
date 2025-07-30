import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

interface ConnectionStatusProps {
  joined: boolean
  remoteUsers: number[]
  timeRemaining: number
  connectionStatus: string
  onRetry?: () => void
  isHost?: boolean
}

const ConnectionStatus = ({
  joined,
  remoteUsers,
  timeRemaining,
  connectionStatus,
  onRetry,
  isHost = false,
}: ConnectionStatusProps) => {
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case "requesting_permissions":
        return {
          emoji: "🔐",
          text: "Requesting permissions...",
          color: "#f59e0b",
          showRetry: false,
        }
      case "connecting":
        return {
          emoji: "🔄",
          text: "Connecting to voice channel...",
          color: "#f59e0b",
          showRetry: false,
        }
      case "connected":
        if (remoteUsers.length === 0) {
          return {
            emoji: "⏳",
            text: isHost ? "Waiting for listener..." : "Joining session...",
            color: "#f59e0b",
            showRetry: false,
          }
        }
        return {
          emoji: "✅",
          text: "Connected",
          color: "#4ade80",
          showRetry: false,
        }
      case "reconnecting":
        return {
          emoji: "🔄",
          text: "Reconnecting...",
          color: "#f59e0b",
          showRetry: false,
        }
      case "failed":
        return {
          emoji: "❌",
          text: "Connection Failed",
          color: "#ef4444",
          showRetry: true,
        }
      default:
        return {
          emoji: "🔄",
          text: "Initializing...",
          color: "#6b7280",
          showRetry: false,
        }
    }
  }

  const statusInfo = getStatusInfo()
  const participantCount = remoteUsers.length + (joined ? 1 : 0)

  return (
    <View style={styles.container}>
      <Text style={[styles.statusText, { color: statusInfo.color }]}>
        {statusInfo.emoji} {statusInfo.text}
      </Text>

      {joined && (
        <Text style={styles.participantsText}>
          {participantCount} participant{participantCount !== 1 ? "s" : ""} connected
        </Text>
      )}

      {statusInfo.showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
        </TouchableOpacity>
      )}

      {timeRemaining <= 300 && timeRemaining > 0 && joined && (
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
    marginBottom: 48,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  participantsText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ef4444",
    marginTop: 8,
  },
  retryButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f59e0b",
    marginTop: 12,
  },
  warningText: {
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
})

export default ConnectionStatus
