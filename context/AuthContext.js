import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"

import { auth } from "../config/firebase.config"
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import IdGenerator from "../utils/idGenerator"

// Constants
const AuthContext = createContext({})
export const useAuth = () => {
  
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

const AUTH_STATES = {
  IDLE: "idle",
  SIGNING_IN: "signing_in",
  SIGNING_OUT: "signing_out",
  UPDATING_PROFILE: "updating_profile",
}

const STORAGE_KEYS = {
  LAST_SIGN_IN_METHOD: "@vent_box_last_sign_in_method",
  USER_SESSION_ID: "@vent_box_user_session_id",
}

export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(null)
  const [authState, setAuthState] = useState(AUTH_STATES.IDLE)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState(null)
  const [userSessionId, setUserSessionId] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user)
        if (user) {
          await generateUserSessionId(user.uid)
          const method = user.isAnonymous ? "anonymous" : "email"
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_SIGN_IN_METHOD, method)
        } else {
          setUserSessionId(null)
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION_ID)
        }

        if (initializing) {
          setInitializing(false)
        }
      } catch (err) {
        console.error("Auth state error:", err)
        setError(err.message)
      }
    })

    return unsubscribe
  }, [initializing])

  const generateUserSessionId = async (userId) => {
    try {
      let sessionId = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION_ID)
      if (!sessionId) {
        sessionId = await IdGenerator.generateUserId()
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION_ID, sessionId)
      }
      setUserSessionId(sessionId)
      return sessionId
    } catch (err) {
      console.error("Session ID error:", err)
      const fallbackId = IdGenerator.generateFallbackId("user")
      setUserSessionId(fallbackId)
      return fallbackId
    }
  }

  // Anonymous login
  const signInAnonymous = useCallback(async () => {
  try {
    
    setAuthState(AUTH_STATES.SIGNING_IN)
    
    const result = await signInAnonymously(auth)
    
    return result.user
  } catch (err) {
    console.error("=== AUTH CONTEXT ERROR ===")
    console.error("Full error:", err)
    console.error("Error code:", err?.code)
    console.error("Error message:", err?.message)
    setError(err.message)
    Alert.alert("Error", `Anonymous sign-in failed: ${err.message}`)
    throw err
  } finally {
    setAuthState(AUTH_STATES.IDLE)
  }
}, [])

  // Email/Password Sign-in
  const signInWithEmail = useCallback(async (email, password) => {
    try {
      setAuthState(AUTH_STATES.SIGNING_IN)
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (err) {
      console.error("Email Sign-in Error:", err)
      setError(err.message)
      Alert.alert("Error", "Email/password sign-in failed")
      throw err
    } finally {
      setAuthState(AUTH_STATES.IDLE)
    }
  }, [])

  // Optional: Email/Password Signup
  const signUpWithEmail = useCallback(async (email, password, name = "") => {
    try {
      setAuthState(AUTH_STATES.SIGNING_IN)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(result.user, { displayName: name })
      }
      return result.user
    } catch (err) {
      console.error("Email Signup Error:", err)
      setError(err.message)
      Alert.alert("Error", "Sign-up failed")
      throw err
    } finally {
      setAuthState(AUTH_STATES.IDLE)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setAuthState(AUTH_STATES.SIGNING_OUT)
      await signOut(auth)
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION_ID)
    } catch (err) {
      console.error("Logout Error:", err)
      setError(err.message)
      Alert.alert("Error", "Sign-out failed")
      throw err
    } finally {
      setAuthState(AUTH_STATES.IDLE)
    }
  }, [])

  const updateUserProfile = useCallback(async (profileData) => {
    if (!user) throw new Error("No user logged in")
    try {
      setAuthState(AUTH_STATES.UPDATING_PROFILE)
      await updateProfile(user, profileData)
      setUser({ ...user, ...profileData })
    } catch (err) {
      console.error("Profile Update Error:", err)
      setError(err.message)
      Alert.alert("Error", "Failed to update profile")
      throw err
    } finally {
      setAuthState(AUTH_STATES.IDLE)
    }
  }, [user])

  const getUserInfo = () => {
    if (!user) return null
    return {
      uid: user.uid,
      sessionId: userSessionId,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      provider: user.providerData[0]?.providerId || "anonymous",
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    }
  }

  const isLoading = useCallback((op) => {
    return op ? authState === op : authState !== AUTH_STATES.IDLE
  }, [authState])

  const clearError = () => setError(null)

  const value = {
    user,
    userInfo: getUserInfo(),
    userSessionId,
    authState,
    initializing,
    error,
    signInAnonymous,
    signInWithEmail,
    signUpWithEmail, // optional
    logout,
    updateUserProfile,
    clearError,
    isSigningIn: isLoading(AUTH_STATES.SIGNING_IN),
    isSigningOut: isLoading(AUTH_STATES.SIGNING_OUT),
    isUpdatingProfile: isLoading(AUTH_STATES.UPDATING_PROFILE),
  }

  if (initializing) return null

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
