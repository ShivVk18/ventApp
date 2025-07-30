import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../../config/firebase.config';
import { signOut } from 'firebase/auth';

export default function DashboardScreen() {
  const navigation = useNavigation();

  const handleVentPress = () => {
    navigation.navigate('Vent');
  };

  const handleListenPress = () => {
    navigation.navigate('Listener');
  };

  const handleSignOut = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      console.log('User signed out successfully.');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Sign Out Error', error.message);
    }
  };

  return (
    <LinearGradient colors={['#1a1a40', '#0f0f2e']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a40" />

      <Text style={styles.title}>Welcome to Vent Box!</Text>
      <Text style={styles.heading}>Choose your role:</Text>

      <TouchableOpacity style={styles.roleBtn} onPress={handleVentPress}>
        <Text style={styles.roleBtnText}>I want to Vent</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.roleBtn} onPress={handleListenPress}>
        <Text style={styles.roleBtnText}>🎧 Join as Listener</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    opacity: 0.9,
  },
  heading: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleBtn: {
    backgroundColor: '#FFC940',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  roleBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 18,
  },
  signOutBtn: {
    marginTop: 30,
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  signOutBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
