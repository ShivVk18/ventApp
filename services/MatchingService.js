import firestoreService from "./firestoreService"

class MatchingService {
  constructor() {
    this.queueListeners = new Map()
  }

  // Start looking for a match
  async findMatch(userId, ventText) {
    try {
      // First, check if there's an available listener
      const availableListener = await firestoreService.findAvailableListener()

      if (availableListener) {
        // Create session immediately
        const session = await firestoreService.createSession(
          userId,
          availableListener.userId,
          null, // venter queue ID (we'll add to queue first)
          availableListener.id,
          ventText,
        )
        return session
      } else {
        // Add to queue and wait for listener
        const queueId = await firestoreService.addToQueue(userId, "venter", ventText)
        return this.waitForListener(userId, queueId, ventText)
      }
    } catch (error) {
      console.error("Error finding match:", error)
      throw error
    }
  }

  // Wait for a listener to join
  waitForListener(userId, queueId, ventText) {
    return new Promise((resolve, reject) => {
      // Listen for available listeners
      const unsubscribe = firestoreService.listenToQueue("listener", async (snapshot) => {
        if (!snapshot.empty) {
          const listener = snapshot.docs[0]
          const listenerData = listener.data()

          try {
            // Create session with the first available listener
            const session = await firestoreService.createSession(
              userId,
              listenerData.userId,
              queueId,
              listener.id,
              ventText,
            )

            unsubscribe()
            resolve(session)
          } catch (error) {
            unsubscribe()
            reject(error)
          }
        }
      })

      // Store unsubscribe function for cleanup
      this.queueListeners.set(userId, unsubscribe)

      // Timeout after 5 minutes
      setTimeout(() => {
        unsubscribe()
        firestoreService.removeFromQueue(queueId)
        reject(new Error("No listeners available. Please try again later."))
      }, 300000) // 5 minutes
    })
  }

  // Join as listener
  async joinAsListener(userId) {
    try {
      // Check if there are venters waiting
      const queueId = await firestoreService.addToQueue(userId, "listener")
      return queueId
    } catch (error) {
      console.error("Error joining as listener:", error)
      throw error
    }
  }

  // Cancel matching
  async cancelMatching(userId, queueId) {
    try {
      if (queueId) {
        await firestoreService.removeFromQueue(queueId)
      }

      // Clean up listeners
      const unsubscribe = this.queueListeners.get(userId)
      if (unsubscribe) {
        unsubscribe()
        this.queueListeners.delete(userId)
      }
    } catch (error) {
      console.error("Error canceling matching:", error)
      throw error
    }
  }
}

export default new MatchingService();