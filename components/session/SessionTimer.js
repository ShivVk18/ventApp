import { View, Text, StyleSheet } from "react-native"
import Timer from "../ui/Timer" // Assuming Timer is in this relative path

const SessionTimer = ({ sessionTime, timeRemaining, plan }) => {
  return (
    <View style={styles.container}>
      <Timer seconds={sessionTime} variant="large" />
      <Text style={styles.planText}>{plan} Session</Text>

      <View style={styles.timeRemainingContainer}>
        <Timer seconds={timeRemaining} label="Time Remaining" showWarning={true} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 32, // theme.spacing.xl
  },
  planText: {
    color: "rgba(255, 255, 255, 0.8)", // theme.colors.text.secondary
    fontSize: 16, // theme.typography.body.fontSize
    textTransform: "capitalize",
    marginBottom: 24, // theme.spacing.lg
  },
  timeRemainingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", // theme.colors.overlay
    paddingVertical: 10, // theme.spacing.sm + 2
    paddingHorizontal: 28, // theme.spacing.lg + 4
    borderRadius: 16, // theme.borderRadius.lg
  },
})

export default SessionTimer