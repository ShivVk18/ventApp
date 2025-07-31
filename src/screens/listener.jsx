import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import GradientContainer from "../../components/ui/GradientContainer"
import StatusBar from "../../components/ui/StatusBar"
import Button from "../../components/ui/Button"
import RoomService from "../../services/RoomService"
import ZegoCallService from "../../services/ZegoCallService"

const { width } = Dimensions.get('window')

export default function ListenerBrowserScreen() {
  const navigation = useNavigation()
  const [availableRooms, setAvailableRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    console.log("📡 Listening for available rooms...")
    const unsubscribe = RoomService.listenToAvailableRooms((rooms) => {
      console.log("📡 Updated rooms:", rooms.length)
      setAvailableRooms(rooms)
      setLoading(false)
      setRefreshing(false)
    })

    return () => unsubscribe()
  }, [])

  const handleJoinAsListener = async (room) => {
    console.log("🎧 Trying to join:", room.id)

    const hasPermissions = await ZegoCallService.requestPermissions()
    if (!hasPermissions) {
      Alert.alert("Microphone Needed", "We need mic access to connect you to the venter.")
      return
    }

    Alert.alert(
      "Join This Session?",
      `Jump into: ${room.ventText?.slice(0, 50)}...?\n\nYoull be able to listen and gently support.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join Session",
          onPress: async () => {
            try {
              const success = await RoomService.joinRoomAsListener(room.id)
              if (!success) {
                Alert.alert("Oops", "Couldn't join. Try another session?")
                return
              }

              navigation.navigate("VoiceCall", {
                roomId: room.id,
                isHost: false,
                ventText: room.ventText,
                plan: room.plan,
              })
            } catch (error) {
              console.error("❌ Join error:", error)
              Alert.alert("Error", "Something went wrong while joining.")
            }
          },
        },
      ],
    )
  }

  const handleRefresh = () => {
    setRefreshing(true)
  }

  const formatTimeAgo = (date) => {
    if (!date) return "Unknown"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getRandomOneLiner = () => {
    const oneLiners = [
      "Be the ear they need 👂",
      "Your silence speaks volumes 🤫",
      "Sometimes listening is everything 🎧",
      "Be their safe space 🏠",
      "Lend your heart, not advice 💝",
      "Just being there matters ✨",
      "Your presence is a present 🎁"
    ]
    return oneLiners[Math.floor(Math.random() * oneLiners.length)]
  }

  const renderRoomItem = ({ item: room }) => (
    <View style={styles.roomCard}>
      <TouchableOpacity 
        style={styles.cardTouchable}
        onPress={() => handleJoinAsListener(room)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.leftSection}>
            <View style={styles.planChip}>
              <Text style={styles.planText}>{room.plan}</Text>
            </View>
            <Text style={styles.timeStamp}>{formatTimeAgo(room.createdAt)}</Text>
          </View>
          
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusLabel}>Live</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.ventPreview} numberOfLines={2}>
            {room.ventText || "Someone needs to share what's on their mind..."}
          </Text>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.oneLiner}>{getRandomOneLiner()}</Text>
          <View style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Listen</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <GradientContainer>
        <StatusBar />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingEmoji}>🛰</Text>
            <Text style={styles.loadingText}>Scanning for open hearts...</Text>
          </View>
        </View>
      </GradientContainer>
    )
  }

  return (
    <GradientContainer>
      
            <View style={styles.backgroundElements}>
                    <View style={[styles.floatingCircle, styles.circle1]} />
                    <View style={[styles.floatingCircle, styles.circle2]} />
                    <View style={[styles.floatingCircle, styles.circle3]} />
                  </View>
            
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Be Someone's Safe Space</Text>
          <Text style={styles.subtitle}>
            Real people sharing real feelings — just listen 🎧
          </Text>
        </View>

        {availableRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌙</Text>
            <Text style={styles.emptyTitle}>Peaceful vibes only</Text>
            <Text style={styles.emptySubtitle}>
              No one needs to vent right now, but your kindness is always welcome.
            </Text>
            <TouchableOpacity 
              style={styles.createSessionButton}
              onPress={() => navigation.navigate("Vent")}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>Start Your Own Space</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listWrapper}>
            <FlatList
              data={availableRooms}
              keyExtractor={(item) => item.id}
              renderItem={renderRoomItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={handleRefresh} 
                  tintColor="rgba(255, 255, 255, 0.7)"
                  colors={["rgba(255, 255, 255, 0.7)"]}
                />
              }
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
      </View>
    </GradientContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
    backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circle1: {
    width: 120,
    height: 120,
    top: '15%',
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    top: '60%',
    left: -20,
  },
  circle3: {
    width: 200,
    height: 200,
    bottom: '10%',
    right: -60,
  },
   
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 18,
    fontWeight: "500",
  },

  // Header
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: "center",
  },
  mainTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "400",
  },

  // Room Cards
  listWrapper: {
    flex: 1,
    paddingBottom: 100,
  },
  listContainer: {
    paddingVertical: 10,
  },
  separator: {
    height: 12,
  },
  roomCard: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    marginHorizontal: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTouchable: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  leftSection: {
    flex: 1,
  },
  planChip: {
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  planText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeStamp: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#fbbf24",
    marginRight: 5,
  },
  statusLabel: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "600",
  },

  // Content
  contentSection: {
    marginBottom: 16,
  },
  ventPreview: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  },

  // Action Section
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  oneLiner: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
    fontWeight: "500",
  },
  joinButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  joinButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  createSessionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // Bottom Section
  backButton: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600",
  },
})