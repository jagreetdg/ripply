/**
 * Voice Note Interaction API functions
 */
import { ENDPOINTS, apiRequest } from "../config";
import { InteractionStatus } from './types/interactionTypes';



/**
 * Share a voice note
 */
export const recordShare = async (voiceNoteId: string, userId: string) => {
  try {
    const response = await apiRequest(ENDPOINTS.VOICE_NOTE_SHARE(voiceNoteId), {
      method: "POST",
      body: { user_id: userId },
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
    
    // Normalize response format - backend returns { isShared: boolean }
    if (response && typeof response.isShared === "boolean") {
      return response.isShared;
    } else if (response && response.data && typeof response.data.isShared === "boolean") {
      return response.data.isShared;
    } else if (response && typeof response.shared === "boolean") {
      // Fallback for legacy format
      return response.shared;
    } else if (response && response.data && typeof response.data.shared === "boolean") {
      // Fallback for legacy format with data wrapper
      return response.data.shared;
    }
    
    // Default to false if response format is unexpected
    console.warn(`[SHARE] Unexpected checkShareStatus response format for ${voiceNoteId}:`, response);
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

// ===== NEW CLEAN INTERACTION API =====

export interface ToggleLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export interface ToggleShareResponse {
  isShared: boolean;
  sharesCount: number;
}

export interface InteractionStatusResponse {
  isLiked: boolean;
  likesCount: number;
  isShared: boolean;
  sharesCount: number;
}

/**
 * Toggle like status for a voice note (NEW SYSTEM)
 */
export const toggleLike = async (voiceNoteId: string): Promise<ToggleLikeResponse> => {
  console.log(`[NEW API] Toggle like: ${voiceNoteId}`);
  
  const response = await apiRequest(`/api/voice-notes/${voiceNoteId}/like-new`, {
    method: 'POST',
    requiresAuth: true
  });
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to toggle like');
  }
  
  console.log(`[NEW API] Like response:`, response.data);
  return response.data;
};

/**
 * Toggle share status for a voice note (NEW SYSTEM)
 */
export const toggleShare = async (voiceNoteId: string): Promise<ToggleShareResponse> => {
  console.log(`[NEW API] Toggle share: ${voiceNoteId}`);
  
  const response = await apiRequest(`/api/voice-notes/${voiceNoteId}/share-new`, {
    method: 'POST',
    requiresAuth: true
  });
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to toggle share');
  }
  
  console.log(`[NEW API] Share response:`, response.data);
  return response.data;
};

/**
 * Get interaction status for a voice note (NEW SYSTEM)
 */
export const getInteractionStatus = async (voiceNoteId: string): Promise<InteractionStatusResponse> => {
  console.log(`[NEW API] Get interaction status: ${voiceNoteId}`);
  
  const response = await apiRequest(`/api/voice-notes/${voiceNoteId}/interaction-status`, {
    method: 'GET',
    requiresAuth: true
  });
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to get interaction status');
  }
  
  console.log(`[NEW API] Status response:`, response.data);
  return response.data;
};

// Export the new clean API
export const newInteractionApi = {
  toggleLike,
  toggleShare,
  getInteractionStatus,
};

 