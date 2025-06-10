/**
 * Main feed hook for handling feed data, state, and actions
 */
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { FeedItem, DiagnosticData } from './types';
import { fetchFeedData, trackVoiceNotePlay } from './feedApi';
import { runFollowDiagnostics } from './feedDiagnostics';

/**
 * Custom hook for managing feed data and interactions with infinite scrolling
 */
export const useFeed = () => {
  // State
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  // Context
  const { user: currentUser } = useUser();

  // Record a play for a voice note
  const handlePlayVoiceNote = useCallback(async (voiceNoteId: string, userId: string) => {
    await trackVoiceNotePlay(voiceNoteId, userId);
  }, []);

  // Run diagnostics on the feed and follow data
  const handleRunDiagnostics = useCallback(async () => {
    if (!currentUser) return;
    
    setRunningDiagnostics(true);
    try {
      const result = await runFollowDiagnostics(currentUser);
      if (result) {
        setDiagnosticData(result);
      }
    } finally {
      setRunningDiagnostics(false);
    }
  }, [currentUser]);

  // Fetch voice notes from the API with pagination support
  const loadFeedData = useCallback(async (isRefreshing = false, pageToLoad = 1) => {
    // Only show loading indicator on initial load, not on subsequent refreshes
    if (!initialLoadComplete && !isRefreshing && pageToLoad === 1) {
      setLoading(true);
    }

    // For loading more pages
    if (pageToLoad > 1) {
      setLoadingMore(true);
    }

    try {
      const formattedData = await fetchFeedData(
        currentUser?.id, 
        diagnosticData,
        pageToLoad,
        100 // Items per page for infinite scroll
      );
      
      if (isRefreshing || pageToLoad === 1) {
        // Fresh load or refresh - replace all data
        setFeedItems(formattedData);
        setCurrentPage(1);
        setHasMoreData(formattedData.length === 100); // If we get full batch, there might be more
      } else {
        // Loading more - append to existing data
        setFeedItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = formattedData.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setCurrentPage(pageToLoad);
        setHasMoreData(formattedData.length === 100); // If we get full batch, there might be more
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching voice notes:", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      setInitialLoadComplete(true);
    }
  }, [currentUser?.id, initialLoadComplete, diagnosticData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeedData(true, 1);
  }, [loadFeedData]);

  // Handle loading more data for infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    
    console.log(`[INFINITE_SCROLL] Loading page ${currentPage + 1}`);
    await loadFeedData(false, currentPage + 1);
  }, [loadFeedData, loadingMore, hasMoreData, currentPage]);

  // Load feed data on initial load and when the user changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadFeedData(false, 1);
  }, [currentUser?.id]);

  return {
    feedItems,
    loading,
    refreshing,
    loadingMore,
    hasMoreData,
    error,
    handleRefresh,
    handleLoadMore,
    handlePlayVoiceNote,
    runFollowDiagnostics: handleRunDiagnostics,
    diagnosticData,
    runningDiagnostics,
  };
}; 