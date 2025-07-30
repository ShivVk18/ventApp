import { View, Text, StyleSheet } from "react-native"

const Avatar = ({ emoji = "👤", size = "large", style }) => {
  const getAvatarSize = () => {
    switch (size) {
      case "small":
        return { width: 60, height: 60, borderRadius: 30 }
      case "medium":
        return { width: 80, height: 80, borderRadius: 40 }
      default:
        return { width: 120, height: 120, borderRadius: 60 }
    }
  }

  const getEmojiSize = () => {
    switch (size) {
      case "small":
        return 25
      case "medium":
        return 35
      default:
        return 60
    }
  }

  return (
    <View style={[styles.avatar, getAvatarSize(), style]}>
      <Text style={[styles.emoji, { fontSize: getEmojiSize() }]}>{emoji}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  emoji: {
    textAlign: "center",
  },
})

export default Avatar
