import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

// JSDoc for SessionTimerProps to document the component's props
/**
 * @typedef {object} SessionTimerProps
 * @property {number} sessionTime - The total time elapsed in the session (in seconds).
 * @property {number} timeRemaining - The time left on the countdown timer (in seconds).
 * @property {string} plan - The name of the vent plan (e.g., "10-Min Vent").
 */

/**
 * SessionTimer component displays the elapsed session time and remaining time.
 *
 * @param {SessionTimerProps} props - The props for the SessionTimer component.
 */
const SessionTimer = ({ sessionTime, timeRemaining, plan }) => {
  const [displayTime, setDisplayTime] = useState(sessionTime);

  // Update displayTime whenever sessionTime or timeRemaining changes
  useEffect(() => {
    // Calculate elapsed time from the total session time minus remaining time
    // This ensures that the displayTime accurately reflects how long the session has been active.
    setDisplayTime(sessionTime - timeRemaining);
  }, [sessionTime, timeRemaining]); // Dependencies: Re-run effect if these values change

  /**
   * Formats time from seconds into MM:SS string.
   * @param {number} seconds - The time in seconds.
   * @returns {string} Formatted time string (MM:SS).
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Determines the color of the "Time Remaining" text based on the time left.
   * @returns {string} Hex color code.
   */
  const getTimeRemainingColor = () => {
    if (timeRemaining <= 60) return "#ef4444"; // Red for last minute
    if (timeRemaining <= 300) return "#f59e0b"; // Orange for last 5 minutes
    return "#4ade80"; // Green for normal time
  };

  return (
    <View style={styles.container}>
      <View style={styles.sessionTimeContainer}>
        {/* Display the total elapsed time of the session */}
        <Text style={styles.sessionTimeText}>{formatTime(displayTime)}</Text>
        <Text style={styles.planText}>{plan}</Text>
      </View>

      <View style={styles.timeRemainingContainer}>
        <Text style={styles.timeRemainingLabel}>Time Remaining</Text>
        {/* Display the countdown time, with dynamic color */}
        <Text style={[styles.timeRemainingText, { color: getTimeRemainingColor() }]}>{formatTime(timeRemaining)}</Text>

        {/* Show a warning if time remaining is 5 minutes or less, but not zero */}
        {timeRemaining <= 300 && timeRemaining > 0 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>⚠️ Session ending soon</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 32,
  },
  sessionTimeContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  sessionTimeText: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace", // Often used for digital displays
  },
  planText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textTransform: "capitalize",
    marginTop: 8,
  },
  timeRemainingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: "center",
  },
  timeRemainingLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginBottom: 4,
  },
  timeRemainingText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  warningContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(245, 158, 11, 0.2)", // A semi-transparent orange
    borderRadius: 12,
  },
  warningText: {
    color: "#f59e0b", // Orange color
    fontSize: 12,
    fontWeight: "600",
  },
});

export default SessionTimer;