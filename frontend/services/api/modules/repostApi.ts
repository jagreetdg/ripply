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
    console.error("[SHARE DEBUG] hasUserRepostedVoiceNote - Missing parameters:", { voiceNoteId, userId });
    return false;
  }

  try {
    console.log("[SHARE DEBUG] hasUserRepostedVoiceNote - Starting check:", { voiceNoteId, userId });
    const endpoint = `${ENDPOINTS.CHECK_SHARE_STATUS(voiceNoteId)}?userId=${encodeURIComponent(userId)}`;
    console.log("[SHARE DEBUG] hasUserRepostedVoiceNote - API endpoint:", endpoint);
    
    const response = await apiRequest(
      endpoint,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[SHARE DEBUG] hasUserRepostedVoiceNote - Raw API response:", JSON.stringify(response, null, 2));
    
    // Handle the new backend response format
    const hasReposted = Boolean(response?.isShared);
    console.log("[SHARE DEBUG] hasUserRepostedVoiceNote - Processed result:", { 
      voiceNoteId, 
      userId, 
      hasReposted,
      responseIsShared: response?.isShared
    });
    
    return hasReposted;
  } catch (error) {
    console.error("[SHARE DEBUG] hasUserRepostedVoiceNote - API Error:", {
      voiceNoteId,
      userId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
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
    console.error("[SHARE DEBUG] toggleRepost - Missing parameters:", { voiceNoteId, userId });
    return { isReposted: false, repostCount: 0 };
  }

  try {
    console.log("[SHARE DEBUG] toggleRepost - Starting toggle:", { voiceNoteId, userId });
    console.log("[SHARE DEBUG] toggleRepost - API endpoint:", ENDPOINTS.VOICE_NOTE_REPOST(voiceNoteId));
    console.log("[SHARE DEBUG] toggleRepost - Request body:", { user_id: userId });
    
    const response = await apiRequest(
      ENDPOINTS.VOICE_NOTE_REPOST(voiceNoteId),
      {
        method: "POST",
        body: { user_id: userId },
      }
    );

    console.log("[SHARE DEBUG] toggleRepost - Raw API response:", JSON.stringify(response, null, 2));

    // Handle the new backend response format
    const isReposted = response?.isShared === true;
    const repostCount = typeof response?.shareCount === "number" ? response.shareCount : 0;

    const result = {
      isReposted,
      repostCount,
      voiceNoteId,
    };
    
    console.log("[SHARE DEBUG] toggleRepost - Final result:", result);
    return result;
  } catch (error) {
    console.error("[SHARE DEBUG] toggleRepost - API Error:", {
      voiceNoteId,
      userId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Get the number of reposts for a voice note
 */
export const getRepostCount = async (voiceNoteId: string): Promise<number> => {
  if (!voiceNoteId) {
    console.error("[SHARE DEBUG] getRepostCount - Missing voiceNoteId");
    return 0;
  }

  try {
    const endpoint = ENDPOINTS.VOICE_NOTE_SHARES(voiceNoteId);
    console.log("[SHARE DEBUG] getRepostCount - Starting request:", { voiceNoteId, endpoint });
    
    const response = await apiRequest(endpoint);

    console.log("[SHARE DEBUG] getRepostCount - Raw API response:", JSON.stringify(response, null, 2));

    // Backend returns { shareCount: number }
    const count = response?.shareCount || 0;
    console.log("[SHARE DEBUG] getRepostCount - Final count:", { voiceNoteId, count });
    return count;
  } catch (error: any) {
    console.error("[SHARE DEBUG] getRepostCount - API Error:", {
      voiceNoteId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle specific backend errors gracefully
    if (error?.message?.includes('Shares table not found') || 
        error?.message?.includes('Error fetching share count')) {
      console.log("[SHARE DEBUG] getRepostCount - Known error, returning 0:", { voiceNoteId });
      return 0;
    }
    
    // For any other error, return 0 instead of throwing
    console.log("[SHARE DEBUG] getRepostCount - Unknown error, returning 0:", { voiceNoteId });
    return 0;
  }
};

/**
 * Get users who have reposted a voice note
 */
export const getReposters = async (voiceNoteId: string): Promise<any[]> => {
  if (!voiceNoteId) {
    console.error("[SHARE DEBUG] getReposters - Missing voiceNoteId");
    return [];
  }

  try {
    const endpoint = ENDPOINTS.VOICE_NOTE_SHARES(voiceNoteId);
    console.log("[SHARE DEBUG] getReposters - Starting request:", { voiceNoteId, endpoint });
    
    const response = await apiRequest(endpoint);

    console.log("[SHARE DEBUG] getReposters - Raw API response:", JSON.stringify(response, null, 2));

    let reposters = [];

    if (Array.isArray(response)) {
      reposters = response;
    } else if (Array.isArray(response?.data)) {
      reposters = response.data;
    }

    console.log("[SHARE DEBUG] getReposters - Final result:", { 
      voiceNoteId, 
      repostersCount: reposters.length,
      reposters: reposters.map((r: any) => ({ id: r.id, username: r.username }))
    });
    return reposters;
  } catch (error) {
    console.error("[SHARE DEBUG] getReposters - API Error:", {
      voiceNoteId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
};

/**
 * Get the reposter information for a voice note if it's a repost
 */
export const getReposterInfo = (voiceNote: any): ReposterInfo | null => {
  console.log("[SHARE DEBUG] getReposterInfo - Input voice note:", {
    id: voiceNote?.id,
    isShared: voiceNote?.is_shared,
    hasSharedBy: !!voiceNote?.shared_by,
    hasSharerData: !!voiceNote?.sharer_id
  });

  // Not a repost
  if (!voiceNote?.is_shared) {
    console.log("[SHARE DEBUG] getReposterInfo - Not a shared voice note, returning null");
    return null;
  }

  // Extract reposter info from the voice note
  if (voiceNote.shared_by) {
    const reposterInfo = {
      id: voiceNote.shared_by.id,
      username: voiceNote.shared_by.username,
      displayName: voiceNote.shared_by.display_name,
      avatarUrl: voiceNote.shared_by.avatar_url,
    };
    console.log("[SHARE DEBUG] getReposterInfo - Found reposter info from shared_by:", reposterInfo);
    return reposterInfo;
  }

  // Alternative fields for reposter info
  if (voiceNote.sharer_id) {
    const reposterInfo = {
      id: voiceNote.sharer_id,
      username: voiceNote.sharer_username || "user",
      displayName: voiceNote.sharer_display_name || voiceNote.sharer_username || "User",
      avatarUrl: voiceNote.sharer_avatar_url || null,
    };
    console.log("[SHARE DEBUG] getReposterInfo - Found reposter info from sharer fields:", reposterInfo);
    return reposterInfo;
  }

  console.log("[SHARE DEBUG] getReposterInfo - No reposter info found despite is_shared=true");
  return null;
}; 