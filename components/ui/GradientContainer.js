import { SafeAreaView, StyleSheet } from "react-native"
import LinearGradient from "react-native-linear-gradient"

const GradientContainer = ({ children, style }) => {
  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={[styles.container, style]}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
})

export default GradientContainer
