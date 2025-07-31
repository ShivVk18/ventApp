import React, { useState } from "react"
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useNavigation } from "@react-navigation/native"


import Button from "../../components/ui/Button"
import StatusBar from "../../components/ui/StatusBar"
import { useAuth } from "../../context/AuthContext"

export default function DashboardScreen() {
  const navigation = useNavigation()
  const [signingOut, setSigningOut] = useState(false)
  const { logout } = useAuth()
  

  const handleVentPress = () => navigation.navigate("Vent")
  const handleListenPress = () => navigation.navigate("Listener")

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
      console.log("User signed out successfully.")
      navigation.replace("WelcomeScreen")
    } catch (error) {
      console.error("Error signing out:", error)
      Alert.alert("Sign Out Error", error.message)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <LinearGradient colors={["#1a1a40", "#0f0f2e"]} style={styles.container}>
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>
      <StatusBar />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Welcome to Vent Box!</Text>
        <Text style={styles.heading}>Choose your role:</Text>

        <View style={styles.mainActions}>
          <ActionCard
            emoji="🗣️"
            title="Need to Vent?"
            description="Got feelings on loud? Let it all out — we’re all ears (and zero judgment)."
            buttonTitle="Vent Now"
            onPress={handleVentPress}
            variant="primary"
          />

          <ActionCard
            emoji="👂"
            title="Be a Listener"
            description="Got a kind ear? Be the calm in someone’s storm — one voice at a time."
            buttonTitle="Join as Listener"
            onPress={handleListenPress}
            variant="secondary"
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How VentBox Works</Text>
          <InfoStep
            number="1"
            title="Create or Join a Room"
            description="Start a room or jump into one — it's your call!"
          />
          <InfoStep number="2" title="Stay Anonymous & Safe" description="No names, no pressure — just honest vibes." />
          <InfoStep
            number="3"
            title="Connect & Converse"
            description="Talk it out or just listen — we’re here for it."
          />
        </View>

        <View style={styles.footer}>
          <Button
            title={signingOut ? "Signing Out..." : "Sign Out"}
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
            disabled={signingOut}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const ActionCard = React.memo(({ emoji, title, description, buttonTitle, onPress, variant }) => (
  <View style={styles.actionCard}>
    <Text style={styles.actionEmoji}>{emoji}</Text>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionDescription}>{description}</Text>
    <Button title={buttonTitle} onPress={onPress} variant={variant} style={styles.actionButton} />
  </View>
))

const InfoStep = React.memo(({ number, title, description }) => (
  <View style={styles.infoStep}>
    <Text style={styles.stepNumber}>{number}</Text>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
))

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom:24,
    alignItems: "center",
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
  title: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  heading: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  mainActions: {
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
    gap: 16,
  },
  actionCard: {
    padding: 24,
    marginBottom: 10,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 15,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    minWidth: 160,
  },
  infoSection: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 24,
    textAlign: "center",
  },
  infoStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFC940",
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.65)",
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
  },
  signOutButton: {
    minWidth: 140,
  },
})
