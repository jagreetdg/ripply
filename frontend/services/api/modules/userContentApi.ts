/**
 * User content API module for handling user content-related API calls
 */
import { ENDPOINTS, apiRequest } from "../config";
import { User } from "./types/userTypes";
import { VoiceNote } from "./types/voiceNoteTypes";
import { getUserProfile } from "./userProfileApi";
import { 
  getUserFollowers, 
  getUserFollowing,
  getFollowerCount,
  getFollowingCount
} from './userRelationshipsApi';

/**
 * Get voice notes for a user
 * @param userId - User ID
 * @returns List of voice notes
 */
export const getUserVoiceNotes = async (userId: string, page: number = 1, limit: number = 10): Promise<VoiceNote[]> => {
  try {
    const data = await apiRequest(ENDPOINTS.USER_VOICE_NOTES(userId) + `?page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    console.error("Error fetching user voice notes:", error);
    throw error;
  }
};

/**
 * Get shared voice notes for a user (reposted content)
 * @param userId - User ID
 * @returns List of shared voice notes
 */
export const getUserSharedVoiceNotes = async (userId: string, page: number = 1, limit: number = 10): Promise<VoiceNote[]> => {
  try {
    const data = await apiRequest(ENDPOINTS.USER_SHARED_VOICE_NOTES(userId) + `?page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    console.error("Error fetching user shared voice notes:", error);
    throw error;
  }
};

/**
 * For development/debugging: Check the database schema for the follows table
 * @param userId - User ID to test with
 * @returns Debug information
 */
export const debugFollowsSchema = async (userId: string): Promise<any> => {
  try {
    // Use imported functions
    const debugInfo: any = {
      user: userId,
      followersData: null,
      followingData: null,
      followerCount: null,
      followingCount: null,
      errors: [],
    };

    // Test 1: Get followers
    try {
      const followers = await getUserFollowers(userId);
      debugInfo.followersData = followers.slice(0, 2); // Just take first 2 to not clutter logs
      debugInfo.followersCount = followers.length;

      // Check the structure of the first follower
      if (followers.length > 0) {
        const firstFollower = followers[0];
        debugInfo.followerStructure = {
          has_follower_id: "follower_id" in firstFollower,
          has_followee_id: "followee_id" in firstFollower,
          has_following_id: "following_id" in firstFollower,
          has_users: "users" in firstFollower,
          user_data: firstFollower.users
            ? Object.keys(firstFollower.users)
            : null,
        };
      }
    } catch (error) {
      console.error("DEBUG followers error:", error);
      debugInfo.errors.push({ type: "followers", error: String(error) });
    }

    // Test 2: Get following
    try {
      const following = await getUserFollowing(userId);
      debugInfo.followingData = following.slice(0, 2); // Just take first 2
      debugInfo.followingCount = following.length;

      // Check the structure of the first followed user
      if (following.length > 0) {
        const firstFollowing = following[0];
        debugInfo.followingStructure = {
          has_follower_id: "follower_id" in firstFollowing,
          has_followee_id: "followee_id" in firstFollowing,
          has_following_id: "following_id" in firstFollowing,
          has_users: "users" in firstFollowing,
          user_data: firstFollowing.users
            ? Object.keys(firstFollowing.users)
            : null,
        };
      }
    } catch (error) {
      console.error("DEBUG following error:", error);
      debugInfo.errors.push({ type: "following", error: String(error) });
    }

    // Test 3: Get counts directly
    try {
      const followerCount = await getFollowerCount(userId);
      const followingCount = await getFollowingCount(userId);
      debugInfo.followerCount = followerCount;
      debugInfo.followingCount = followingCount;
    } catch (error) {
      console.error("DEBUG counts error:", error);
      debugInfo.errors.push({ type: "counts", error: String(error) });
    }

    return debugInfo;
  } catch (error) {
    console.error("DEBUG schema test error:", error);
    return { error: String(error) };
  }
};

export const createFollowsSchema = async (userId: string): Promise<void> => {
  try {
    const response = await apiRequest(
      ENDPOINTS.USER_VERIFY(userId),
      {
        method: "POST",
      }
    );
    return response;
  } catch (error) {
    console.error(`Error creating follows schema for user ${userId}:`, error);
    throw error;
  }
};

export const getUserReposts = async (userId: string): Promise<any[]> => {
  try {
    const response = await apiRequest(
      ENDPOINTS.USER_SHARED_VOICE_NOTES(userId)
    );

    if (Array.isArray(response)) {
      return response;
    }

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error(`Error fetching reposts for user ${userId}:`, error);
    return [];
  }
};

// Get user's voice bio
export const getUserVoiceBio = async (userId: string) => {
  try {
    const data = await apiRequest(ENDPOINTS.VOICE_BIO(userId));
    return data;
  } catch (error) {
    console.error("Error fetching user voice bio:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    const data = await apiRequest(ENDPOINTS.USER_PROFILE(userId), {
      method: "PUT",
      body: profileData,
    });
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}; 