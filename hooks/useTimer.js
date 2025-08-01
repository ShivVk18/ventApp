

import { useState, useEffect, useRef } from "react";

/**
 * @typedef {object} UseTimerReturn
 * @property {number} sessionTime - The total time elapsed since the timer started (in seconds).
 * @property {number} timeRemaining - The time left on the countdown timer (in seconds).
 * @property {boolean} isRunning - True if the timer is currently running, false otherwise.
 * @property {() => void} startTimer - Function to start the timer.
 * @property {() => void} stopTimer - Function to stop the timer.
 * @property {(newDuration?: number) => void} resetTimer - Function to reset the timer to its initial duration or a new specified duration.
 */

/**
 * A custom React hook for managing a countdown and session timer.
 *
 * @param {number} initialDuration - The initial duration for the countdown timer in seconds.
 * @param {() => void} [onTimeUp] - An optional callback function to be executed when the time runs out.
 * @returns {UseTimerReturn} An object containing timer state and control functions.
 */
const useTimer = (initialDuration, onTimeUp) => {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  /** @type {React.MutableRefObject<NodeJS.Timeout | null>} */
  const intervalRef = useRef(null);
  /** @type {React.MutableRefObject<(() => void) | undefined>} */
  const onTimeUpRef = useRef(onTimeUp);

  // Update the callback ref when it changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            if (onTimeUpRef.current) {
              onTimeUpRef.current();
            }
            // Clear interval here as well to prevent multiple calls
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return 0;
          }
          return newTime;
        });

        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      // If timer is not running or time is 0, clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function: This runs when the component unmounts or before the
    // effect runs again if its dependencies change.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]); // Dependencies: Re-run effect if these change

  const startTimer = () => {
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /**
   * Resets the timer to its initial duration or a new specified duration.
   * @param {number} [newDuration] - Optional new duration to set the timer to.
   */
  const resetTimer = (newDuration) => {
    stopTimer(); // Stop the timer first
    const duration = newDuration !== undefined ? newDuration : initialDuration;
    setTimeRemaining(duration);
    setSessionTime(0);
  };

  // Auto-start timer when component mounts
  useEffect(() => {
    startTimer();
    // Cleanup on unmount, ensures timer stops if component is removed from DOM
    return () => stopTimer();
  }, []); // Empty dependency array means this effect runs only once on mount

  return {
    sessionTime,
    timeRemaining,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
  };
};

export default useTimer;