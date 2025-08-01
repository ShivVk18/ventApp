"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native"

import LinearGradient from "react-native-linear-gradient"
import PaymentModal from "../../components/PaymentModal"
import { useNavigation } from "@react-navigation/native"
import RoomService from "../../services/RoomService"

const { width: screenWidth } = Dimensions.get("window")

const Vent = () => {
  const navigation = useNavigation()
  const [ventText, setVentText] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
 
  const handlePaymentSuccess = async (plan) => {
    console.log(`💳 Payment completed for plan: ${plan}`)
    await createRoom(plan)
  }

  const createRoom = async (plan) => {
    if (ventText.trim() === "") {
      Alert.alert("Empty Vent", "Vent text cannot be empty.")
      return
    }

    setIsCreatingRoom(true)

    try {
      const roomId = await RoomService.createRoom(ventText.trim(), plan)
      setVentText("")
      navigation.navigate("VoiceCall", {
        ventText: ventText.trim(),
        plan,
        roomId,
        isHost: true,
      })
    } catch (error) {
      Alert.alert("Room Creation Failed", error.message || "An error occurred.")
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleSubmitVent = () => {
    if (ventText.trim() === "") {
      Alert.alert("Empty Vent", "Please type what's on your mind.")
      return
    }
    setModalVisible(true)
  }

  const getCharacterCountColor = () => {
    const length = ventText.length
    if (length > 450) return "#ff6b6b"
    if (length > 400) return "#ffd93d"
    return "rgba(255, 255, 255, 0.5)"
  }

  return (
    <LinearGradient colors={["#1a1a40", "#0f0f2e"]} style={styles.gradientContainer}>
      <View style={styles.backgroundElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 40, 
              paddingBottom: 30, 
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mainContent}>
              <View style={styles.headerSection}>
                <View style={styles.titleContainer}>
                  <Text style={styles.emoji}>💭</Text>
                  <Text style={styles.title}>What's weighing{"\n"}on your mind?</Text>
                </View>
                <Text style={styles.subtitle}>Share your thoughts in a safe, anonymous space</Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type what's on your mind..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  value={ventText}
                  onChangeText={setVentText}
                  returnKeyType="done"
                  blurOnSubmit
                  textAlignVertical="top"
                  maxLength={500}
                  editable={!isCreatingRoom}
                />
                <Text style={[styles.characterCount, { color: getCharacterCountColor() }]}>{ventText.length}/500</Text>
              </View>

              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎭</Text>
                  <Text style={styles.featureText}>Anonymous</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🔒</Text>
                  <Text style={styles.featureText}>Private</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎙️</Text>
                  <Text style={styles.featureText}>Voice Only</Text>
                </View>
              </View>

              <View style={styles.actionSection}>
                <Text style={styles.helperText}>No filters. No faces. Just your voice, your story.</Text>

                <TouchableOpacity
                  onPress={handleSubmitVent}
                  style={[styles.submitButton, (!ventText.trim() || isCreatingRoom) && styles.disabledButton]}
                  disabled={!ventText.trim() || isCreatingRoom}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      ventText.trim() && !isCreatingRoom
                        ? ["#FFD93D", "#ff8a42e8"]
                        : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]
                    }
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isCreatingRoom ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.loadingText}>Creating your space...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.submitButtonText}>Start Vent Session</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <PaymentModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  )
}

export default Vent

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
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
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginBottom: 20,
  },
  featureItem: {
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  actionSection: {
    alignItems: "center",
  },
  helperText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
    lineHeight: 22,
  },
  submitButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FFD93D",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    color: "#000",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 12,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
})
