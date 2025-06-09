/**
 * Feed diagnostics module
 * Provides utilities for debugging feed-related issues
 */
import { ENDPOINTS, apiRequest } from '../../services/api/config';
import { DiagnosticData } from './types';

/**
 * Run diagnostics on the feed and follow data
 * @param currentUser - The current user object
 * @returns Diagnostic data or undefined if diagnostics failed
 */
export const runFollowDiagnostics = async (
  currentUser: { id: string; username: string } | null
): Promise<DiagnosticData | undefined> => {
  if (!currentUser?.id) {
    console.log("[DIAGNOSTIC] Cannot run diagnostics, no user logged in");
    return;
  }

  try {
    console.log(
      "[DIAGNOSTIC] Running follow diagnostics for user:",
      currentUser.id
    );

    // Call the diagnostic endpoints
    const followResponse = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/diagnostic/follows/${currentUser.id}`
    );
    const feedTraceResponse = await apiRequest(
      `${ENDPOINTS.VOICE_NOTES}/diagnostic/feed/${currentUser.id}`
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
    const diagnoseResult: DiagnosticData = {
      userCheck: {
        userId: currentUser.id,
        isLoggedIn: true,
        username: currentUser.username,
      },
      followData: followResponse,
      feedTrace: feedTraceResponse,
      summary: {
        isFollowingAnyone,
        shouldHaveEmptyFeed: !isFollowingAnyone,
        followingCount: followResponse?.follows?.length || 0,
        postsAvailable: totalPosts,
        postsFromFollowedUsers: filteredPosts,
        potentialIssues: [],
      },
    };

    // Identify potential issues
    if (isFollowingAnyone && filteredPosts === 0) {
      diagnoseResult.summary.potentialIssues.push(
        "User follows people but no posts from them are available"
      );
    }

    if (!isFollowingAnyone && filteredPosts > 0) {
      diagnoseResult.summary.potentialIssues.push(
        "User doesn't follow anyone but still gets filtered posts"
      );
    }

    console.log(
      "[DIAGNOSTIC] Completed diagnostics:",
      JSON.stringify(diagnoseResult.summary)
    );

    return diagnoseResult;
  } catch (error) {
    console.error("[DIAGNOSTIC] Error running diagnostics:", error);
    return undefined;
  }
}; 