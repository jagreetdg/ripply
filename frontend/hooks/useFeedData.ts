import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { getVoiceNotes, getPersonalizedFeed, recordPlay } from '../services/api/voiceNoteService';
import { ENDPOINTS, apiRequest } from '../services/api/config';

// Define interfaces
export interface VoiceNote {
  id: string;
  title: string;
  duration: number;
  likes: number | { count: number }[];
  comments: number | { count: number }[];
  plays: number | { count: number }[];
  shares?: number;
  backgroundImage?: string | null;
  background_image?: string | null;
  tags?: string[];
  user_id?: string;
  created_at?: string;
  users?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface FeedItem {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  userAvatar: string | null;
  timePosted: string;
  isShared: boolean;
  sharedBy?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  voiceNote: {
    id: string;
    duration: number;
    title: string;
    likes: number;
    comments: number;
    plays: number;
    shares: number;
    backgroundImage: string | null;
    tags: string[];
    users?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

export const useFeedData = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  
  const { user: currentUser } = useUser();

  // Helper function to check if a string is a UUID
  const isUUID = (id: string): boolean => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };

  // Diagnostic function to check follow data
  const runFollowDiagnostics = useCallback(async () => {
    if (!currentUser?.id) {
      console.log("[DIAGNOSTIC] Cannot run diagnostics, no user logged in");
      return;
    }

    try {
      setRunningDiagnostics(true);
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
      const diagnoseResult = {
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

      setDiagnosticData(diagnoseResult);
      console.log(
        "[DIAGNOSTIC] Completed diagnostics:",
        JSON.stringify(diagnoseResult.summary)
      );

      return diagnoseResult;
    } catch (error) {
      console.error("[DIAGNOSTIC] Error running diagnostics:", error);
    } finally {
      setRunningDiagnostics(false);
    }
  }, [currentUser]);

  // Handle recording a play
  const handlePlayVoiceNote = useCallback(async (voiceNoteId: string, userId: string) => {
    try {
      // Record the play in the backend
      await recordPlay(voiceNoteId, userId);
    } catch (err) {
      console.error("Error recording play:", err);
    }
  }, []);

  // Fetch voice notes from the API
  const fetchVoiceNotes = useCallback(async (isRefreshing = false) => {
    // Only show loading indicator on initial load, not on subsequent refreshes
    if (!initialLoadComplete && !isRefreshing) {
      setLoading(true);
    }

    try {
      let data;

      // If diagnostics were run, log the findings
      if (diagnosticData) {
        console.log("[DIAGNOSTIC] Fetching with diagnostic data available");
        console.log(
          "[DIAGNOSTIC] Following count:",
          diagnosticData.summary.followingCount
        );
        console.log(
          "[DIAGNOSTIC] Should have empty feed:",
          diagnosticData.summary.shouldHaveEmptyFeed
        );
      }

      // Check if user is logged in
      if (currentUser?.id) {
        // Fetch personalized feed for logged in users
        console.log("Fetching personalized feed for user:", currentUser.id);
        data = await getPersonalizedFeed(currentUser.id);
        console.log(
          "Personalized feed data:",
          Array.isArray(data)
            ? `Array with ${data.length} items`
            : typeof data,
          data && data.length > 0
            ? `First item user_id: ${data[0].user_id}`
            : "Empty array"
        );
      } else {
        // Fallback to all voice notes if user is not logged in
        console.log("No user logged in, fetching general feed");
        data = await getVoiceNotes();
      }

      if (!Array.isArray(data)) {
        console.error("Expected array of voice notes but got:", typeof data);
        setFeedItems([]);
        setError("Invalid data format received from server");
        return;
      }

      // If we have diagnostic data, validate if the posts are from followed users
      if (diagnosticData && currentUser?.id && data.length > 0) {
        const followingIds =
          diagnosticData.followData?.follows?.map(
            (f: { id: string }) => f.id
          ) || [];

        // Skip unfollowed check if user doesn't follow anyone
        if (followingIds.length === 0) {
          console.log(
            "[DIAGNOSTIC] User doesn't follow anyone, skipping unfollowed posts check"
          );
        } else {
          // Check if any posts are from users not followed
          const unfollowedPosts = data.filter((item) => {
            // For regular posts (not shared), check if the creator is followed
            if (item.is_shared !== true) {
              return !followingIds.includes(item.user_id);
            }

            // For shared posts, check if the sharer is followed
            // Only if shared_by exists and has a valid id field
            if (item.shared_by && item.shared_by.id && isUUID(item.shared_by.id)) {
              return !followingIds.includes(item.shared_by.id);
            }

            // Skip posts with invalid sharer data in diagnostics
            console.log("[DIAGNOSTIC] Skipping shared post with invalid sharer data:", item.id);
            return false; // Don't count posts with missing sharer data as unfollowed
          });

          if (unfollowedPosts.length > 0) {
            console.error(
              "[DIAGNOSTIC] CRITICAL ERROR: Found posts from unfollowed users!",
              unfollowedPosts.map((p) => ({
                id: p.id,
                user_id: p.user_id,
                is_shared: p.is_shared,
                shared_by_id: p.shared_by?.id,
              }))
            );
          } else {
            console.log(
              "[DIAGNOSTIC] All posts are from followed users, as expected"
            );
          }
        }
      }

      // Transform backend data format to match our frontend component expectations
      // First, ensure uniqueness by filtering out any duplicate IDs
      const uniqueData = data.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
      );

      console.log('[DEBUG] Before transform - Data sample:', uniqueData.length > 0 ? {
        id: uniqueData[0].id,
        is_shared: uniqueData[0].is_shared,
        user_id: uniqueData[0].user_id,
        shared_by: uniqueData[0].shared_by
      } : 'No data');

      // Log the breakdown of original vs shared posts in API response
      const originalFromAPI = uniqueData.filter(item => item.is_shared !== true);
      const sharedFromAPI = uniqueData.filter(item => item.is_shared === true);
      console.log(`[DEBUG] API response breakdown - Original: ${originalFromAPI.length}, Shared: ${sharedFromAPI.length}`);

      if (originalFromAPI.length === 0 && sharedFromAPI.length > 0) {
        console.log('[DEBUG] WARNING: Only shared posts in API response, no original posts!');
      }

      const transformedData = uniqueData.map((item) => {
        // Determine if this is a shared voice note (repost)
        // Explicitly check for true to handle null/undefined properly
        const isShared = item.is_shared === true;

        // Get sharer info if available
        const sharerInfo =
          isShared && item.shared_by
            ? {
                id: item.shared_by.id,
                username: item.shared_by.username || "",
                displayName: item.shared_by.display_name || "User",
                avatarUrl: item.shared_by.avatar_url,
              }
            : null;
            
        // Create the transformed item
        const transformedItem = {
          id: item.id,
          userId: item.user_id,
          displayName: item.users?.display_name || "User",
          username: item.users?.username || "",
          userAvatar: item.users?.avatar_url,
          timePosted:
            isShared && item.shared_at
              ? new Date(item.shared_at).toLocaleDateString()
              : new Date(item.created_at).toLocaleDateString(),
          isShared,
          sharedBy: sharerInfo,
          voiceNote: {
            id: item.id,
            duration: item.duration,
            title: item.title,
            likes: item.likes?.[0]?.count || 0,
            comments: item.comments?.[0]?.count || 0,
            plays: item.plays?.[0]?.count || 0,
            shares: item.shares || 0,
            backgroundImage: item.background_image || null,
            tags: item.tags || [],
            // Include the users object from the API response
            users: item.users,
          },
        };
        
        // Debug log if this is the first item, to see what's happening
        if (item === uniqueData[0]) {
          console.log('[DEBUG] First item transformation:', {
            original: {
              id: item.id,
              is_shared: item.is_shared,
              user_id: item.user_id,
            },
            transformed: {
              id: transformedItem.id,
              isShared: transformedItem.isShared,
              userId: transformedItem.userId,
            }
          });
        }
        
        return transformedItem;
      });

      // Log the breakdown after transformation
      const originalTransformed = transformedData.filter(item => !item.isShared);
      const sharedTransformed = transformedData.filter(item => item.isShared);
      console.log(`[DEBUG] After transform breakdown - Original: ${originalTransformed.length}, Shared: ${sharedTransformed.length}`);

      setFeedItems(transformedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching voice notes:", err);
      setError("Failed to load voice notes. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoadComplete(true);
    }
  }, [currentUser, diagnosticData, initialLoadComplete]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchVoiceNotes(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchVoiceNotes]);

  // Initial data fetch
  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes]);

  // Add diagnostic trigger after component mounts
  useEffect(() => {
    // Wait a bit before running diagnostics
    if (currentUser?.id) {
      const timer = setTimeout(() => {
        runFollowDiagnostics();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentUser, runFollowDiagnostics]);

  return {
    feedItems,
    loading,
    error,
    refreshing,
    handleRefresh,
    isUUID,
    handlePlayVoiceNote,
    diagnosticData
  };
}; 