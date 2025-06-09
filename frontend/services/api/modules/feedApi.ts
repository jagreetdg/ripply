/**
 * Feed API functions
 */
import { ENDPOINTS, apiRequest } from "../config";

/**
 * Get personalized feed (voice notes from users the current user follows)
 */
export const getPersonalizedFeed = async (
  userId: string, 
  params: Record<string, any> = {}
) => {
  console.log("[DIAGNOSTIC] Starting getPersonalizedFeed for user:", userId);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString
    ? `${ENDPOINTS.VOICE_NOTES}/feed/${userId}?${queryString}`
    : `${ENDPOINTS.VOICE_NOTES}/feed/${userId}`;
  console.log("[DIAGNOSTIC] Endpoint being called:", endpoint);

  try {
    const response = await apiRequest(endpoint);

    // Log the entire response structure for diagnosis
    console.log("[DIAGNOSTIC] Response type:", typeof response);
    console.log("[DIAGNOSTIC] Response is array:", Array.isArray(response));
    console.log("[DIAGNOSTIC] Response keys:", Object.keys(response || {}));

    // Count shared vs non-shared posts to diagnose the issue
    if (Array.isArray(response)) {
      const sharedPosts = response.filter((item) => item.is_shared === true);
      const originalPosts = response.filter((item) => item.is_shared !== true);
      console.log(
        `[DIAGNOSTIC] FEED BREAKDOWN - Total: ${response.length}, Shared: ${sharedPosts.length}, Original: ${originalPosts.length}`
      );

      if (originalPosts.length === 0) {
        console.log(
          "[DIAGNOSTIC] WARNING: No original posts in feed response!"
        );
      }

      // Extract unique user IDs to see which users' posts we're getting
      const userIds = [...new Set(response.map((item) => item.user_id))];
      console.log("[DIAGNOSTIC] Unique user IDs in feed:", userIds);

      // The backend now returns a direct array of voice notes
      return response;
    } else if (response && Array.isArray(response.data)) {
      console.log(
        `[DIAGNOSTIC] Returning array of ${response.data.length} items from response.data`
      );
      return response.data;
    } else {
      console.log(
        "[DIAGNOSTIC] Unexpected response format for personalized feed:",
        response
      );
      return [];
    }
  } catch (error) {
    console.error("[DIAGNOSTIC] Error in getPersonalizedFeed:", error);
    return [];
  }
};

/**
 * Get diagnostic information about a user's feed
 */
export const runFeedDiagnostics = async (userId: string) => {
  if (!userId) {
    console.log("[DIAGNOSTIC] Cannot run diagnostics, no user logged in");
    return null;
  }

  try {
    console.log(
      "[DIAGNOSTIC] Running feed diagnostics for user:",
      userId
    );

    // Call the diagnostic endpoints
    const followResponse = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/diagnostic/follows/${userId}`
    );
    const feedTraceResponse = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/diagnostic/feed/${userId}`
    );

    // Check if user is following anyone
    const isFollowingAnyone = followResponse?.follows?.length > 0;
    console.log(
      `[DIAGNOSTIC] User is following anyone: ${isFollowingAnyone}`
    );
    console.log(
      `[DIAGNOSTIC] User follows ${
        followResponse?.follows?.length || 0
      } users`
    );

    // Check if feed correctly filters by followed users
    const totalPosts = feedTraceResponse?.totalPostsCount || 0;
    const filteredPosts = feedTraceResponse?.filteredPostsCount || 0;
    console.log(
      `[DIAGNOSTIC] Total posts: ${totalPosts}, Filtered posts: ${filteredPosts}`
    );

    // Compile diagnostic data
    const diagnoseResult = {
      userCheck: {
        userId,
        isLoggedIn: true,
      },
      followData: followResponse,
      feedTrace: feedTraceResponse,
      summary: {
        isFollowingAnyone,
        shouldHaveEmptyFeed: !isFollowingAnyone,
        followingCount: followResponse?.follows?.length || 0,
        postsAvailable: totalPosts,
        postsFromFollowedUsers: filteredPosts,
        potentialIssues: [] as string[],
      },
    };

    // Identify potential issues
    if (isFollowingAnyone && filteredPosts === 0) {
      (diagnoseResult.summary.potentialIssues as string[]).push(
        "User follows people but no posts from them are available"
      );
    }

    if (!isFollowingAnyone && filteredPosts > 0) {
      (diagnoseResult.summary.potentialIssues as string[]).push(
        "User doesn't follow anyone but still gets filtered posts"
      );
    }

    return diagnoseResult;
  } catch (error) {
    console.error("[DIAGNOSTIC] Error running diagnostics:", error);
    return null;
  }
}; 