import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
} from "firebase/firestore"
import { firestore } from "../config/firebase.config"
import IdGenerator from "../utils/idGenerator"

class FirestoreService {
  
  USERS_COLLECTION = "users"
  SESSIONS_COLLECTION = "sessions"
  QUEUE_COLLECTION = "queue"
  ANALYTICS_COLLECTION = "analytics"

  // Add user to queue (venter or listener)
  async addToQueue(userId, userType = "venter", ventText = "") {
    try {
      const queueId = await IdGenerator.generateShortId(12)

      const queueData = {
        queueId,
        userId,
        userType,
        ventText,
        status: "waiting",
        createdAt: serverTimestamp(),
        preferences: {
          maxWaitTime: 300, // 5 minutes
          allowRecording: false,
        },
        metadata: {
          platform: "expo-go",
          version: "1.0.0",
        },
      }

      const docRef = await addDoc(collection(firestore, this.QUEUE_COLLECTION), queueData)

      console.log(`📋 Added ${userType} to queue:`, {
        queueId,
        docId: docRef.id,
        userId,
      })

      return {
        queueDocId: docRef.id,
        queueId,
        ...queueData,
      }
    } catch (error) {
      console.error("❌ Error in addToQueue:", error)
      throw error
    }
  }

  // Listen to queue changes
  listenToQueue(userType, callback) {
    try {
      const q = query(
        collection(firestore, this.QUEUE_COLLECTION),
        where("userType", "==", userType),
        where("status", "==", "waiting"),
        orderBy("createdAt", "asc"),
        limit(10),
      )

      console.log(`👂 Listening to ${userType} queue...`)

      return onSnapshot(q, (snapshot) => {
        const queueItems = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }))

        console.log(`📋 Queue update for ${userType}:`, queueItems.length, "items")
        callback(queueItems)
      })
    } catch (error) {
      console.error("Error in listenToQueue:", error)
      throw error
    }
  }

  // Create a new session between venter and listener
  async createSession(venterId, listenerId, venterQueueId, listenerQueueId, ventText) {
    try {
      // Generate secure IDs using Expo Crypto
      const sessionId = await IdGenerator.generateSessionId()
      const channelName = await IdGenerator.generateRoomName()
      const sessionToken = await IdGenerator.generateToken(16)

      const sessionData = {
        sessionId,
        channelName,
        sessionToken,
        venterId,
        listenerId,
        ventText,
        status: "active",
        startTime: serverTimestamp(),
        endTime: null,
        duration: 0,
        maxDuration: 1200, // 20 minutes
        createdAt: serverTimestamp(),
        participants: {
          [venterId]: {
            role: "venter",
            connected: false,
            joinedAt: null,
            userId: venterId,
          },
          [listenerId]: {
            role: "listener",
            connected: false,
            joinedAt: null,
            userId: listenerId,
          },
        },
        metadata: {
          platform: "expo-go",
          dailyRoom: channelName,
          cryptoSecured: true,
        },
      }

      // Add session to Firestore
      const sessionRef = await addDoc(collection(firestore, this.SESSIONS_COLLECTION), sessionData)

      // Remove both users from queue
      await Promise.all([this.removeFromQueue(venterQueueId), this.removeFromQueue(listenerQueueId)])

      // Update user statuses
      await Promise.all([
        this.updateUserStatus(venterId, "in_session", "venter"),
        this.updateUserStatus(listenerId, "in_session", "listener"),
      ])

      console.log("Session created:", {
        sessionId,
        firestoreDocId: sessionRef.id,
        channelName,
        participants: [venterId, listenerId],
      })

      return {
        firestoreDocId: sessionRef.id,
        sessionId,
        channelName,
        sessionToken,
        ...sessionData,
      }
    } catch (error) {
      console.error("Error in createSession:", error)
      throw error
    }
  }

  // Update user connection status in session
  async updateUserConnection(sessionId, userId, connected, joinedAt = null) {
    try {
      // Find session by sessionId (not Firestore doc ID)
      const q = query(collection(firestore, this.SESSIONS_COLLECTION), where("sessionId", "==", sessionId), limit(1))

      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      const sessionDoc = snapshot.docs[0]
      const updateData = {
        [`participants.${userId}.connected`]: connected,
        [`participants.${userId}.lastUpdate`]: serverTimestamp(),
      }

      if (joinedAt) {
        updateData[`participants.${userId}.joinedAt`] = joinedAt
      }

      await updateDoc(sessionDoc.ref, updateData)

      console.log(`🔄 Updated connection for user ${userId}:`, {
        sessionId,
        connected,
        joinedAt,
      })
    } catch (error) {
      console.error("Error in updateUserConnection:", error)
      throw error
    }
  }

  // Listen to session changes
  listenToSession(sessionId, callback) {
    try {
      // Find session by sessionId
      const q = query(collection(firestore, this.SESSIONS_COLLECTION), where("sessionId", "==", sessionId), limit(1))

      console.log("👂 Listening to session:", sessionId)

      return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          console.warn("⚠️ Session not found:", sessionId)
          callback(null)
          return
        }

        const sessionDoc = snapshot.docs[0]
        const sessionData = {
          firestoreDocId: sessionDoc.id,
          ...sessionDoc.data(),
        }

        console.log("📱 Session update:", {
          sessionId: sessionData.sessionId,
          status: sessionData.status,
          participants: Object.keys(sessionData.participants || {}),
        })

        callback(sessionData)
      })
    } catch (error) {
      console.error("Error in listenToSession:", error)
      throw error
    }
  }

  // End a session
  async endSession(sessionId, duration, endedBy = "user") {
    try {
      // Generate end session analytics ID
      const endSessionId = await IdGenerator.generateShortId(8)

      // Find session by sessionId
      const q = query(collection(firestore, this.SESSIONS_COLLECTION), where("sessionId", "==", sessionId), limit(1))

      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      const sessionDoc = snapshot.docs[0]
      const sessionData = sessionDoc.data()

      // Update session
      await updateDoc(sessionDoc.ref, {
        status: "ended",
        endTime: serverTimestamp(),
        duration,
        endedBy,
        endSessionId,
        analytics: {
          totalDuration: duration,
          endReason: endedBy,
          participantCount: Object.keys(sessionData.participants || {}).length,
        },
      })

      // Update user statuses back to available
      const participants = Object.keys(sessionData.participants || {})
      await Promise.all(
        participants.map((userId) => this.updateUserStatus(userId, "available", sessionData.participants[userId].role)),
      )

      // Log analytics
      await this.logSessionAnalytics(sessionId, {
        endSessionId,
        duration,
        endedBy,
        participantCount: participants.length,
      })

      console.log("🏁 Session ended:", {
        sessionId,
        endSessionId,
        duration,
        endedBy,
      })

      return { endSessionId, sessionId, duration }
    } catch (error) {
      console.error("Error in endSession:", error)
      throw error
    }
  }

  // Remove user from queue
  async removeFromQueue(queueDocId) {
    try {
      await deleteDoc(doc(firestore, this.QUEUE_COLLECTION, queueDocId))
      console.log("🗑️ Removed from queue:", queueDocId)
    } catch (error) {
      console.error("Error in removeFromQueue:", error)
      throw error
    }
  }

  // Find available listener
  async findAvailableListener() {
    try {
      const q = query(
        collection(firestore, this.QUEUE_COLLECTION),
        where("userType", "==", "listener"),
        where("status", "==", "waiting"),
        orderBy("createdAt", "asc"),
        limit(1),
      )

      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        console.log("👂 No listeners available")
        return null
      }

      const listenerDoc = snapshot.docs[0]
      const listenerData = {
        docId: listenerDoc.id,
        ...listenerDoc.data(),
      }

      console.log("👂 Found available listener:", {
        docId: listenerData.docId,
        userId: listenerData.userId,
        queueId: listenerData.queueId,
      })

      return listenerData
    } catch (error) {
      console.error("❌ Error in findAvailableListener:", error)
      return null
    }
  }

  // Update user status
  async updateUserStatus(userId, status, role = "venter") {
    try {
      // Try to find existing user document
      const q = query(collection(firestore, this.USERS_COLLECTION), where("userId", "==", userId), limit(1))

      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        // Update existing user
        const userDoc = snapshot.docs[0]
        await updateDoc(userDoc.ref, {
          status,
          role,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        console.log("👤 Updated user status:", { userId, status, role })
      } else {
        // Create new user document
        const userDocId = await IdGenerator.generateUserId()

        await addDoc(collection(firestore, this.USERS_COLLECTION), {
          userDocId,
          userId,
          status,
          role,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          metadata: {
            platform: "expo-go",
            cryptoSecured: true,
          },
        })

        console.log("👤 Created new user:", { userDocId, userId, status, role })
      }
    } catch (error) {
      console.error("❌ Error in updateUserStatus:", error)
      throw error
    }
  }

  // Log session analytics
  async logSessionAnalytics(sessionId, analyticsData) {
    try {
      const analyticsId = await IdGenerator.generateToken(12)

      const analytics = {
        analyticsId,
        sessionId,
        timestamp: serverTimestamp(),
        ...analyticsData,
        metadata: {
          platform: "expo-go",
          cryptoSecured: true,
        },
      }

      await addDoc(collection(firestore, this.ANALYTICS_COLLECTION), analytics)

      console.log("📊 Analytics logged:", { analyticsId, sessionId })
    } catch (error) {
      console.error("❌ Error logging analytics:", error)
     
    }
  }

  
  async getUserSessions(userId, limit = 10) {
    try {
      const q = query(
        collection(firestore, this.SESSIONS_COLLECTION),
        where("participants." + userId, "!=", null),
        orderBy("createdAt", "desc"),
        limit(limit),
      )

      const snapshot = await getDocs(q)
      const sessions = snapshot.docs.map((doc) => ({
        firestoreDocId: doc.id,
        ...doc.data(),
      }))

      console.log(`📚 Found ${sessions.length} sessions for user:`, userId)
      return sessions
    } catch (error) {
      console.error("❌ Error getting user sessions:", error)
      return []
    }
  }

  
  async cleanupExpiredQueue() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      const q = query(collection(firestore, this.QUEUE_COLLECTION), where("createdAt", "<", fiveMinutesAgo))

      const snapshot = await getDocs(q)
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))

      await Promise.all(deletePromises)

      console.log(`🧹 Cleaned up ${snapshot.docs.length} expired queue items`)
    } catch (error) {
      console.error("❌ Error cleaning up queue:", error)
    }
  }

 
  async getQueueStats() {
    try {
      const [ventersSnapshot, listenersSnapshot] = await Promise.all([
        getDocs(
          query(
            collection(firestore, this.QUEUE_COLLECTION),
            where("userType", "==", "venter"),
            where("status", "==", "waiting"),
          ),
        ),
        getDocs(
          query(
            collection(firestore, this.QUEUE_COLLECTION),
            where("userType", "==", "listener"),
            where("status", "==", "waiting"),
          ),
        ),
      ])

      const stats = {
        ventersWaiting: ventersSnapshot.size,
        listenersWaiting: listenersSnapshot.size,
        totalWaiting: ventersSnapshot.size + listenersSnapshot.size,
        timestamp: new Date().toISOString(),
      }

      console.log("📊 Queue stats:", stats)
      return stats
    } catch (error) {
      console.error("❌ Error getting queue stats:", error)
      return {
        ventersWaiting: 0,
        listenersWaiting: 0,
        totalWaiting: 0,
        error: error.message,
      }
    }
  }
}

export default new FirestoreService()