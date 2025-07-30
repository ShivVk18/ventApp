import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { useAuth } from "../../../../Users/tanush sahu/Downloads/ventApp/ventApp/context/AuthContext"
import IdGenerator from "../../../../Users/tanush sahu/Downloads/ventApp/ventApp/utils/idGenerator"

const AuthTest = () => {
  const {
    userInfo,
    signInAnonymous,
    signInWithGoogle,
    linkWithGoogle,
    logout,
    isSigningIn,
    isSigningOut,
    isLinkingAccount,
  } = useAuth()

  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)

  const addTestResult = (test, result, success = true) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        test,
        result,
        success,
        timestamp,
      },
    ])
  }

  const testIdGeneration = async () => {
    setLoading(true)
    try {
      const uuid = await IdGenerator.generateUUID()
      const sessionId = await IdGenerator.generateSessionId()
      const userId = await IdGenerator.generateUserId()
      const shortId = await IdGenerator.generateShortId(8)
      const token = await IdGenerator.generateToken(16)

      addTestResult(
        "ID Generation",
        `
UUID: ${uuid}
Session: ${sessionId}
User: ${userId}
Short: ${shortId}
Token: ${token.substring(0, 16)}...
        `,
      )
    } catch (error) {
      addTestResult("ID Generation", error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const testAnonymousAuth = async () => {
    setLoading(true)
    try {
      await signInAnonymous()
      addTestResult("Anonymous Auth", "Successfully signed in anonymously")
    } catch (error) {
      addTestResult("Anonymous Auth", error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const testGoogleAuth = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      addTestResult("Google Auth", "Successfully signed in with Google")
    } catch (error) {
      addTestResult("Google Auth", error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const testAccountLinking = async () => {
    if (!userInfo?.isAnonymous) {
      Alert.alert("Error", "Must be signed in anonymously to test account linking")
      return
    }

    setLoading(true)
    try {
      await linkWithGoogle()
      addTestResult("Account Linking", "Successfully linked anonymous account with Google")
    } catch (error) {
      addTestResult("Account Linking", error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const testLogout = async () => {
    setLoading(true)
    try {
      await logout()
      addTestResult("Logout", "Successfully signed out")
    } catch (error) {
      addTestResult("Logout", error.message, false)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 Authentication Test</Text>

      {userInfo && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>User ID: {userInfo.uid}</Text>
          <Text style={styles.userText}>Session ID: {userInfo.sessionId}</Text>
          <Text style={styles.userText}>Email: {userInfo.email || "None"}</Text>
          <Text style={styles.userText}>Name: {userInfo.displayName || "None"}</Text>
          <Text style={styles.userText}>Anonymous: {userInfo.isAnonymous ? "Yes" : "No"}</Text>
          <Text style={styles.userText}>Provider: {userInfo.provider}</Text>
          <Text style={styles.userText}>Can Link: {userInfo.canLinkAccount ? "Yes" : "No"}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testIdGeneration}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔐 Test ID Generation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testAnonymousAuth}
          disabled={loading || isSigningIn}
        >
          <Text style={styles.buttonText}>{isSigningIn ? "Signing in..." : "👤 Test Anonymous Auth"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testGoogleAuth}
          disabled={loading || isSigningIn}
        >
          <Text style={styles.buttonText}>{isSigningIn ? "Signing in..." : "🔍 Test Google Auth"}</Text>
        </TouchableOpacity>

        {userInfo?.isAnonymous && (
          <TouchableOpacity
            style={[styles.button, styles.linkButton, loading && styles.buttonDisabled]}
            onPress={testAccountLinking}
            disabled={loading || isLinkingAccount}
          >
            <Text style={styles.buttonText}>{isLinkingAccount ? "Linking..." : "🔗 Test Account Linking"}</Text>
          </TouchableOpacity>
        )}

        {userInfo && (
          <TouchableOpacity
            style={[styles.button, styles.logoutButton, loading && styles.buttonDisabled]}
            onPress={testLogout}
            disabled={loading || isSigningOut}
          >
            <Text style={styles.buttonText}>{isSigningOut ? "Signing out..." : "🚪 Test Logout"}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>🗑️ Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📝 Test Results</Text>
        {testResults.map((result) => (
          <View key={result.id} style={[styles.resultItem, !result.success && styles.resultError]}>
            <Text style={styles.resultTest}>
              {result.success ? "✅" : "❌"} {result.test}
            </Text>
            <Text style={styles.resultTime}>{result.timestamp}</Text>
            <Text style={styles.resultText}>{result.result}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  userText: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
    fontFamily: "monospace",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ffa726",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "rgba(255, 167, 38, 0.5)",
  },
  linkButton: {
    backgroundColor: "#4ade80",
  },
  logoutButton: {
    backgroundColor: "#ff6b6b",
  },
  clearButton: {
    backgroundColor: "#6b7280",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  resultItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4ade80",
  },
  resultError: {
    borderLeftColor: "#ff6b6b",
  },
  resultTest: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  resultTime: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginBottom: 8,
  },
  resultText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontFamily: "monospace",
    lineHeight: 20,
  },
})

export default AuthTest
