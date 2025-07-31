import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PaymentModal = ({ visible, onClose, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      name: '10-Min Vent',
      price: '$2.99',
      duration: 10 * 60,
      durationInMinutes: 10,
      description: 'Quick, focused vent session',
      popular: false,
    },
    {
      name: '20-Min Vent',
      price: '$4.99',
      duration: 20 * 60,
      durationInMinutes: 20,
      description: 'Standard, comforting vent session',
      popular: true,
    },
    {
      name: '30-Min Vent',
      price: '$6.99',
      duration: 30 * 60,
      durationInMinutes: 30,
      description: 'Extended, deep-dive vent session',
      popular: false,
    },
  ];

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      Alert.alert('Payment Successful!', `You have purchased a ${selectedPlan.name}`, [
        {
          text: 'Start Session',
          onPress: () => {
            onPaymentSuccess(selectedPlan.name); 
            onClose();
          },
        },
      ]);
    }, 2000);
  };
   console.log("📦 PaymentModal visibility:", visible);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#1a1a40', '#0f0f2e']}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start Your Session</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {plans.map((p, idx) => {
            const isSelected = selectedPlan?.name === p.name;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedPlan(p)}
                style={[
                  styles.planCard,
                  isSelected && { borderColor: '#00FFAA', backgroundColor: 'rgba(0,255,170,0.08)' },
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={styles.planPrice}>{p.price}</Text>
                </View>
                <Text style={styles.planDuration}>{p.durationInMinutes} minutes</Text>
                <Text style={styles.planDescription}>{p.description}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.payButton,
              (!selectedPlan || processing) && styles.payButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={!selectedPlan || processing}
          >
            <Text style={styles.payButtonText}>
              {processing
                ? 'Processing...'
                : selectedPlan
                ? `Pay ${selectedPlan.price}`
                : 'Select a Plan'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            This is a demo payment. No actual charges will be made.
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 24,
    padding: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFC940',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planPrice: {
    color: '#FFC940',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    marginBottom: 6,
  },
  planDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  payButton: {
    backgroundColor: '#FFC940',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: 'rgba(255, 201, 64, 0.5)',
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
});

export default PaymentModal;
