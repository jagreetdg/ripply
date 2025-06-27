import { useState, useEffect, useCallback } from 'react';
import { newInteractionApi } from '../../../services/api/modules/interactionApi';

interface UseVoiceNoteShareNewProps {
  voiceNoteId: string;
  userId: string | null;
  initialSharesCount?: number;
  initialIsShared?: boolean;
  onShareStatusChanged?: (isShared: boolean, sharesCount: number) => void;
}

export const useVoiceNoteShareNew = ({
  voiceNoteId,
  userId,
  initialSharesCount = 0,
  initialIsShared = false,
  onShareStatusChanged,
}: UseVoiceNoteShareNewProps) => {
  // State
  const [isShared, setIsShared] = useState(initialIsShared);
  const [sharesCount, setSharesCount] = useState(initialSharesCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log(`[NEW SHARE HOOK] Initialize: voiceNoteId=${voiceNoteId}, userId=${userId}`);

  // Load initial status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        setIsLoading(true);
        console.log(`[NEW SHARE HOOK] Loading status for ${voiceNoteId}`);
        
        const status = await newInteractionApi.getInteractionStatus(voiceNoteId);
        
        console.log(`[NEW SHARE HOOK] Status loaded:`, status);
        
        setIsShared(status.isShared);
        setSharesCount(status.sharesCount);
        
        // Notify parent component
        onShareStatusChanged?.(status.isShared, status.sharesCount);
      } catch (error) {
        console.error(`[NEW SHARE HOOK] Failed to load status:`, error);
        // Keep initial values if API fails
      } finally {
        setIsLoading(false);
      }
    };

    if (voiceNoteId) {
      loadStatus();
    }
  }, [voiceNoteId, onShareStatusChanged]);

  // Toggle share function
  const toggleShare = useCallback(async () => {
    if (!userId) {
      console.warn(`[NEW SHARE HOOK] No user ID provided`);
      return;
    }

    if (isProcessing) {
      console.warn(`[NEW SHARE HOOK] Already processing share toggle`);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Optimistic update
      const newIsShared = !isShared;
      const optimisticCount = newIsShared ? sharesCount + 1 : Math.max(0, sharesCount - 1);
      
      console.log(`[NEW SHARE HOOK] Optimistic update: ${isShared} -> ${newIsShared}, count: ${sharesCount} -> ${optimisticCount}`);
      
      setIsShared(newIsShared);
      setSharesCount(optimisticCount);
      onShareStatusChanged?.(newIsShared, optimisticCount);

      // API call
      const result = await newInteractionApi.toggleShare(voiceNoteId);
      
      console.log(`[NEW SHARE HOOK] API result:`, result);
      
      // Update with actual values from server
      setIsShared(result.isShared);
      setSharesCount(result.sharesCount);
      onShareStatusChanged?.(result.isShared, result.sharesCount);
      
    } catch (error) {
      console.error(`[NEW SHARE HOOK] Toggle failed:`, error);
      
      // Rollback optimistic update
      setIsShared(!isShared);
      setSharesCount(sharesCount);
      onShareStatusChanged?.(isShared, sharesCount);
      
    } finally {
      setIsProcessing(false);
    }
  }, [voiceNoteId, userId, isShared, sharesCount, isProcessing, onShareStatusChanged]);

  return {
    isShared,
    sharesCount,
    isLoading,
    isProcessing,
    toggleShare,
  };
}; 