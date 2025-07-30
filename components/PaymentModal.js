import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from "react-native"
import LinearGradient from "react-native-linear-gradient"

const PaymentModal = ({ visible, onClose, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false)

  const plan = {
    name: "Standard Session",
    price: "₹150",
    duration: "20 minutes",
    description: "One-on-one vent session with a trained listener",
  }

  const handlePayment = async () => {
    setProcessing(true)

    setTimeout(() => {
      setProcessing(false)
      Alert.alert("Payment Successful!", `You have purchased a ${plan.name}`, [
        {
          text: "Start Session",
          onPress: () => {
            onPaymentSuccess("standard")
            onClose()
          },
        },
      ])
    }, 2000)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start Your Session</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            <Text style={styles.planDuration}>{plan.duration}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>

          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={processing}
          >
            <Text style={styles.payButtonText}>
              {processing ? "Processing..." : `Pay ${plan.price}`}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>This is a demo payment. No actual charges will be made.</Text>
        </LinearGradient>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ffa726",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  planName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  planPrice: {
    color: "#ffa726",
    fontSize: 18,
    fontWeight: "bold",
  },
  planDuration: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 5,
  },
  planDescription: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  payButton: {
    backgroundColor: "#ffa726",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
  },
  payButtonDisabled: {
    backgroundColor: "rgba(255, 167, 38, 0.5)",
  },
  payButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  disclaimer: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
})

export default PaymentModal