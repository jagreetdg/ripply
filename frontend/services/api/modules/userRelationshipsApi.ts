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

/**
 * Follow a user
 * @param userId - ID of user to follow
 * @param followerId - ID of follower
 * @returns Follow relationship data
 */
export const followUser = async (
  userId: string, 
  followerId: string
): Promise<FollowResponse> => {
  try {
    console.log(
      `Attempting to follow user: ${userId} by follower: ${followerId}`
    );
    const response = await apiRequest<FollowResponse>(
      `${ENDPOINTS.USERS}/${userId}/follow`, 
      {
        method: "POST",
        body: JSON.stringify({ followerId }),
      }
    );

    console.log("Follow user response:", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

/**
 * Unfollow a user
 * @param userId - ID of user to unfollow
 * @param followerId - ID of follower
 * @returns Response data
 */
export const unfollowUser = async (
  userId: string, 
  followerId: string
): Promise<FollowResponse> => {
  try {
    console.log(
      `Attempting to unfollow user: ${userId} by follower: ${followerId}`
    );
    const response = await apiRequest<FollowResponse>(
      `${ENDPOINTS.USERS}/${userId}/unfollow`, 
      {
        method: "POST",
        body: JSON.stringify({ followerId }),
      }
    );

    console.log("Unfollow user response:", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

/**
 * Get followers of a user
 * @param userId - User ID
 * @returns List of followers
 */
export const getUserFollowers = async (userId: string): Promise<FollowRelationship[]> => {
  try {
    console.log(`Fetching followers for user: ${userId}`);
    const response = await apiRequest<FollowRelationship[] | { data: FollowRelationship[] }>(
      `${ENDPOINTS.USERS}/${userId}/followers`
    );
    console.log(`Followers API response:`, JSON.stringify(response));

    // Make sure we always return an array
    if (!response || (!('data' in response) && !Array.isArray(response))) {
      console.log("No followers data found, returning empty array");
      return [];
    }

    const followers = 'data' in response ? response.data : response;
    console.log(`Found ${followers.length} followers`);
    return followers;
  } catch (error) {
    console.error("Error fetching followers:", error);
    return [];
  }
};

/**
 * Get users that a user is following
 * @param userId - User ID
 * @returns List of followed users
 */
export const getUserFollowing = async (userId: string): Promise<FollowRelationship[]> => {
  try {
    console.log(`Fetching following users for user: ${userId}`);
    const response = await apiRequest<FollowRelationship[] | { data: FollowRelationship[] }>(
      `${ENDPOINTS.USERS}/${userId}/following`
    );
    console.log("getUserFollowing raw response:", JSON.stringify(response));

    // Make sure we always return an array
    if (!response || (!('data' in response) && !Array.isArray(response))) {
      console.log("No following data found, returning empty array");
      return [];
    }

    const following = 'data' in response ? response.data : response;
    console.log(`Found ${following.length} following users`);
    return following;
  } catch (error) {
    console.error("Error fetching following:", error);
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
    console.log(`Getting follower count for user: ${userId}`);
    const response = await apiRequest<CountResponse>(
      `${ENDPOINTS.USERS}/${userId}/follower-count`
    );
    console.log("Follower count response:", JSON.stringify(response));

    // Return the count from the response
    return response && typeof response.count === "number" ? response.count : 0;
  } catch (error) {
    console.error("Error getting follower count:", error);

    // Fallback to the old method if the new endpoint fails
    console.log("Falling back to counting followers array");
    const followers = await getUserFollowers(userId);
    return followers.length;
  }
};

/**
 * Get following count for a user
 * @param userId - User ID
 * @returns Number of users being followed
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    console.log(`Getting following count for user: ${userId}`);
    const response = await apiRequest<CountResponse>(
      `${ENDPOINTS.USERS}/${userId}/following-count`
    );
    console.log("Following count response:", JSON.stringify(response));

    // Return the count from the response
    return response && typeof response.count === "number" ? response.count : 0;
  } catch (error) {
    console.error("Error getting following count:", error);

    // Fallback to the old method if the new endpoint fails
    console.log("Falling back to counting following array");
    const following = await getUserFollowing(userId);
    return following.length;
  }
};

/**
 * Check if a user is following another user
 * @param followerId - ID of the potential follower
 * @param userId - ID of the user to check if being followed
 * @returns Whether followerId is following userId
 */
export const isFollowing = async (followerId: string, userId: string): Promise<boolean> => {
  try {
    console.log(
      `Checking if user ${followerId} is following ${userId} (direct API call)`
    );

    // Use the dedicated endpoint to check follow status
    const response = await apiRequest<IsFollowingResponse>(
      `${ENDPOINTS.USERS}/${userId}/is-following/${followerId}`
    );
    console.log("isFollowing direct API response:", JSON.stringify(response));

    if (response && typeof response.isFollowing === "boolean") {
      return response.isFollowing;
    }

    // Fallback to the old method if the new endpoint fails
    console.log("Falling back to checking follow status using following list");
    const following = await getUserFollowing(followerId);
    console.log(
      "isFollowing check - following data:",
      JSON.stringify(following)
    );

    // Check different possible data structures
    // Some API responses might include nested user objects
    return following.some((follow) => {
      // Check for direct following_id property
      if (follow.followee_id === userId) {
        return true;
      }

      // Check for possibly nested user object
      if (follow.users && follow.users.id === userId) {
        return true;
      }

      return false;
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}; 