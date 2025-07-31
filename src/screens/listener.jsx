import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useNavigation } from "@react-navigation/native"
import GradientContainer from "../../components/ui/GradientContainer"
import StatusBar from "../../components/ui/StatusBar"
import Button from "../../components/ui/Button"
import RoomService from "../../services/RoomService"
import ZegoCallService from "../../services/ZegoCallService"

export default function ListenerBrowserScreen() {
  const navigation = useNavigation()
  const [availableRooms, setAvailableRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    console.log("📡 Starting to listen for available rooms...")
    const unsubscribe = RoomService.listenToAvailableRooms((rooms) => {
      console.log("📡 Available rooms updated:", rooms.length)
      setAvailableRooms(rooms)
      setLoading(false)
      setRefreshing(false)
    })

    return () => unsubscribe()
  }, [])

  const handleJoinAsListener = async (room) => {
    console.log("🎧 Attempting to join room as listener:", room.id)

    // Request permissions first
    const hasPermissions = await ZegoCallService.requestPermissions()
    if (!hasPermissions) {
      Alert.alert("Permission Required", "Microphone access is required to join voice sessions.")
      return
    }

    Alert.alert(
      "Join as Listener",
      `Join "${room.ventText?.slice(0, 50)}..." as a listener?\n\nYou'll be able to hear the venter and speak to provide support.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join Session",
          onPress: async () => {
            try {
              // Join room in Firebase
              const success = await RoomService.joinRoomAsListener(room.id)
              if (!success) {
                Alert.alert("Error", "Failed to join the session.")
                return
              }

              console.log("✅ Navigating to voice call as listener")
              navigation.navigate("VoiceCall", {
                roomId: room.id,
                isHost: false,
                ventText: room.ventText,
                plan: room.plan,
              })
            } catch (error) {
              console.error("❌ Failed to join room:", error)
              Alert.alert("Error", "Failed to join the session.")
            }
          },
        },
      ],
    )
  }

  const handleRefresh = () => {
    console.log("🔄 Refreshing room list...")
    setRefreshing(true)
  }

  const formatTimeAgo = (date) => {
    if (!date) return "Unknown"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const renderRoomItem = ({ item: room }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleJoinAsListener(room)}>
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomPlan}>{room.plan}</Text>
          <Text style={styles.roomTime}>{formatTimeAgo(room.createdAt)}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>⏳ WAITING</Text>
        </View>
      </View>

      <Text style={styles.ventText} numberOfLines={3}>
        {room.ventText || "Anonymous vent session"}
      </Text>

      <View style={styles.roomFooter}>
        <Text style={styles.joinText}>Tap to join as listener</Text>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <GradientContainer>
        <StatusBar />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Finding active vent sessions...</Text>
        </View>
      </GradientContainer>
    )
  }

  return (
    <GradientContainer>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Live Vent Sessions</Text>
          <Text style={styles.subtitle}>Join as a listener to support others</Text>
        </View>

        {availableRooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>🔇 No active sessions</Text>
            <Text style={styles.emptyText}>
              There are no live vent sessions right now.{"\n"}
              Check back later or start your own session!
            </Text>
            <Button
              title="Start Your Own Session"
              onPress={() => navigation.navigate("Vent")}
              style={styles.createButton}
            />
          </View>
        ) : (
          <FlatList
            data={availableRooms}
            keyExtractor={(item) => item.id}
            renderItem={renderRoomItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="white" />}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.bottomNav}>
          <Button
            title="← Back to Dashboard"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </View>
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 18,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 100,
  },
  roomCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomPlan: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  roomTime: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fbbf24",
    marginRight: 6,
  },
  statusText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "bold",
  },
  ventText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: "italic",
  },
  roomFooter: {
    alignItems: "center",
  },
  joinText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  createButton: {
    marginTop: 10,
  },
  bottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})
