/**
 * User relationships API module for handling follow/unfollow and related API calls
 */
import { ENDPOINTS, apiRequest } from "../config";
import { 
  User, 
  FollowRelationship, 
  FollowResponse, 
  IsFollowingResponse,
  CountResponse
} from "./types/userTypes";
import { getUserProfile } from "./userProfileApi";

export interface UserSearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
}

/**
 * Search for users
 * @param query - Search query
 * @returns List of user search results
 */
export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  try {
    const url = `${ENDPOINTS.SEARCH_USERS}?term=${encodeURIComponent(query)}`;
    console.log("[SEARCH DEBUG] Searching users:", { query, url });
    
    const data = await apiRequest<UserSearchResult[]>(url, { requiresAuth: false });
    console.log("[SEARCH DEBUG] Users search response:", { 
      query, 
      resultCount: data?.length || 0,
      results: data?.slice(0, 3) // First 3 results for debugging
    });
    
    return data || [];
  } catch (error) {
    console.error("[SEARCH DEBUG] Error searching users:", { query, error });
    return [];
  }
};

/**
 * Follow a user
 * @param userId - ID of user to follow
 * @returns Whether the follow was successful
 */
export const followUser = async (userId: string): Promise<boolean> => {
  try {
    await apiRequest(ENDPOINTS.FOLLOW_USER(userId), {
      method: "POST",
    });
    return true;
  } catch (error) {
    console.error("Error following user:", error);
    return false;
  }
};

/**
 * Unfollow a user
 * @param userId - ID of user to unfollow
 * @returns Whether the unfollow was successful
 */
export const unfollowUser = async (userId: string): Promise<boolean> => {
  try {
    await apiRequest(ENDPOINTS.UNFOLLOW_USER(userId), {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return false;
  }
};

/**
 * Get followers of a user
 * @param userId - User ID
 * @returns List of followers
 */
export const getUserFollowers = async (userId: string): Promise<UserSearchResult[]> => {
  try {
    const response = await apiRequest<{ data: any[], pagination?: any }>(
      ENDPOINTS.USER_FOLLOWERS(userId)
    );
    
    console.log(`[FOLLOWERS API] Raw response for user ${userId}:`, response);
    
    // Handle both direct array and wrapped { data: [] } responses
    const followers = Array.isArray(response) ? response : (response?.data || []);
    
    // Transform the backend response to match frontend expectations
    const transformedFollowers = followers.map((item: any) => {
      // If the item has a users field (from backend join), extract it
      if (item.users) {
        return {
          id: item.users.id,
          username: item.users.username,
          display_name: item.users.display_name,
          avatar_url: item.users.avatar_url,
          is_verified: item.users.is_verified || false,
        };
      }
      
      // If it's already in the expected format
      return {
        id: item.id,
        username: item.username,
        display_name: item.display_name,
        avatar_url: item.avatar_url,
        is_verified: item.is_verified || false,
      };
    });
    
    console.log(`[FOLLOWERS API] Transformed ${transformedFollowers.length} followers`);
    return transformedFollowers;
  } catch (error) {
    console.error("Error fetching user followers:", error);
    return [];
  }
};

/**
 * Get users that a user is following
 * @param userId - User ID
 * @returns List of followed users
 */
export const getUserFollowing = async (userId: string): Promise<UserSearchResult[]> => {
  try {
    const response = await apiRequest<{ data: any[], pagination?: any }>(
      ENDPOINTS.USER_FOLLOWING(userId)
    );
    
    console.log(`[FOLLOWING API] Raw response for user ${userId}:`, response);
    
    // Handle both direct array and wrapped { data: [] } responses
    const following = Array.isArray(response) ? response : (response?.data || []);
    
    // Transform the backend response to match frontend expectations
    const transformedFollowing = following.map((item: any) => {
      // If the item has a users field (from backend join), extract it
      if (item.users) {
        return {
          id: item.users.id,
          username: item.users.username,
          display_name: item.users.display_name,
          avatar_url: item.users.avatar_url,
          is_verified: item.users.is_verified || false,
        };
      }
      
      // If it's already in the expected format
      return {
        id: item.id,
        username: item.username,
        display_name: item.display_name,
        avatar_url: item.avatar_url,
        is_verified: item.is_verified || false,
      };
    });
    
    console.log(`[FOLLOWING API] Transformed ${transformedFollowing.length} following`);
    return transformedFollowing;
  } catch (error) {
    console.error("Error fetching user following:", error);
    return [];
  }
};

/**
 * Get follower count for a user
 * @param userId - User ID
 * @returns Number of followers
 */
export const getFollowerCount = async (userId: string): Promise<number> => {
  try {
    const data = await apiRequest<{ count: number }>(
      ENDPOINTS.FOLLOWER_COUNT(userId)
    );
    return data?.count || 0;
  } catch (error) {
    console.error("Error fetching follower count:", error);
    return 0;
  }
};

/**
 * Get following count for a user
 * @param userId - User ID
 * @returns Number of users being followed
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    const data = await apiRequest<{ count: number }>(
      ENDPOINTS.FOLLOWING_COUNT(userId)
    );
    return data?.count || 0;
  } catch (error) {
    console.error("Error fetching following count:", error);
    return 0;
  }
};

/**
 * Check if a user is following another user
 * @param userId - ID of the user to check if being followed
 * @param followerId - ID of the potential follower
 * @returns Whether userId is following followerId
 */
export const isFollowing = async (
  userId: string,
  followerId: string
): Promise<boolean> => {
  try {
    const data = await apiRequest<{ isFollowing: boolean }>(
      ENDPOINTS.IS_FOLLOWING(userId, followerId)
    );
    return data?.isFollowing || false;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}; 