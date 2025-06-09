/**
 * Repost API functions
 * Handles voice note reposts following the Twitter repost model
 */
import { ENDPOINTS, apiRequest } from '../config';

export interface RepostResponse {
  isReposted: boolean;
  repostCount: number;
  voiceNoteId?: string;
  error?: string;
}

export interface ReposterInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Check if the current user has reposted a voice note
 */
export const hasUserRepostedVoiceNote = async (
  voiceNoteId: string, 
  userId: string
): Promise<boolean> => {
  if (!voiceNoteId || !userId) {
    console.log("[REPOST] Missing voiceNoteId or userId, returning false");
    return false;
  }

  try {
    console.log(
      `[REPOST] Checking if user ${userId} has reposted voice note ${voiceNoteId}`
    );
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares/check?userId=${userId}`
    );

    const isReposted = typeof response === "boolean" ? response : response?.isShared === true;
    console.log(
      `[REPOST] User ${userId} has${isReposted ? "" : " not"} reposted voice note ${voiceNoteId}`
    );
    return isReposted;
  } catch (error) {
    console.error("[REPOST] Error checking repost status:", error);
    return false;
  }
};

/**
 * Toggle repost status for a voice note (repost or unrepost)
 */
export const toggleRepost = async (
  voiceNoteId: string, 
  userId: string
): Promise<RepostResponse> => {
  if (!voiceNoteId || !userId) {
    console.error("[REPOST] Missing voiceNoteId or userId");
    return { isReposted: false, repostCount: 0 };
  }

  try {
    console.log(
      `[REPOST] Toggling repost for voice note ${voiceNoteId} by user ${userId}`
    );
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`,
      {
        method: "POST",
        body: JSON.stringify({}), // Backend uses authenticated user
      }
    );

    const isReposted = response?.isShared === true;
    const repostCount = typeof response?.shareCount === "number"
      ? response.shareCount
      : await getRepostCount(voiceNoteId);

    return {
      isReposted,
      repostCount,
      voiceNoteId,
    };
  } catch (error) {
    console.error("[REPOST] Error toggling repost:", error);
    return {
      isReposted: false,
      repostCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get the number of reposts for a voice note
 */
export const getRepostCount = async (voiceNoteId: string): Promise<number> => {
  if (!voiceNoteId) {
    console.error("[REPOST] Missing voiceNoteId");
    return 0;
  }

  try {
    console.log(`[REPOST] Getting repost count for voice note ${voiceNoteId}`);
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`
    );

    // Extract count from different possible response formats
    let count = 0;

    if (typeof response?.shareCount === "number") {
      count = response.shareCount;
    } else if (typeof response?.data?.shareCount === "number") {
      count = response.data.shareCount;
    } else if (Array.isArray(response?.data)) {
      count = response.data.length;
    } else if (typeof response === "number") {
      count = response;
    }

    console.log(`[REPOST] Voice note ${voiceNoteId} has ${count} reposts`);
    return count;
  } catch (error) {
    console.error("[REPOST] Error getting repost count:", error);
    return 0;
  }
};

/**
 * Get users who have reposted a voice note
 */
export const getReposters = async (voiceNoteId: string): Promise<any[]> => {
  if (!voiceNoteId) {
    console.error("[REPOST] Missing voiceNoteId");
    return [];
  }

  try {
    console.log(`[REPOST] Getting reposters for voice note ${voiceNoteId}`);
    const response = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`
    );

    let reposters = [];

    if (Array.isArray(response)) {
      reposters = response;
    } else if (Array.isArray(response?.data)) {
      reposters = response.data;
    }

    console.log(
      `[REPOST] Found ${reposters.length} reposters for voice note ${voiceNoteId}`
    );
    return reposters;
  } catch (error) {
    console.error("[REPOST] Error getting reposters:", error);
    return [];
  }
};

/**
 * Get the reposter information for a voice note if it's a repost
 */
export const getReposterInfo = (voiceNote: any): ReposterInfo | null => {
  // Not a repost
  if (!voiceNote?.is_shared) return null;

  // Extract reposter info from the voice note
  if (voiceNote.shared_by) {
    return {
      id: voiceNote.shared_by.id,
      username: voiceNote.shared_by.username,
      displayName: voiceNote.shared_by.display_name,
      avatarUrl: voiceNote.shared_by.avatar_url,
    };
  }

  // Alternative fields for reposter info
  if (voiceNote.sharer_id) {
    return {
      id: voiceNote.sharer_id,
      username: voiceNote.sharer_username || "user",
      displayName: voiceNote.sharer_display_name || voiceNote.sharer_username || "User",
      avatarUrl: voiceNote.sharer_avatar_url || null,
    };
  }

  return null;
}; 