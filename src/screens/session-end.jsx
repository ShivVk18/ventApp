import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import GradientContainer from '../../components/ui/GradientContainer';
import StatusBar from '../../components/ui/StatusBar';
import { useAuth } from '../../context/AuthContext';

export default function SessionEnd() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    sessionTime = '0',
    plan = 'basic',
    autoEnded = 'false',
  } = route.params || {};
  const { logout } = useAuth();

  const sessionTimeNum = Number.parseInt(sessionTime);
  const isAutoEnded = autoEnded === 'true';

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleNewVent = () => {
    navigation.navigate('Vent');
  };

  const handleGoHome = async () => {
    await logout();
    navigation.navigate('Dashboard');
  };

  const getEndMessage = () => {
    if (isAutoEnded) {
      return {
        title: "Time's Up!",
        subtitle:
          'Your 20-minute session has ended automatically.\nThanks for sharing.',
        emoji: '⏰',
      };
    }
    return {
      title: 'Session ended',
      subtitle: 'Thanks for sharing.',
      emoji: '✌️',
    };
  };

  const endMessage = getEndMessage();

  return (
    <GradientContainer>
      <StatusBar />

      <View style={styles.content}>
        <Text style={styles.anonymousText}>You are anonymous</Text>

        <View style={styles.mainContent}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{endMessage.emoji}</Text>
          </View>

          <Text style={styles.title}>{endMessage.title}</Text>
          <Text style={styles.subtitle}>{endMessage.subtitle}</Text>

          <View style={styles.sessionStats}>
            <Text style={styles.sessionDuration}>
              Session Duration: {formatTime(sessionTimeNum)}
            </Text>
            <Text style={styles.sessionPlan}>Plan: {plan}</Text>
            {isAutoEnded && (
              <Text style={styles.autoEndedText}>
                Session ended automatically after 20 minutes
              </Text>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.newVentButton}
            onPress={handleNewVent}
          >
            <Text style={styles.newVentButtonText}>New Vent</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  anonymousText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  sessionStats: {
    alignItems: 'center',
  },
  sessionDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 5,
  },
  sessionPlan: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textTransform: 'capitalize',
    marginBottom: 5,
  },
  autoEndedText: {
    color: '#ffa726',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    paddingBottom: 40,
    gap: 15,
  },
  newVentButton: {
    backgroundColor: '#ffa726',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  newVentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
