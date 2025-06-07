import { useState, useEffect, useCallback } from 'react';
import { checkRepostStatus, toggleRepost, clearRepostCache } from '../services/api/repostService';
import { useUser } from '../context/UserContext';

/**
 * Custom hook to manage repost status for a voice note
 * 
 * @param voiceNoteId - The ID of the voice note
 * @returns A tuple containing repost state and functions to interact with it
 */
export const useRepostStatus = (voiceNoteId: string) => {
  const { user } = useUser();
  const [isReposted, setIsReposted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [repostCount, setRepostCount] = useState<number>(0);
  
  // Fetch the initial repost status
  useEffect(() => {
    const fetchRepostStatus = async () => {
      if (!voiceNoteId || !user?.id) {
        setIsLoading(false);
        setIsReposted(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const status = await checkRepostStatus(voiceNoteId, user.id);
        setIsReposted(status);
      } catch (error) {
        console.error('[useRepostStatus] Error fetching repost status:', error);
        setIsReposted(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRepostStatus();
    
    // Clean up by clearing the cache when unmounting
    return () => {
      // We could clear specific cache here, but it's better to let the cache persist
      // for performance reasons
    };
  }, [voiceNoteId, user?.id]);
  
  // Function to toggle repost status
  const toggleRepostStatus = useCallback(async () => {
    if (!voiceNoteId || !user?.id) {
      console.warn('[useRepostStatus] Cannot toggle repost: missing voiceNoteId or user');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await toggleRepost(voiceNoteId, user.id);
      
      if (result.success) {
        setIsReposted(result.isReposted);
        setRepostCount(result.repostCount);
        
        // Log the action for debugging
        console.log(`[useRepostStatus] Voice note ${voiceNoteId} repost toggled: ${result.isReposted}`);
        
        return {
          success: true,
          isReposted: result.isReposted,
          repostCount: result.repostCount
        };
      } else {
        console.error('[useRepostStatus] Repost toggle failed:', result);
        return { success: false, isReposted, repostCount };
      }
    } catch (error) {
      console.error('[useRepostStatus] Error toggling repost:', error);
      return { success: false, isReposted, repostCount };
    } finally {
      setIsLoading(false);
    }
  }, [voiceNoteId, user?.id, isReposted, repostCount]);
  
  // Manually set the repost status (useful when we know the status has changed externally)
  const setRepostStatus = useCallback((status: boolean, count?: number) => {
    setIsReposted(status);
    if (typeof count === 'number') {
      setRepostCount(count);
    }
    
    // Update the cache
    if (voiceNoteId && user?.id) {
      const cacheKey = `${voiceNoteId}:${user.id}`;
      clearRepostCache(voiceNoteId, user.id);
    }
  }, [voiceNoteId, user?.id]);
  
  return {
    isReposted,
    isLoading,
    repostCount,
    toggleRepostStatus,
    setRepostStatus
  };
};

/**
 * Hook to check repost status for multiple voice notes at once
 * 
 * @param voiceNoteIds - Array of voice note IDs to check
 * @returns Map of voice note IDs to repost status
 */
export const useBatchRepostStatus = (voiceNoteIds: string[]) => {
  const { user } = useUser();
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchAllStatuses = async () => {
      if (!user?.id || voiceNoteIds.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      const newStatusMap: Record<string, boolean> = {};
      
      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < voiceNoteIds.length; i += batchSize) {
        const batch = voiceNoteIds.slice(i, i + batchSize);
        
        // Process batch in parallel
        const results = await Promise.all(
          batch.map(id => checkRepostStatus(id, user.id))
        );
        
        // Update status map with results
        batch.forEach((id, index) => {
          newStatusMap[id] = results[index];
        });
      }
      
      setStatusMap(newStatusMap);
      setIsLoading(false);
      
      console.log(`[useBatchRepostStatus] Loaded status for ${Object.keys(newStatusMap).length} voice notes`);
    };
    
    fetchAllStatuses();
  }, [voiceNoteIds, user?.id]);
  
  // Function to update a specific status in the map
  const updateStatus = useCallback((voiceNoteId: string, status: boolean) => {
    setStatusMap(prev => ({
      ...prev,
      [voiceNoteId]: status
    }));
  }, []);
  
  return {
    statusMap,
    isLoading,
    updateStatus
  };
}; 