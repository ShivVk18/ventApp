import { useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native";
import GradientContainer from "../../components/ui/GradientContainer"
import StatusBar from "../../components/ui/StatusBar"
import Button from "../../components/ui/Button"
import Avatar from "../../components/ui/Avatar"
import { useAuth } from "../../context/AuthContext"

export default function WelcomeScreen() {

  const navigation = useNavigation();
  

  const [loading, setLoading] = useState(false)
  const [anonymousLoading, setAnonymousLoading] = useState(false)
  
  const { signInAnonymous , signInWithGoogle, userInfo } = useAuth()

  const handleAnonymousSignIn = async () => {
  if (anonymousLoading) return;
  
  setAnonymousLoading(true)
  
  try {
    const result = await signInAnonymous()
    navigation.replace("Dashboard");
  } catch (error) {
    console.error("=== ANONYMOUS SIGN-IN ERROR ===")
    console.error("Error object:", error)
    console.error("Error message:", error?.message)
    console.error("Error code:", error?.code)
  } finally {
    setAnonymousLoading(false)
  }
}

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
       navigation.navigate("Vent");
    } catch (error) {
      // Error already handled in context
    } finally {
      setLoading(false)
    }
  }

  return (
    <GradientContainer>
      <StatusBar />

      <View style={styles.content}>
        <Text style={styles.anonymousText}>{userInfo?.isAnonymous ? "You are anonymous" : "Welcome to Vent Box"}</Text>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Vent Box</Text>
          <Text style={styles.subtitle}>Share your thoughts{"\n"}anonymously</Text>

          <View style={styles.avatarContainer}>
            <Avatar emoji="💭" />
          </View>

          <View style={styles.techStack}>
            <Text style={styles.techTitle}>🚀 Built with:</Text>
            <Text style={styles.techItem}>📱 Expo Go Compatible</Text>
            <Text style={styles.techItem}>🔐 Expo Crypto Security</Text>
            <Text style={styles.techItem}>🔥 Firebase Auth</Text>
            <Text style={styles.techItem}>⚡ React Native</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Signing in..." : "🔍 Continue with Google"}
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={loading}
          />

          <Button
            title={anonymousLoading ? "Signing in..." : "👤 Continue Anonymously"}
            onPress={handleAnonymousSignIn}
            disabled={anonymousLoading}
          />

          <Text style={styles.privacyText}>Anonymous mode: No personal data is collected or stored</Text>
        </View>
      </View>
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  anonymousText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  techStack: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  techTitle: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  techItem: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 4,
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 15,
  },
  privacyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
})