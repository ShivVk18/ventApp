import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import GradientContainer from "../components/ui/GradientContainer";
import StatusBar from "../components/ui/StatusBar";
import Button from "../components/ui/Button";
import RoomService from "../services/RoomService"; // Ensure this is the JS version
import VoiceCallService from "../services/VoiceCallService"; // Ensure this is the JS version

// JSDoc for Room type, as interfaces are not used in JS
/**
 * @typedef {object} Room
 * @property {string} id
 * @property {string} venterId
 * @property {string} venterEmail
 * @property {string} ventText
 * @property {string} plan
 * @property {"waiting" | "active" | "ended"} status
 * @property {Date | null} createdAt // Now explicitly Date or null after toDate() conversion
 * @property {string} [listenerId]
 * @property {string} [listenerEmail]
 * @property {Date | null} [startTime] // Now explicitly Date or null after toDate() conversion
 * @property {Date | null} [endTime] // Now explicitly Date or null after toDate() conversion
 * @property {number} currentListeners
 * @property {number} maxListeners
 * @property {boolean} allowListeners
 * @property {any} lastActivity // Firebase Timestamp
 */


export default function ListenerBrowserScreen() {
  const navigation = useNavigation();

  /** @type {[Room[], React.Dispatch<React.SetStateAction<Room[]>>]} */
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("📡 Starting to listen for available rooms...");

    const unsubscribe = RoomService.listenToAvailableRooms((rooms) => {
      console.log("📡 Available rooms updated:", rooms.length);
      setAvailableRooms(rooms);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Handles joining a room as a listener.
   * @param {Room} room - The room object to join.
   */
  const handleJoinAsListener = async (room) => {
    console.log("🎧 Attempting to join room as listener:", room.id);

    // Check room availability
    if (room.status === "ended") {
      Alert.alert("Session Ended", "This vent session has already ended.");
      return;
    }

    if (room.currentListeners >= room.maxListeners) {
      Alert.alert("Session Full", "This vent session is already at maximum capacity.");
      return;
    }

    // Request permissions first
    const hasPermissions = await VoiceCallService.requestPermissions();
    if (!hasPermissions) {
      Alert.alert("Permission Required", "Microphone access is required to join voice sessions.");
      return;
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
              const success = await RoomService.joinRoomAsListener(room.id);
              if (!success) {
                Alert.alert("Error", "Failed to join the session.");
                return;
              }

              console.log("✅ Navigating to voice call as listener");
              navigation.navigate("VoiceCall", {
                channelName: room.id,
                isHost: false,
                isListener: true,
                ventText: room.ventText,
                plan: room.plan,
              });
            } catch (error) {
              console.error("❌ Failed to join room:", error);
              Alert.alert("Error", "Failed to join the session.");
            }
          },
        },
      ],
    );
  };

  const handleRefresh = () => {
    console.log("🔄 Refreshing room list...");
    setRefreshing(true);
    // The useEffect listener will automatically update `availableRooms` when new data comes.
    // So, we just need to set `refreshing` to true, and it will be set to false by the listener.
  };

  /**
   * Formats a date into a human-readable "time ago" string.
   * @param {Date | null} date - The date to format.
   * @returns {string} The formatted time ago string.
   */
  const formatTimeAgo = (date) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  /**
   * Returns status indicator properties for a room.
   * @param {Room} room - The room object.
   * @returns {{color: string, text: string, emoji: string}} Status information.
   */
  const getStatusIndicator = (room) => {
    switch (room.status) {
      case "waiting":
        return { color: "#fbbf24", text: "WAITING", emoji: "⏳" };
      case "active":
        return { color: "#ef4444", text: "LIVE", emoji: "🔴" };
      default:
        return { color: "#6b7280", text: "UNKNOWN", emoji: "❓" };
    }
  };

  /**
   * Renders a single room item in the FlatList.
   * @param {{ item: Room }} - The FlatList item object containing the room.
   */
  const renderRoomItem = ({ item: room }) => {
    const statusInfo = getStatusIndicator(room);

    return (
      <TouchableOpacity style={styles.roomCard} onPress={() => handleJoinAsListener(room)}>
        <View style={styles.roomHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomPlan}>{room.plan}</Text>
            <Text style={styles.roomTime}>{formatTimeAgo(room.createdAt)}</Text>
          </View>
          <View style={styles.listenerCount}>
            <Text style={styles.listenerText}>
              👥 {room.currentListeners}/{room.maxListeners}
            </Text>
          </View>
        </View>

        <Text style={styles.ventText} numberOfLines={3}>
          {room.ventText || "Anonymous vent session"}
        </Text>

        <View style={styles.roomFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.emoji} {statusInfo.text}
            </Text>
          </View>

          <Text style={styles.joinText}>{room.status === "waiting" ? "Tap to join" : "Tap to listen"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <GradientContainer>
        <StatusBar />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Finding active vent sessions...</Text>
        </View>
      </GradientContainer>
    );
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
  );
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
  listenerCount: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listenerText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  ventText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: "italic",
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
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
});