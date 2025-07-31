import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
} from "firebase/firestore"
import { firestore, auth } from "../config/firebase.config"

export class RoomService {
  async createRoom(ventText, plan) {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }

    const roomData = {
      venterId: user.uid,
      venterEmail: user.email,
      ventText: ventText.trim(),
      plan,
      status: "waiting",
      createdAt: serverTimestamp(),
      listenerId: null,
      listenerEmail: null,
      startTime: null,
      endTime: null,
      lastActivity: serverTimestamp(),
    }

    const newRoomRef = await addDoc(collection(firestore, "rooms"), roomData)
    console.log("✅ Room created:", newRoomRef.id)
    return newRoomRef.id
  }

  async joinRoomAsListener(roomId) {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      const roomRef = doc(firestore, "rooms", roomId)
      await updateDoc(roomRef, {
        listenerId: user.uid,
        listenerEmail: user.email,
        status: "active",
        startTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
      })

      console.log("✅ Joined room as listener:", roomId)
      return true
    } catch (error) {
      console.error("❌ Failed to join room:", error)
      return false
    }
  }

  async endRoom(roomId) {
    try {
      const roomRef = doc(firestore, "rooms", roomId)
      await updateDoc(roomRef, {
        status: "ended",
        endTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
      })

      console.log("✅ Room ended:", roomId)
    } catch (error) {
      console.error("❌ Failed to end room:", error)
    }
  }

  listenToAvailableRooms(callback) {
    const roomsQuery = query(
      collection(firestore, "rooms"),
      where("status", "==", "waiting"),
      orderBy("createdAt", "desc"),
      limit(20),
    )

    return onSnapshot(roomsQuery, (snapshot) => {
      const rooms = []
      snapshot.forEach((doc) => {
        const roomData = doc.data()
        rooms.push({
          id: doc.id,
          ...roomData,
          createdAt: roomData.createdAt?.toDate(),
        })
      })

      console.log("📡 Available rooms updated:", rooms.length)
      callback(rooms)
    })
  }

  listenToRoom(roomId, callback) {
    const roomRef = doc(firestore, "rooms", roomId)
    return onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const roomData = docSnap.data()
        const room = {
          id: docSnap.id,
          ...roomData,
          createdAt: roomData.createdAt?.toDate(),
          startTime: roomData.startTime?.toDate(),
          endTime: roomData.endTime?.toDate(),
        }

        console.log("📡 Room updated:", { id: room.id, status: room.status })
        callback(room)
      } else {
        console.log("📡 Room not found:", roomId)
        callback(null)
      }
    })
  }

  getDurationInSeconds(planName) {
    switch (planName) {
      case "10-Min Vent":
        return 10 * 60
      case "30-Min Vent":
        return 30 * 60
      case "20-Min Vent":
        return 20 * 60
      default:
        return 20 * 60
    }
  }
}

export default new RoomService()
