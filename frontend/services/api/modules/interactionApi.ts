/**
 * Voice Note Interaction API functions
 */
import { ENDPOINTS, apiRequest } from "../config";



/**
 * Share a voice note
 */
export const recordShare = async (voiceNoteId: string, userId: string) => {
  try {
    const response = await apiRequest(ENDPOINTS.VOICE_NOTE_SHARE(voiceNoteId), {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
    
    return response;
  } catch (error) {
    console.error(`Error sharing voice note ${voiceNoteId}:`, error);
    throw error;
  }
};

/**
 * Check if a user has shared a voice note
 */
export const checkShareStatus = async (voiceNoteId: string, userId: string) => {
  try {
    const response = await apiRequest(
      `${ENDPOINTS.CHECK_SHARE_STATUS(voiceNoteId)}?userId=${userId}`
    );
    
    // Normalize response format
    if (response && typeof response.shared === "boolean") {
      return response.shared;
    } else if (response && response.data && typeof response.data.shared === "boolean") {
      return response.data.shared;
    }
    
    // Default to false if response format is unexpected
    return false;
  } catch (error) {
    console.error("Error checking share status:", error);
    return false;
  }
};

/**
 * Get share count for a voice note (using the shares endpoint)
 */
export const getShareCount = async (voiceNoteId: string) => {
  try {
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`
    );
    
    // Backend returns { shareCount: number }
    if (response && typeof response.shareCount === "number") {
      return response.shareCount;
    } else if (response && response.data && typeof response.data.shareCount === "number") {
      return response.data.shareCount;
    } else if (typeof response === "number") {
      return response;
    }
    
    console.warn(`[SHARE] Unexpected response format for ${voiceNoteId}:`, response);
    return 0;
  } catch (error) {
    console.error(`Error getting share count for ${voiceNoteId}:`, error);
    return 0;
  }
};

 