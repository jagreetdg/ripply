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
    console.log(`🚨 FEED API - getPersonalizedFeed called: userId=${userId}, endpoint=${endpoint}`);
    
    const response = await apiRequest<FeedResponse | VoiceNote[]>(endpoint);

    console.log(`🚨 FEED API - Raw response received:`);
    console.log(`  Type: ${typeof response}`);
    console.log(`  Is Array: ${Array.isArray(response)}`);
    console.log(`  Length: ${Array.isArray(response) ? response.length : 'N/A'}`);
    console.log(`  Full response:`, JSON.stringify(response, null, 2));

    // Handle different response formats
    if (Array.isArray(response)) {
      console.log(`🚨 FEED API - Returning array response with ${response.length} items`);
      
      // CRITICAL: Log each item's is_shared value before returning
      response.forEach((item, idx) => {
        console.log(`  Item ${idx}: id=${item.id}, is_shared=${item.is_shared}, title="${item.title}"`);
      });
      
      return response;
    }

    if (response?.data && Array.isArray(response.data)) {
      console.log(`🚨 FEED API - Returning nested data array with ${response.data.length} items`);
      return response.data;
    }

    // Log unexpected formats for debugging
    console.error("🚨 FEED API ERROR - Unexpected response format:", response);
    return [];
  } catch (error) {
    console.error("🚨 FEED API ERROR - Error fetching personalized feed:", error);
    console.error("🚨 FEED API ERROR - Error details:", error);
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
    const userIds = Array.from(new Set(feed.map(note => note.user_id)));
    
    console.log("[DIAGNOSTIC] Feed diagnostic results:", {
      feedLength: feed.length,
      uniqueUsers: userIds.length,
      userIds: userIds,
    });
    
  } catch (error) {
    console.error("[DIAGNOSTIC] Error during feed diagnosis:", error);
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

// Fetch feed data with optional user ID for personalized feeds (infinite scroll version)
export const fetchFeed = async (
  userId?: string,
  page: number = 1,
  limit: number = 100, // Large limit for mobile infinite scroll
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

    console.log(`[INFINITE_SCROLL] Fetching page ${page} with limit ${limit} for ${userId ? 'personalized' : 'public'} feed`);

    const data = await apiRequest<VoiceNote[]>(endpoint, {
      method: "GET",
      requiresAuth,
    });

    // Validate response format
    if (Array.isArray(data)) {
      console.log(`[INFINITE_SCROLL] Received ${data.length} items for page ${page}`);
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