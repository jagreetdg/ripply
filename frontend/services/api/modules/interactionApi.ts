/**
 * Voice Note Interaction API functions
 */
import { ENDPOINTS, apiRequest } from "../config";

/**
 * Like a voice note
 */
export const likeVoiceNote = (voiceNoteId: string, userId: string) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/like`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

/**
 * Unlike a voice note
 */
export const unlikeVoiceNote = (voiceNoteId: string, userId: string) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/unlike`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

/**
 * Check if a user has liked a voice note
 */
export const checkLikeStatus = async (voiceNoteId: string, userId: string) => {
  try {
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/like-status/${userId}`
    );
    
    // Normalize response format
    if (response && typeof response.liked === "boolean") {
      return response.liked;
    } else if (response && response.data && typeof response.data.liked === "boolean") {
      return response.data.liked;
    }
    
    // Default to false if response format is unexpected
    return false;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
};

/**
 * Add a comment to a voice note
 */
export const addComment = (voiceNoteId: string, commentData: any) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/comment`, {
    method: "POST",
    body: JSON.stringify(commentData),
  });
};

/**
 * Get comments for a voice note
 */
export const getComments = (voiceNoteId: string) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/comments`);
};

/**
 * Record a play for a voice note
 */
export const recordPlay = (voiceNoteId: string, userId: string) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/play`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

/**
 * Share a voice note
 */
export const recordShare = async (voiceNoteId: string, userId: string) => {
  try {
    const response = await apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`, {
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
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share-status/${userId}`
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
 * Get share count for a voice note
 */
export const getShareCount = async (voiceNoteId: string) => {
  try {
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share-count`
    );
    
    // Normalize response format
    if (response && typeof response.count === "number") {
      return response.count;
    } else if (response && response.data && typeof response.data.count === "number") {
      return response.data.count;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error getting share count for ${voiceNoteId}:`, error);
    return 0;
  }
};

/**
 * Get voice note stats (likes, comments, plays, shares)
 */
export const getVoiceNoteStats = async (voiceNoteId: string) => {
  try {
    const response = await apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/stats`);
    
    // Normalize stats to numbers
    const normalizeCount = (value: any): number => {
      if (typeof value === "number") return value;
      if (Array.isArray(value) && value.length > 0 && value[0]?.count) {
        return value[0].count;
      }
      return 0;
    };
    
    if (response) {
      return {
        likes: normalizeCount(response.likes),
        comments: normalizeCount(response.comments),
        plays: normalizeCount(response.plays),
        shares: normalizeCount(response.shares),
      };
    }
    
    return { likes: 0, comments: 0, plays: 0, shares: 0 };
  } catch (error) {
    console.error(`Error getting stats for voice note ${voiceNoteId}:`, error);
    return { likes: 0, comments: 0, plays: 0, shares: 0 };
  }
}; 