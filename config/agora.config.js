// Replace with your actual Agora App ID from console
export const AGORA_APP_ID = "f16b94ea49fd47b5b65e86d20ef1badd" // Get this from Agora Console

// For development - you can use null token (less secure but easier to start)
export const AGORA_TOKEN = '007eJxTYJB0b/ly/roVwyqRatmUr8fKk6d7LrEvyVxelydeephld74CQ5qhWZKlSWqiiWVaiol5kmmSmWmqhVmKkUFqmmFSYkoKz/LOjIZARgaHJdEsjAwQCOKzM5Sl5pU4FhQwMAAAdncf9A=='

// For production - you'll need a token server
export const AGORA_TOKEN_SERVER = "https://your-token-server.com"

// Channel name prefix for your app
export const AGORA_CHANNEL_PREFIX = "ventApp"

// Channel configuration
export const AGORA_CONFIG = {
  // Audio profile: Speech Standard for voice calls
  audioProfile: 1,

  // Audio scenario: Meeting for 1:1 calls
  audioScenario: 7,

  // Channel profile: Communication for 1:1 calls
  channelProfile: 0,
}

// Generate unique channel name
export const generateChannelName = () => {
  return `${AGORA_CHANNEL_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Validate Agora configuration
export const validateAgoraConfig = () => {
  if (!AGORA_APP_ID || AGORA_APP_ID === "f16b94ea49fd47b5b65e86d20ef1badd") {
    throw new Error("Please set your Agora App ID in config/agora.js")
  }
  return true
}