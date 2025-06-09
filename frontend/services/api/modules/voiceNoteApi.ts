/**
 * Core Voice Note API functions
 */
import { ENDPOINTS, apiRequest } from "../config";
import { 
  VoiceNote, 
  CreateVoiceNoteData, 
  UpdateVoiceNoteData,
  FeedParams 
} from "./types/voiceNoteTypes";
import { Comment } from "../../../components/voice-note-card/VoiceNoteCardTypes";
import { FeedResponse } from "./feedApi";

/**
 * Get a voice note by ID
 */
export const getVoiceNoteById = async (voiceNoteId: string): Promise<VoiceNote> => {
   try {
    return await apiRequest<VoiceNote>(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`);
   } catch (error) {
    console.error("Error fetching voice note by ID:", error);
    throw error;
  }
};

/**
 * Create a new voice note
 */
export const createVoiceNote = (voiceNoteData: CreateVoiceNoteData): Promise<VoiceNote> => {
  return apiRequest(ENDPOINTS.VOICE_NOTES, {
    method: "POST",
    body: JSON.stringify(voiceNoteData),
  });
};

/**
 * Update a voice note
 */
export const updateVoiceNote = (
  voiceNoteId: string,
  voiceNoteData: UpdateVoiceNoteData
) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
    method: "PUT",
    body: JSON.stringify(voiceNoteData),
  });
};

/**
 * Delete a voice note
 */
export const deleteVoiceNote = (voiceNoteId: string) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
    method: "DELETE",
  });
};

/**
 * Get all voice notes (feed)
 */
export const getAllVoiceNotes = async (params?: FeedParams & {
  page?: number;
  userId?: string;
  tag?: string;
  search?: string;
}): Promise<VoiceNote[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.userId !== undefined) queryParams.append('user_id', params.userId);
    if (params?.tag !== undefined) queryParams.append('tag', params.tag);
    if (params?.search !== undefined) queryParams.append('search', params.search);
    
    const endpoint = `${ENDPOINTS.VOICE_NOTES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiRequest<VoiceNote[] | FeedResponse>(endpoint);

    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    }

    console.error("Unexpected response format for voice notes:", response);
    return [];
  } catch (error) {
    console.error("Error fetching voice notes:", error);
    return [];
  }
};

export interface LikeResponse {
  message: string;
  isLiked: boolean;
  likesCount: number;
}

export interface LikeCheckResponse {
  isLiked: boolean;
}

export interface VoiceNoteStatsResponse {
  likes: number;
  comments: number;
  plays: number;
  shares: number;
}

export interface PlayResponse {
  message: string;
  playsCount: number;
}

// Get voice note stats
export const getVoiceNoteStats = async (voiceNoteId: string): Promise<VoiceNoteStatsResponse> => {
  try {
    const data = await apiRequest<VoiceNoteStatsResponse>(
      `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/stats`
    );
    return data;
  } catch (error) {
    console.error("Error fetching voice note stats:", error);
    // Return default stats if API fails
    return {
      likes: 0,
      comments: 0,
      plays: 0,
      shares: 0
    };
  }
};

// Like a voice note
export const likeVoiceNote = async (voiceNoteId: string, userId: string): Promise<LikeResponse> => {
  try {
    const data = await apiRequest<LikeResponse>(
      ENDPOINTS.VOICE_NOTE_LIKE(voiceNoteId),
      {
        method: "POST",
        body: { user_id: userId },
      }
    );
    return data;
  } catch (error) {
    console.error("Error liking voice note:", error);
    throw error;
  }
};

// Unlike a voice note
export const unlikeVoiceNote = async (voiceNoteId: string, userId: string): Promise<LikeResponse> => {
  try {
    const data = await apiRequest<LikeResponse>(
      ENDPOINTS.VOICE_NOTE_UNLIKE(voiceNoteId),
      {
        method: "POST",
        body: { user_id: userId },
      }
    );
    return data;
  } catch (error) {
    console.error("Error unliking voice note:", error);
    throw error;
  }
};

// Check if user has liked a voice note
export const checkLikeStatus = async (voiceNoteId: string, userId: string): Promise<LikeCheckResponse> => {
  try {
    const data = await apiRequest<LikeCheckResponse>(
      `${ENDPOINTS.CHECK_LIKE_STATUS(voiceNoteId)}?userId=${userId}`
    );
    return data;
  } catch (error) {
    console.error("Error checking like status:", error);
    return { isLiked: false };
  }
};

// Get comments for a voice note
export const getComments = async (voiceNoteId: string): Promise<Comment[]> => {
  try {
    const data = await apiRequest<Comment[]>(
      ENDPOINTS.VOICE_NOTE_COMMENTS(voiceNoteId)
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

// Add a comment to a voice note
export const addComment = async (voiceNoteId: string, userId: string, content: string): Promise<Comment> => {
  try {
    const data = await apiRequest<Comment>(
      ENDPOINTS.VOICE_NOTE_COMMENTS(voiceNoteId),
      {
        method: "POST",
        body: { user_id: userId, content },
      }
    );
    return data;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Record a play for a voice note
export const recordPlay = async (voiceNoteId: string, userId: string): Promise<PlayResponse> => {
  try {
    const data = await apiRequest<PlayResponse>(
      ENDPOINTS.VOICE_NOTE_PLAY(voiceNoteId),
      {
        method: "POST",
        body: { user_id: userId },
      }
    );
    return data;
  } catch (error) {
    console.error("Error recording play:", error);
    throw error;
  }
};

// Search voice notes
export const searchVoiceNotes = async (query: string): Promise<VoiceNote[]> => {
  try {
    const data = await apiRequest<VoiceNote[]>(
      `${ENDPOINTS.SEARCH_VOICE_NOTES}?term=${encodeURIComponent(query)}`
    );
    return data || [];
  } catch (error) {
    console.error("Error searching voice notes:", error);
    return [];
  }
};

 