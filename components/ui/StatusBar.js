import { View, Text, StyleSheet } from "react-native"

const StatusBar = ({ time = "9:41" }) => {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.statusIcons}>
        <Text style={styles.icon}>📶</Text>
        <Text style={styles.icon}>📶</Text>
        <Text style={styles.icon}>🔋</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  time: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statusIcons: {
    flexDirection: "row",
    gap: 5,
  },
  icon: {
    color: "white",
    fontSize: 16,
  },
})

export default StatusBar
