import { View, Text, StyleSheet } from "react-native"
import Timer from "../ui/Timer"

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
    marginVertical: 30,
  },
  planText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textTransform: "capitalize",
    marginBottom: 20,
  },
  timeRemainingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
})

export default SessionTimer