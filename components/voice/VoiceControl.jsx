import { View, TouchableOpacity, Text, StyleSheet, Animated } from "react-native"
import { useRef, useEffect } from "react"

export default function VoiceControls({
  muted = false,
  speakerMuted = false,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  disabled = false,
  connectionStatus = "disconnected",
}) {
  const connectionPulseAnim = useRef(new Animated.Value(1)).current

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4ade80"
      case "connecting":
        return "#fbbf24"
      case "failed":
      case "disconnected":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "requesting_permissions":
        return "Requesting permissions..."
      case "initializing":
        return "Initializing..."
      case "failed":
        return "Connection failed"
      case "disconnected":
        return "Disconnected"
      default:
        return "Unknown status"
    }
  }

  // Animate connection indicator when connecting
  useEffect(() => {
    if (connectionStatus === "connecting" || connectionStatus === "initializing") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(connectionPulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(connectionPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      )
      pulse.start()

      return () => pulse.stop()
    } else {
      connectionPulseAnim.setValue(1)
    }
  }, [connectionStatus, connectionPulseAnim])

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Animated.View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: getConnectionColor(),
              transform: [{ scale: connectionPulseAnim }],
            },
          ]}
        />
        <Text style={styles.statusText}>{getConnectionText()}</Text>
      </View>

      {/* Voice Controls */}
      <View style={styles.controlsContainer}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[styles.controlButton, muted && styles.muteActiveButton, disabled && styles.disabledButton]}
          onPress={onToggleMute}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.controlIcon, muted && styles.mutedIcon]}>{muted ? "🔇" : "🎤"}</Text>
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.endCallButton, disabled && styles.disabledButton]}
          onPress={onEndCall}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Text style={styles.endCallIcon}>📞</Text>
        </TouchableOpacity>

        {/* Speaker Button */}
        <TouchableOpacity
          style={[styles.controlButton, speakerMuted && styles.speakerActiveButton, disabled && styles.disabledButton]}
          onPress={onToggleSpeaker}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.controlIcon, speakerMuted && styles.mutedIcon]}>{speakerMuted ? "🔈" : "🔊"}</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Quality Indicator */}
      {connectionStatus === "connected" && (
        <View style={styles.qualityContainer}>
          <View style={styles.qualityBars}>
            <View style={[styles.qualityBar, styles.qualityBar1]} />
            <View style={[styles.qualityBar, styles.qualityBar2]} />
            <View style={[styles.qualityBar, styles.qualityBar3]} />
            <View style={[styles.qualityBar, styles.qualityBar4]} />
          </View>
          <Text style={styles.qualityText}>Good Quality</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    width: "100%",
  },

  // Connection Status
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
  },

  // Controls Container
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
    marginBottom: 20,
  },

  // Control Buttons
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  muteActiveButton: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderColor: "#ef4444",
  },

  speakerActiveButton: {
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    borderColor: "#a855f7",
  },

  controlIcon: {
    fontSize: 24,
  },

  mutedIcon: {
    opacity: 0.8,
  },

  // End Call Button
  endCallButton: {
    backgroundColor: "#ef4444",
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#dc2626",
  },

  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: "135deg" }],
  },

  // Disabled State
  disabledButton: {
    opacity: 0.4,
  },

  // Quality Indicator
  qualityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  qualityBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginRight: 8,
  },

  qualityBar: {
    width: 3,
    backgroundColor: "#4ade80",
    marginHorizontal: 1,
    borderRadius: 1.5,
  },

  qualityBar1: {
    height: 6,
  },

  qualityBar2: {
    height: 10,
  },

  qualityBar3: {
    height: 14,
  },

  qualityBar4: {
    height: 18,
  },

  qualityText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
})
