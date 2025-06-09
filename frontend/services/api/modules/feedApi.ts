/**
 * Feed API functions
 */
import { ENDPOINTS, apiRequest } from "../config";
import { VoiceNote } from './types/voiceNoteTypes';

export interface FeedResponse {
  data: VoiceNote[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

/**
 * Get personalized feed (voice notes from users the current user follows)
 */
export const getPersonalizedFeed = async (userId: string): Promise<VoiceNote[]> => {
  try {
    const endpoint = ENDPOINTS.PERSONALIZED_FEED(userId);
    
    const response = await apiRequest<FeedResponse>(endpoint);

    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    // Log unexpected formats for debugging
    console.error("[FEED ERROR] Unexpected response format:", response);
    return [];
  } catch (error) {
    console.error("[FEED ERROR] Error fetching personalized feed:", error);
    return [];
  }
};

/**
 * Get diagnostic information about a user's feed
 */
export const runFeedDiagnostics = async (userId?: string): Promise<FeedDiagnosticData | null> => {
  if (!userId) {
    return null;
  }

  try {
    const startTime = Date.now();
    const feed = await getPersonalizedFeed(userId);
    const endTime = Date.now();

    const diagnosticData: FeedDiagnosticData = {
      requestTime: `${endTime - startTime}ms`,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'React Native',
      userId,
      isPersonalized: true,
      feedLength: feed.length,
      hasRecommendations: feed.length > 0,
      cacheStatus: 'no-cache'
    };

    return diagnosticData;
  } catch (error) {
    console.error("Error running feed diagnostics:", error);
    return null;
  }
};

// Diagnostic function for feed issues - can be called manually when needed
export const diagnoseFeedIssues = async (userId?: string) => {
  if (!userId) {
    console.error("[DIAGNOSTIC] Cannot run diagnostics, no user logged in");
    return;
  }

  try {
    const feed = await getPersonalizedFeed(userId);
    
    // Extract unique user IDs from feed
    const userIds = [...new Set(feed.map(note => note.user_id))];
    
    console.log("[DIAGNOSTIC] Feed diagnostic results:", {
      feedLength: feed.length,
      uniqueUsers: userIds.length,
      userIds: userIds,
    });
    
  } catch (error) {
    console.error("[DIAGNOSTIC] Error during feed diagnosis:", error);
  }
};

export const getAllVoiceNotes = async (params?: {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}): Promise<VoiceNote[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `${ENDPOINTS.VOICE_NOTES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiRequest<FeedResponse>(endpoint);

    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    console.error("[FEED ERROR] Unexpected response format for voice notes:", response);
    return [];
  } catch (error) {
    console.error("[FEED ERROR] Error fetching all voice notes:", error);
    return [];
  }
};

// Feed diagnostic data structure
interface FeedDiagnosticData {
  requestTime: string;
  userAgent: string;
  userId?: string;
  isPersonalized: boolean;
  feedLength: number;
  hasRecommendations: boolean;
  cacheStatus?: string;
}

// Fetch feed data with optional user ID for personalized feeds
export const fetchFeed = async (
  userId?: string,
  page: number = 1,
  limit: number = 10,
  diagnosticData?: FeedDiagnosticData
): Promise<VoiceNote[]> => {
  try {
    let endpoint: string;
    let requiresAuth = false;

    if (userId) {
      // Personalized feed requires authentication
      endpoint = `${ENDPOINTS.PERSONALIZED_FEED(userId)}?page=${page}&limit=${limit}`;
      requiresAuth = true;
    } else {
      // Public feed doesn't require authentication
      endpoint = `${ENDPOINTS.FEED}?page=${page}&limit=${limit}`;
      requiresAuth = false;
    }

    // Use diagnostic data if available for logging
    if (diagnosticData) {
      // Only log if truly needed for critical debugging
    }

    const data = await apiRequest<VoiceNote[]>(endpoint, {
      method: "GET",
      requiresAuth,
    });

    // Validate response format
    if (Array.isArray(data)) {
      return data;
    } else {
      console.error("Unexpected data format from API:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching feed:", error);
    throw error;
  }
};

// Fetch recommended voice notes for a user
export const fetchRecommendedVoiceNotes = async (
  userId: string,
  limit: number = 5
): Promise<VoiceNote[]> => {
  try {
    const endpoint = `${ENDPOINTS.VOICE_NOTES}/recommended?userId=${userId}&limit=${limit}`;
    
    const data = await apiRequest<VoiceNote[]>(endpoint, {
      method: "GET",
      requiresAuth: true,
    });

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching recommended voice notes:", error);
    return [];
  }
}; 