import { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import GradientContainer from "../../components/ui/GradientContainer"
import StatusBar from "../../components/ui/StatusBar"
import Button from "../../components/ui/Button"
import { useAuth } from "../../context/AuthContext"

export default function VentSubmitted() {

  const navigation = useNavigation()

  const [ventText, setVentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { userInfo } = useAuth()
  const insets = useSafeAreaInsets()
  const textInputRef = useRef(null)

  const handleSubmitVent = async () => {
    if (!ventText.trim()) {
      Alert.alert("Empty Vent", "Please write something before submitting.")
      return
    }

    try {
      setSubmitting(true)
      Keyboard.dismiss()
      await new Promise((resolve) => setTimeout(resolve, 2000))
      navigation.navigate("VentSubmitted", {
        ventText: ventText.trim(),
        userId: userInfo?.sessionId || "anonymous",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      Alert.alert("Error", "Failed to submit your vent. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const dismissKeyboard = () => {
    Keyboard.dismiss()
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <View style={{ flex: 1 }}>
        <GradientContainer>
          <StatusBar />
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.anonymousText}>
                {userInfo?.isAnonymous ? "You are anonymous" : `Welcome, ${userInfo?.displayName || "User"}`}
              </Text>

              <View style={styles.mainContent}>
                <Text style={styles.title}>What's on{"\n"}your mind?</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    ref={textInputRef}
                    style={styles.textInput}
                    placeholder="I feel like..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={ventText}
                    onChangeText={setVentText}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    returnKeyType="default"
                    blurOnSubmit={false}
                    scrollEnabled={true}
                  />
                  <Text style={styles.characterCount}>{ventText.length}/500</Text>
                </View>

                <Text style={styles.helperText}>Share your thoughts anonymously</Text>
                <Text style={styles.secureText}>🔐 Secured with Expo Crypto</Text>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title={submitting ? "Submitting..." : "Submit Vent"}
                  onPress={handleSubmitVent}
                  disabled={!ventText.trim() || submitting}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </GradientContainer>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
  },
  anonymousText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  title: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 44,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
    position: "relative",
  },
  textInput: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 15,
    padding: 20,
    color: "white",
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: "top",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  characterCount: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  secureText: {
    color: "#4ade80",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  buttonContainer: {
    paddingBottom: 40,
    paddingTop: 20,
  },
})