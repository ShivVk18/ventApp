import { useState } from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"


import GradientContainer from "../../components/ui/GradientContainer"
import StatusBar from "../../components/ui/StatusBar"
import Button from "../../components/ui/Button"

import { useAuth } from "../../context/AuthContext"

const FeatureItem = ({ emoji, text }) => (
  <View style={styles.feature}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
)

export default function WelcomeScreen() {
  const navigation = useNavigation()
  

  const [anonymousLoading, setAnonymousLoading] = useState(false)
  const { signInAnonymous } = useAuth()

  const handleAnonymousSignIn = async () => {
    if (anonymousLoading) return
    setAnonymousLoading(true)

    try {
      await signInAnonymous()
      navigation.replace("Dashboard")
    } catch (error) {
      console.error("Anonymous Sign-in Error:", error)
    } finally {
      setAnonymousLoading(false)
    }
  }

  return (
    <GradientContainer>
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>

      <StatusBar />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
            <Text style={styles.title}>VentBox</Text>
            <Text style={styles.subtitle}>Say it loud. Say it proud. Stay anonymous.</Text>
          </View>

          <View style={styles.features}>
            <FeatureItem emoji="🕵️‍♀️" text="Zero identity, 100% honesty." />
            <FeatureItem emoji="🎙️" text="Speak your mind, not your name." />
            <FeatureItem emoji="⚡" text="One tap. Boom. You're in." />
          </View>

          <Text style={styles.description}>
            Got a rant, a confession, or just random thoughts? Drop it. No judgment. No names. Just vibes.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            title={anonymousLoading ? "Spinning Up..." : "Vent Now 🚀"}
            onPress={handleAnonymousSignIn}
            disabled={anonymousLoading}
            loading={anonymousLoading}
            style={styles.getStartedButton}
          />
          <Text style={styles.disclaimer}>You’re safe here. Terms & Privacy apply.</Text>
        </View>
      </View>
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: "absolute",
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  circle1: {
    width: 120,
    height: 120,
    top: "15%",
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    top: "60%",
    left: -20,
  },
  circle3: {
    width: 200,
    height: 200,
    bottom: "10%",
    right: -60,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  features: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  description: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    paddingBottom: 48,
  },
  getStartedButton: {
    marginBottom: 24,
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    lineHeight: 16,
  },
})
