import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";

const useTimer = (initialTime = 1200, onTimeUp) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const intervalRef = useRef(null);
  const hasShownFiveMinWarning = useRef(false);
  const hasShownOneMinWarning = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSessionTime((prev) => prev + 1);
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTimeUp]);

  useEffect(() => {
    if (timeRemaining === 300 && !hasShownFiveMinWarning.current) {
      hasShownFiveMinWarning.current = true;
      Alert.alert(
        "Session Ending Soon",
        "Your session will end in 5 minutes.",
        [{ text: "OK" }]
      );
    }

    if (timeRemaining === 60 && !hasShownOneMinWarning.current) {
      hasShownOneMinWarning.current = true;
      Alert.alert("Session Ending Soon", "Your session will end in 1 minute.", [
        { text: "OK" },
      ]);
    }
  }, [timeRemaining]);

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return {
    sessionTime,
    timeRemaining,
    stopTimer,
  };
};

export default useTimer;
