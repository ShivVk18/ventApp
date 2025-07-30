import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientContainer from "../../components/ui/GradientContainer";
import StatusBar from "../../components/ui/StatusBar";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";

const FeatureItem = ({ emoji, text }) => (
  <View style={styles.feature}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [anonymousLoading, setAnonymousLoading] = useState(false);
  const { signInAnonymous } = useAuth();

  const handleAnonymousSignIn = async () => {
    if (anonymousLoading) return;
    setAnonymousLoading(true);

    try {
      await signInAnonymous();
      navigation.replace("Dashboard");
    } catch (error) {
      console.error("Anonymous Sign-in Error:", error);
    } finally {
      setAnonymousLoading(false);
    }
  };

  return (
    <GradientContainer>
      <StatusBar />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Avatar emoji="💭" size={100} />
            <Text style={styles.title}>VentBox</Text>
            <Text style={styles.subtitle}>Anonymous venting made safe</Text>
          </View>

          <View style={styles.features}>
            <FeatureItem emoji="🔒" text="Completely Anonymous" />
            <FeatureItem emoji="👂" text="Trained Listeners" />
            <FeatureItem emoji="🎯" text="Instant Matching" />
          </View>

          <Text style={styles.description}>
            Sometimes you just need someone to listen. VentBox connects you with
            caring listeners in a safe, anonymous environment.
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom || 48 }]}>
          <Button
            title={anonymousLoading ? "Signing In..." : "Get Started"}
            onPress={handleAnonymousSignIn}
            disabled={anonymousLoading}
            loading={anonymousLoading}
            style={styles.getStartedButton}
          />
          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </GradientContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
    marginTop: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "400",
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    minWidth: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: 'center',
  },
  features: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  description: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    paddingBottom: 48,
  },
  getStartedButton: {
    marginBottom: 24,
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: 'center',
    lineHeight: 16,
  },
});