import { useState, useEffect, useCallback } from 'react';
import { newInteractionApi } from '../../../services/api/modules/interactionApi';

interface UseVoiceNoteLikeNewProps {
  voiceNoteId: string;
  userId: string | null;
  initialLikesCount?: number;
  initialIsLiked?: boolean;
  onLikeStatusChanged?: (isLiked: boolean, likesCount: number) => void;
}

export const useVoiceNoteLikeNew = ({
  voiceNoteId,
  userId,
  initialLikesCount = 0,
  initialIsLiked = false,
  onLikeStatusChanged,
}: UseVoiceNoteLikeNewProps) => {
  // State
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log(`[NEW LIKE HOOK] Initialize: voiceNoteId=${voiceNoteId}, userId=${userId}`);

  // Load initial status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        setIsLoading(true);
        console.log(`[NEW LIKE HOOK] Loading status for ${voiceNoteId}`);
        
        const status = await newInteractionApi.getInteractionStatus(voiceNoteId);
        
        console.log(`[NEW LIKE HOOK] Status loaded:`, status);
        
        setIsLiked(status.isLiked);
        setLikesCount(status.likesCount);
        
        // Notify parent component
        onLikeStatusChanged?.(status.isLiked, status.likesCount);
      } catch (error) {
        console.error(`[NEW LIKE HOOK] Failed to load status:`, error);
        // Keep initial values if API fails
      } finally {
        setIsLoading(false);
      }
    };

    if (voiceNoteId) {
      loadStatus();
    }
  }, [voiceNoteId, onLikeStatusChanged]);

  // Toggle like function
  const toggleLike = useCallback(async () => {
    if (!userId) {
      console.warn(`[NEW LIKE HOOK] No user ID provided`);
      return;
    }

    if (isProcessing) {
      console.warn(`[NEW LIKE HOOK] Already processing like toggle`);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Optimistic update
      const newIsLiked = !isLiked;
      const optimisticCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
      
      console.log(`[NEW LIKE HOOK] Optimistic update: ${isLiked} -> ${newIsLiked}, count: ${likesCount} -> ${optimisticCount}`);
      
      setIsLiked(newIsLiked);
      setLikesCount(optimisticCount);
      onLikeStatusChanged?.(newIsLiked, optimisticCount);

      // API call
      const result = await newInteractionApi.toggleLike(voiceNoteId);
      
      console.log(`[NEW LIKE HOOK] API result:`, result);
      
      // Update with actual values from server
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      onLikeStatusChanged?.(result.isLiked, result.likesCount);
      
    } catch (error) {
      console.error(`[NEW LIKE HOOK] Toggle failed:`, error);
      
      // Rollback optimistic update
      setIsLiked(!isLiked);
      setLikesCount(likesCount);
      onLikeStatusChanged?.(isLiked, likesCount);
      
    } finally {
      setIsProcessing(false);
    }
  }, [voiceNoteId, userId, isLiked, likesCount, isProcessing, onLikeStatusChanged]);

  return {
    isLiked,
    likesCount,
    isLoading,
    isProcessing,
    toggleLike,
  };
}; 