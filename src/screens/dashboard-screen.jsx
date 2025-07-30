import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import Button from '../../components/ui/Button';
import StatusBar from '../../components/ui/StatusBar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [signingOut, setSigningOut] = useState(false);
  const { logout } = useAuth();

  const handleVentPress = () => navigation.navigate('Vent');
  const handleListenPress = () => navigation.navigate('Listener');

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      console.log('User signed out successfully.');
      navigation.replace('WelcomeScreen');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Sign Out Error', error.message);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a40', '#0f0f2e']} style={styles.container}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Welcome to Vent Box!</Text>
        <Text style={styles.heading}>Choose your role:</Text>

        <View style={styles.mainActions}>
          <ActionCard
            emoji="🗣️"
            title="Need to Vent?"
            description="Share your thoughts with a caring listener in a safe, anonymous environment."
            buttonTitle="Vent Now"
            onPress={handleVentPress}
            variant="primary"
          />

          <ActionCard
            emoji="👂"
            title="Be a Listener"
            description="Help someone by providing a safe space for them to express their feelings."
            buttonTitle="Join as Listener"
            onPress={handleListenPress}
            variant="secondary"
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How VentBox Works</Text>
          <InfoStep
            number="1"
            title="Choose Your Role"
            description="Decide if you want to vent or listen"
          />
          <InfoStep
            number="2"
            title="Get Matched"
            description="We'll connect you with someone anonymously"
          />
          <InfoStep
            number="3"
            title="Start Talking"
            description="Have a safe, private conversation"
          />
        </View>

        <View style={styles.footer}>
          <Button
            title={signingOut ? 'Signing Out...' : 'Sign Out'}
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
            disabled={signingOut}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const ActionCard = React.memo(
  ({ emoji, title, description, buttonTitle, onPress, variant }) => (
    <View style={styles.actionCard}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
      <Button
        title={buttonTitle}
        onPress={onPress}
        variant={variant}
        style={styles.actionButton}
      />
    </View>
  )
);

const InfoStep = React.memo(({ number, title, description }) => (
  <View style={styles.infoStep}>
    <Text style={styles.stepNumber}>{number}</Text>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
    opacity: 0.9,
  },
  heading: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  mainActions: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionButton: {
    minWidth: 160,
  },
  infoSection: {
    width: '100%',
    maxWidth: 360,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFC940',
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 3,
  },
  stepDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
  },
  signOutButton: {
    minWidth: 140,
  },
});
