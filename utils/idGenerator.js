class IdGenerator {
  // Generate UUID v4 (RFC4122 compliant - basic version)
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Generate session ID
  static generateSessionId() {
    return `session_${Math.random().toString(36).substr(2, 12)}`;
  }

  // Generate room name
  static generateRoomName() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `ventbox-${timestamp}-${random}`;
  }

  // Generate user ID
  static generateUserId() {
    return `user_${Math.random().toString(36).substr(2, 16)}`;
  }

  // Generate fallback ID
  static generateFallbackId(prefix = "id") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Generate short ID (for display)
  static generateShortId(length = 8) {
    return Math.random().toString(36).substr(2, length).toUpperCase();
  }

  // Basic UUID format validator
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

export default IdGenerator;
