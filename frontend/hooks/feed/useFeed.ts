/**
 * Main feed hook for handling feed data, state, and actions
 */
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { FeedItem, DiagnosticData } from './types';
import { fetchFeedData, trackVoiceNotePlay } from './feedApi';
import { runFollowDiagnostics } from './feedDiagnostics';

/**
 * Custom hook for managing feed data and interactions
 */
export const useFeed = () => {
  // State
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  
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

  // Fetch voice notes from the API
  const loadFeedData = useCallback(async (isRefreshing = false) => {
    // Only show loading indicator on initial load, not on subsequent refreshes
    if (!initialLoadComplete && !isRefreshing) {
      setLoading(true);
    }

    try {
      const formattedData = await fetchFeedData(
        currentUser?.id, 
        diagnosticData
      );
      
      setFeedItems(formattedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching voice notes:", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoadComplete(true);
    }
  }, [currentUser?.id, initialLoadComplete, diagnosticData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeedData(true);
  }, [loadFeedData]);

  // Load feed data on initial load and when the user changes
  useEffect(() => {
    loadFeedData();
  }, [loadFeedData, currentUser?.id]);

  return {
    feedItems,
    loading,
    refreshing,
    error,
    handleRefresh,
    handlePlayVoiceNote,
    runFollowDiagnostics: handleRunDiagnostics,
    diagnosticData,
    runningDiagnostics,
  };
}; 