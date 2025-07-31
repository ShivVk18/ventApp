import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// JSDoc for ConnectionStatusProps to document the component's props
/**
 * @typedef {object} ConnectionStatusProps
 * @property {boolean} joined - Whether the local user has successfully joined the channel.
 * @property {number[]} remoteUsers - An array of UIDs of remote users in the channel.
 * @property {number} timeRemaining - The time remaining in the session (in seconds).
 * @property {string} connectionStatus - The current connection status (e.g., "connecting", "connected", "failed").
 * @property {() => void} [onRetry] - Optional callback function to retry connection.
 * @property {boolean} [isHost=false] - True if the current user is the host (venter), false otherwise.
 */

/**
 * ConnectionStatus component displays the current connection status and related information.
 *
 * @param {ConnectionStatusProps} props - The props for the ConnectionStatus component.
 */
const ConnectionStatus = ({
  joined,
  remoteUsers,
  timeRemaining,
  connectionStatus,
  onRetry,
  isHost = false, // Default value directly in destructuring
}) => {
  /**
   * Determines the display information (emoji, text, color, retry button visibility)
   * based on the current connection status.
   * @returns {{emoji: string, text: string, color: string, showRetry: boolean}} Status information.
   */
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case "requesting_permissions":
        return {
          emoji: "🔐",
          text: "Requesting permissions...",
          color: "#f59e0b", // Orange
          showRetry: false,
        };
      case "connecting":
        return {
          emoji: "🔄",
          text: "Connecting to voice channel...",
          color: "#f59e0b", // Orange
          showRetry: false,
        };
      case "connected":
        // If connected but no remote users, show waiting message (especially for host)
        if (remoteUsers.length === 0) {
          return {
            emoji: "⏳",
            text: isHost ? "Waiting for listener..." : "Joining session...",
            color: "#f59e0b", // Orange
            showRetry: false,
          };
        }
        return {
          emoji: "✅",
          text: "Connected",
          color: "#4ade80", // Green
          showRetry: false,
        };
      case "reconnecting":
        return {
          emoji: "🔄",
          text: "Reconnecting...",
          color: "#f59e0b", // Orange
          showRetry: false,
        };
      case "failed":
        return {
          emoji: "❌",
          text: "Connection Failed",
          color: "#ef4444", // Red
          showRetry: true,
        };
      default:
        // Fallback for any unhandled or initial states
        return {
          emoji: "🔄",
          text: "Initializing...",
          color: "#6b7280", // Gray
          showRetry: false,
        };
    }
  };

  const statusInfo = getStatusInfo();
  // Calculate total participants including the local user if joined
  const participantCount = remoteUsers.length + (joined ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Display the main status text with dynamic color */}
      <Text style={[styles.statusText, { color: statusInfo.color }]}>
        {statusInfo.emoji} {statusInfo.text}
      </Text>

      {/* Show participant count only if successfully joined */}
      {joined && (
        <Text style={styles.participantsText}>
          {participantCount} participant{participantCount !== 1 ? "s" : ""} connected
        </Text>
      )}

      {/* Show retry button only if connection failed and onRetry callback is provided */}
      {statusInfo.showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
        </TouchableOpacity>
      )}

      {/* Display a warning if time remaining is 5 minutes or less, and the user is joined */}
      {timeRemaining <= 300 && timeRemaining > 0 && joined && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Session ending in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </Text>
        </View>
      )}
    </View>
  );
};

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
    backgroundColor: "rgba(239, 68, 68, 0.2)", // Semi-transparent red
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ef4444", // Red border
    marginTop: 8,
  },
  retryButtonText: {
    color: "#ef4444", // Red text
    fontSize: 14,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.2)", // Semi-transparent orange
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f59e0b", // Orange border
    marginTop: 12,
  },
  warningText: {
    color: "#f59e0b", // Orange text
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ConnectionStatus;