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
  getDoc,
} from "firebase/firestore"
import { firestore, auth } from "../config/firebase.config"

export class RoomService {
  async createRoom(ventText, plan) {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }

    console.log("🏠 Creating room with:", { ventText: ventText.slice(0, 50), plan, userId: user.uid })

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
      participantCount: 1, // Add participant tracking
    }

    const newRoomRef = await addDoc(collection(firestore, "rooms"), roomData)
    console.log("✅ Room created successfully:", newRoomRef.id)
    return newRoomRef.id
  }

  async joinRoomAsListener(roomId) {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      console.log("🎧 Attempting to join room as listener:", { roomId, userId: user.uid })

      
      const roomRef = doc(firestore, "rooms", roomId)
      const roomDoc = await getDoc(roomRef)
      
      if (!roomDoc.exists()) {
        console.error("❌ Room does not exist:", roomId)
        return false
      }

      const roomData = roomDoc.data()
      console.log("📋 Room current status:", roomData.status)

      if (roomData.status !== "waiting") {
        console.error("❌ Room not available for joining:", roomData.status)
        return false
      }

      
      await updateDoc(roomRef, {
        listenerId: user.uid,
        listenerEmail: user.email,
        status: "active",
        startTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
        participantCount: 2,
      })

      console.log("✅ Successfully joined room as listener:", roomId)
      return true
    } catch (error) {
      console.error("❌ Failed to join room:", error)
      return false
    }
  }

  async updateRoomActivity(roomId) {
    try {
      const roomRef = doc(firestore, "rooms", roomId)
      await updateDoc(roomRef, {
        lastActivity: serverTimestamp(),
      })
      console.log("📈 Room activity updated:", roomId)
    } catch (error) {
      console.error("❌ Failed to update room activity:", error)
    }
  }  

  async leaveRoom(roomId) {
    try {
      console.log("🚶‍♂ Listener leaving room:", roomId);
      const roomRef = doc(firestore, "rooms", roomId);
      await updateDoc(roomRef, {
        listenerId: null,
        listenerEmail: null,
        status: "ended",
        
      });
      console.log("✅ Room updated: listener left successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to leave room:", error);
      return false;
    }
  }

  async endRoom(roomId) {
    try {
      console.log("🔚 Ending room:", roomId)
      const roomRef = doc(firestore, "rooms", roomId)
      await updateDoc(roomRef, {
        status: "ended",
        endTime: serverTimestamp(),
        lastActivity: serverTimestamp(),
      })

      console.log("✅ Room ended successfully:", roomId)
    } catch (error) {
      console.error("❌ Failed to end room:", error)
    }
  }

  listenToAvailableRooms(callback) {
    console.log("👂 Setting up listener for available rooms...")
    
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
        
       
        const createdAt = roomData.createdAt?.toDate()
        const now = new Date()
        const hourAgo = new Date(now.getTime() - (60 * 60 * 1000))
        
        if (createdAt && createdAt > hourAgo) {
          rooms.push({
            id: doc.id,
            ...roomData,
            createdAt,
          })
        }
      })

      console.log("📡 Available rooms updated:", {
        total: snapshot.size,
        filtered: rooms.length,
        rooms: rooms.map(r => ({ id: r.id, plan: r.plan, status: r.status }))
      })
      
      callback(rooms)
    }, (error) => {
      console.error("❌ Error listening to available rooms:", error)
      callback([])
    })
  }

  listenToRoom(roomId, callback) {
    console.log("👂 Setting up listener for room:", roomId)
    
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

        console.log("📡 Room data updated:", { 
          id: room.id, 
          status: room.status, 
          participantCount: room.participantCount,
          hasListener: !!room.listenerId 
        })
        
        callback(room)
      } else {
        console.log("📡 Room not found:", roomId)
        callback(null)
      }
    }, (error) => {
      console.error("❌ Error listening to room:", error)
      callback(null)
    })
  }

  getDurationInSeconds(planName) {
    const durations = {
      "10-Min Vent": 10 * 60,
      "30-Min Vent": 30 * 60,
      "20-Min Vent": 20 * 60,
    }
    
    const duration = durations[planName] || 20 * 60
    console.log("⏱ Plan duration:", { planName, seconds: duration })
    return duration
  }

  
  async getRoomInfo(roomId) {
    try {
      const roomRef = doc(firestore, "rooms", roomId)
      const roomDoc = await getDoc(roomRef)
      
      if (roomDoc.exists()) {
        const data = roomDoc.data()
        return {
          id: roomDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate(),
        }
      }
      return null
    } catch (error) {
      console.error("❌ Error getting room info:", error)
      return null
    }
  }
}

export default new RoomService()