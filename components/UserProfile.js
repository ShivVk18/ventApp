import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native"
import { useAuth } from "../../../../Users/tanush sahu/Downloads/ventApp/ventApp/context/AuthContext"

const UserProfile = ({ onPress }) => {
  const { userInfo, logout } = useAuth()

  if (!userInfo) return null

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.profileInfo}>
        {userInfo.photoURL ? (
          <Image source={{ uri: userInfo.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {userInfo.isAnonymous ? "👤" : userInfo.displayName?.charAt(0) || "U"}
            </Text>
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.name}>{userInfo.isAnonymous ? "Anonymous User" : userInfo.displayName || "User"}</Text>
          <Text style={styles.email}>{userInfo.isAnonymous ? "No email" : userInfo.email || "No email"}</Text>
          <Text style={styles.provider}>
            {userInfo.isAnonymous ? "Anonymous" : `Signed in with ${userInfo.provider}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    color: "white",
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 2,
  },
  provider: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginTop: 2,
  },
})

export default UserProfile