

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
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import LinearGradient from "react-native-linear-gradient"
import PaymentModal from "../../components/PaymentModal"
import { useNavigation } from "@react-navigation/native"
import RoomService from "../../services/RoomService"

const Vent = () => {
  const navigation = useNavigation()
  const [ventText, setVentText] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const insets = useSafeAreaInsets()

  const handlePaymentSuccess = async (plan) => {
    console.log(`💳 Payment completed for plan: ${plan}`)
    await createRoom(plan)
  }

  const createRoom = async (plan) => {
    console.log("🏗️ Starting room creation...", { plan, ventTextLength: ventText.trim().length })

    if (ventText.trim() === "") {
      Alert.alert("Empty Vent", "Vent text cannot be empty.")
      return
    }

    setIsCreatingRoom(true)

    try {
      const roomId = await RoomService.createRoom(ventText.trim(), plan)

      console.log("🎉 SUCCESS: Room created!", { roomId, plan })

      setVentText("")

      navigation.navigate("VoiceCall", {
        ventText: ventText.trim(),
        plan,
        roomId,
        isHost: true,
      })
    } catch (error) {
      console.error("❌ Error creating room:", error)
      Alert.alert("Room Creation Failed", error.message || "An error occurred while creating the room.")
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleSubmitVent = () => {
    console.log("📝 User submitting vent:", { textLength: ventText.trim().length })

    if (ventText.trim() === "") {
      Alert.alert("Empty Vent", "Please type what's on your mind before submitting.")
      return
    }

    setModalVisible(true)
  }

  return (
    <LinearGradient colors={["#1a1a40", "#0f0f2e"]} style={styles.gradientContainer}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mainContent}>
              <Text style={styles.title}>Share Your Vent 💭</Text>

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
                <Text style={styles.characterCount}>{ventText.length}/500</Text>
              </View>

              <Text style={styles.helperText}>Your vent is anonymous</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleSubmitVent}
                  style={[styles.submitButton, (!ventText.trim() || isCreatingRoom) && styles.disabledButton]}
                  disabled={!ventText.trim() || isCreatingRoom}
                >
                  {isCreatingRoom ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={[styles.submitButtonText, { marginLeft: 8, color: "#fff" }]}>Creating Room...</Text>
                    </>
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
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
  container: {
    flex: 1,
    paddingHorizontal: 30,
  },
  content: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 44,
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
  buttonContainer: {
    marginTop: 20,
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#FFC940",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
})
