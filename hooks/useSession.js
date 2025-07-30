import { useState } from "react";
import { Alert } from "react-native";
import firestoreService from "../services/firestoreService";
import matchingService from "../services/matchingService";
import { useAuth } from "../context/AuthContext";

const useSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const { user } = useAuth();

  const startSession = async (ventText) => {
    
    if (!user) return;

    setLoading(true);
    setMatching(true);

    try {
      const sessionData = await matchingService.findMatch(user.uid, ventText);
      setSession(sessionData);
      
      return sessionData;
    } catch (error) {
      Alert.alert("Matching Failed", error.message);
      throw error;
    } finally {
      setLoading(false);
      setMatching(false);
    }
  };

  const joinSession = (sessionId) => {
    if (!sessionId) return;

    const unsubscribe = firestoreService.listenToSession(sessionId, (doc) => {
      if (doc.exists()) {
        const sessionData = { id: doc.id, ...doc.data() };
        setSession(sessionData);

        // Update connection status
        if (user) {
          firestoreService.updateUserConnection(
            sessionId,
            user.uid,
            true,
            new Date()
          );
        }
      }
    });

    return unsubscribe;
  };

  const endSession = async (duration) => {
    if (!session || !user) return;

    try {
      await firestoreService.endSession(session.id, duration);
      await firestoreService.updateUserConnection(session.id, user.uid, false);
      setSession(null);
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  };

  const cancelMatching = async (queueId) => {
    if (!user) return;

    try {
      await matchingService.cancelMatching(user.uid, queueId);
      setMatching(false);
    } catch (error) {
      console.error("Error canceling matching:", error);
      throw error;
    }
  };

  return {
    session,
    loading,
    matching,
    startSession,
    joinSession,
    endSession,
    cancelMatching,
  };
};
