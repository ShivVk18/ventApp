import { View, Text, StyleSheet } from "react-native"

export default function SessionTimer({ sessionTime = 0, timeRemaining = 0, plan = "20-Min Vent" }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    const totalTime = sessionTime + timeRemaining
    if (totalTime === 0) return 0
    return (sessionTime / totalTime) * 100
  }

  return (
    <View style={styles.container}>
      <Text style={styles.planText}>{plan}</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timeText}>{formatTime(sessionTime)}</Text>
        <Text style={styles.separatorText}>/</Text>
        <Text style={styles.remainingText}>{formatTime(timeRemaining)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${getProgressPercentage()}%` }]} />
      </View>

      <Text style={styles.labelText}>Session Time / Time Remaining</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 30,
  },
  planText: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  timeText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  separatorText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 24,
    marginHorizontal: 10,
  },
  remainingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 2,
  },
  labelText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
})
