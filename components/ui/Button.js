import { TouchableOpacity, Text, StyleSheet } from "react-native"

const Button = ({ title, onPress, variant = "primary", disabled = false, style, textStyle }) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return [styles.button, styles.secondaryButton, disabled && styles.disabledButton, style]
      case "outline":
        return [styles.button, styles.outlineButton, disabled && styles.disabledButton, style]
      case "danger":
        return [styles.button, styles.dangerButton, disabled && styles.disabledButton, style]
      default:
        return [styles.button, styles.primaryButton, disabled && styles.disabledButton, style]
    }
  }

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return [styles.buttonText, styles.secondaryText, textStyle]
      case "outline":
        return [styles.buttonText, styles.outlineText, textStyle]
      default:
        return [styles.buttonText, styles.primaryText, textStyle]
    }
  }

  return (
    <TouchableOpacity style={getButtonStyle()} onPress={onPress} disabled={disabled}>
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#ffa726",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  outlineButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  dangerButton: {
    backgroundColor: "#ff6b6b",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    color: "white",
  },
  secondaryText: {
    color: "#000",
  },
  outlineText: {
    color: "white",
  },
})

export default Button