import {
  doc,
  updateDoc,
  serverTimestamp,
  increment,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
} from "firebase/firestore";
import { firestore, auth } from "../config/firebase.config";

// No explicit interfaces in JavaScript, but you can define a JSDoc typedef for clarity.

/**
 * @typedef {object} Room
 * @property {string} id
 * @property {string} venterId
 * @property {string} venterEmail
 * @property {string} ventText
 * @property {string} plan
 * @property {"waiting" | "active" | "ended"} status
 * @property {any} createdAt // Firebase Timestamp
 * @property {string} [listenerId]
 * @property {string} [listenerEmail]
 * @property {any} [startTime] // Firebase Timestamp
 * @property {any} [endTime] // Firebase Timestamp
 * @property {number} currentListeners
 * @property {number} maxListeners
 * @property {boolean} allowListeners
 * @property {any} lastActivity // Firebase Timestamp
 * @property {Object.<string, RoomParticipant>} [participants]
 */

/**
 * @typedef {object} RoomParticipant
 * @property {number} uid
 * @property {"venter" | "listener"} role
 * @property {any} joinedAt // Firebase Timestamp
 * @property {boolean} connected
 * @property {string} [email]
 * @property {any} [agoraUid]
 */

export class RoomService {
  /**
   * Creates a new vent room.
   * @param {string} ventText - The text of the vent.
   * @param {string} plan - The plan chosen for the vent (e.g., "10-Min Vent").
   * @returns {Promise<string>} The ID of the newly created room.
   * @throws {Error} If the user is not authenticated.
   */
  async createRoom(ventText, plan) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const roomData = {
      venterId: user.uid,
      venterEmail: user.email,
      ventText: ventText.trim(),
      plan,
      status: "waiting", // Using string literal as const equivalent
      createdAt: serverTimestamp(),
      createdBy: user.email,
      listenerId: null, // Initializing as null as per interface
      listenerEmail: null, // Initializing as null as per interface
      startTime: null, // Initializing as null as per interface
      endTime: null, // Initializing as null as per interface
      allowListeners: true,
      currentListeners: 0,
      maxListeners: 2,
      lastActivity: serverTimestamp(),
      participants: {},
    };

    const newRoomRef = await addDoc(collection(firestore, "rooms"), roomData);
    console.log("✅ Room created:", newRoomRef.id);
    return newRoomRef.id;
  }

  /**
   * Joins an existing room as a listener.
   * @param {string} roomId - The ID of the room to join.
   * @returns {Promise<boolean>} True if successfully joined, false otherwise.
   * @throws {Error} If the user is not authenticated.
   */
  async joinRoomAsListener(roomId) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const roomRef = doc(firestore, "rooms", roomId);
      await updateDoc(roomRef, {
        currentListeners: increment(1),
        lastActivity: serverTimestamp(),
        [`participants.${user.uid}`]: {
          role: "listener",
          joinedAt: serverTimestamp(),
          connected: false,
          email: user.email,
        },
      });

      console.log("✅ Joined room as listener:", roomId);
      return true;
    } catch (error) {
      console.error("❌ Failed to join room:", error);
      return false;
    }
  }

  /**
   * Updates the status of a room.
   * @param {string} roomId - The ID of the room to update.
   * @param {"waiting" | "active" | "ended"} status - The new status of the room.
   * @returns {Promise<void>}
   */
  async updateRoomStatus(roomId, status) {
    try {
      const roomRef = doc(firestore, "rooms", roomId);
      const updateData = {
        status,
        lastActivity: serverTimestamp(),
      };

      if (status === "active") {
        updateData.startTime = serverTimestamp();
      } else if (status === "ended") {
        updateData.endTime = serverTimestamp();
      }

      await updateDoc(roomRef, updateData);
      console.log("✅ Room status updated:", { roomId, status });
    } catch (error) {
      console.error("❌ Failed to update room status:", error);
    }
  }

  /**
   * Updates the connection status of a participant in a room.
   * @param {string} roomId - The ID of the room.
   * @param {string} userId - The UID of the user whose connection status is being updated.
   * @param {boolean} connected - The new connection status (true if connected, false if disconnected).
   * @param {number} [agoraUid] - Optional Agora UID for the participant.
   * @returns {Promise<void>}
   */
  async updateParticipantConnection(roomId, userId, connected, agoraUid) {
    try {
      const roomRef = doc(firestore, "rooms", roomId);
      const updateData = {
        [`participants.${userId}.connected`]: connected,
        [`participants.${userId}.lastUpdate`]: serverTimestamp(),
        lastActivity: serverTimestamp(),
      };

      if (agoraUid !== undefined) {
        updateData[`participants.${userId}.agoraUid`] = agoraUid;
      }

      await updateDoc(roomRef, updateData);
      console.log("✅ Participant connection updated:", {
        roomId,
        userId,
        connected,
      });
    } catch (error) {
      console.error("❌ Failed to update participant connection:", error);
    }
  }

  /**
   * Allows a user to leave a room.
   * @param {string} roomId - The ID of the room to leave.
   * @param {boolean} [isListener=false] - True if the user is a listener, false if the venter.
   * @returns {Promise<void>}
   */
  async leaveRoom(roomId, isListener = false) {
    const user = auth.currentUser;
    if (!user) return; // Cannot leave if no user is authenticated

    try {
      const roomRef = doc(firestore, "rooms", roomId);
      const updateData = {
        lastActivity: serverTimestamp(),
      };

      if (isListener) {
        updateData.currentListeners = increment(-1);
        updateData[`participants.${user.uid}`] = null; // Remove participant by setting to null
      } else {
        // If venter leaves, end the room
        updateData.status = "ended";
        updateData.endTime = serverTimestamp();
      }

      await updateDoc(roomRef, updateData);
      console.log("✅ Left room:", { roomId, isListener });
    } catch (error) {
      console.error("❌ Failed to leave room:", error);
    }
  }

  /**
   * Listens to real-time updates for available rooms.
   * @param {(rooms: Room[]) => void} callback - Callback function to receive the updated list of rooms.
   * @returns {() => void} An unsubscribe function to stop listening to updates.
   */
  listenToAvailableRooms(callback) {
    const roomsQuery = query(
      collection(firestore, "rooms"),
      where("status", "in", ["waiting", "active"]),
      where("allowListeners", "==", true),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    return onSnapshot(roomsQuery, (snapshot) => {
      const rooms = [];
      snapshot.forEach((doc) => {
        const roomData = doc.data();
        rooms.push({
          id: doc.id,
          ...roomData,
          createdAt: roomData.createdAt?.toDate(),
        });
      });

      console.log("📡 Available rooms updated:", rooms.length);
      callback(rooms);
    });
  }

  /**
   * Listens to real-time updates for a specific room.
   * @param {string} roomId - The ID of the room to listen to.
   * @param {(room: Room | null) => void} callback - Callback function to receive the updated room data.
   * @returns {() => void} An unsubscribe function to stop listening to updates.
   */
  listenToRoom(roomId, callback) {
    const roomRef = doc(firestore, "rooms", roomId);

    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const roomData = docSnap.data();
        const room = {
          id: docSnap.id,
          ...roomData,
          createdAt: roomData.createdAt?.toDate(),
          startTime: roomData.startTime?.toDate(),
          endTime: roomData.endTime?.toDate(),
        };

        console.log("📡 Room updated:", { id: room.id, status: room.status });
        callback(room);
      } else {
        console.log("📡 Room not found:", roomId);
        callback(null);
      }
    });
  }

  /**
   * Gets the duration of a vent plan in seconds.
   * @param {string} planName - The name of the vent plan (e.g., "10-Min Vent").
   * @returns {number} The duration in seconds.
   */
  getDurationInSeconds(planName) {
    switch (planName) {
      case "10-Min Vent":
        return 10 * 60;
      case "30-Min Vent":
        return 30 * 60;
      case "20-Min Vent":
        return 20 * 60;
      default:
        return 20 * 60; // Default to 20 minutes if plan is not recognized
    }
  }
}

export default new RoomService();