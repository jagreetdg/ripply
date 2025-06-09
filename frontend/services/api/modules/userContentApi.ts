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
export const getUserVoiceNotes = async (userId: string): Promise<VoiceNote[]> => {
  const response = await apiRequest<{ data: VoiceNote[] } | VoiceNote[]>(
    `${ENDPOINTS.USERS}/${userId}/voice-notes`
  );

  // Extract just the voice notes array from the response
  const voiceNotes = 'data' in response ? response.data : response || [];

  // Get the user data to attach to each voice note
  try {
    const userData = await getUserProfile(userId);

    // Attach the user data to each voice note
    return voiceNotes.map((note) => ({
      ...note,
      users: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        avatar_url: userData.avatar_url,
      },
    }));
  } catch (error) {
    return voiceNotes;
  }
};

/**
 * Get shared voice notes for a user (reposted content)
 * @param userId - User ID
 * @returns List of shared voice notes
 */
export const getUserSharedVoiceNotes = async (userId: string): Promise<VoiceNote[]> => {
  const response = await apiRequest<{ data: VoiceNote[] } | VoiceNote[]>(
    `${ENDPOINTS.USERS}/${userId}/shared-voice-notes`
  );

  // Extract just the voice notes array from the response
  const voiceNotes = 'data' in response ? response.data : response || [];

  // The backend now provides complete shared_by objects, so we can just ensure
  // all notes have the is_shared flag set to true and return them
  return voiceNotes.map((note) => ({
    ...note,
    is_shared: true,
    // Make sure shared_at exists
    shared_at: note.shared_at || new Date().toISOString(),
  }));
};

/**
 * For development/debugging: Check the database schema for the follows table
 * @param userId - User ID to test with
 * @returns Debug information
 */
export const debugFollowsSchema = async (userId: string): Promise<any> => {
  try {
    console.log(`DEBUG: Checking follows schema for user ${userId}`);
    
    // Use imported functions

    // Collect debug information
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

    console.log(
      "DEBUG follows schema results:",
      JSON.stringify(debugInfo, null, 2)
    );
    return debugInfo;
  } catch (error) {
    console.error("DEBUG schema test error:", error);
    return { error: String(error) };
  }
}; 