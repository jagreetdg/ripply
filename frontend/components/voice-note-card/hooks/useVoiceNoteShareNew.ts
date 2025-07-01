import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isShared, setIsShared] = useState(initialIsShared);
  const [sharesCount, setSharesCount] = useState(initialSharesCount);
  const [isLoading, setIsLoading] = useState(!initialIsShared);
  const [isProcessing, setIsProcessing] = useState(false);
  const callbackRef = useRef(onShareStatusChanged);

  useEffect(() => {
    if (initialIsShared !== isShared) {
      setIsShared(initialIsShared);
    }
    if (initialSharesCount !== sharesCount) {
      setSharesCount(initialSharesCount);
    }
  }, [initialIsShared, initialSharesCount]);

  useEffect(() => {
    callbackRef.current = onShareStatusChanged;
  }, [onShareStatusChanged]);

  useEffect(() => {
    const loadStatus = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        const status = await newInteractionApi.getInteractionStatus(
          voiceNoteId
        );
        setIsShared(status.isShared);
        setSharesCount(status.sharesCount);
        callbackRef.current?.(status.isShared, status.sharesCount);
      } catch (error) {
        console.error("Failed to sync share status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (voiceNoteId) {
      loadStatus();
    }
  }, [voiceNoteId, userId]);

  const toggleShare = useCallback(async () => {
    if (!userId || isProcessing) {
      return;
    }

    setIsProcessing(true);
    const previousState = { isShared, sharesCount };

    const newIsShared = !isShared;
    const optimisticCount = newIsShared
      ? sharesCount + 1
      : Math.max(0, sharesCount - 1);

    setIsShared(newIsShared);
    setSharesCount(optimisticCount);
    callbackRef.current?.(newIsShared, optimisticCount);

    try {
      const result = await newInteractionApi.toggleShare(voiceNoteId);
      setIsShared(result.isShared);
      setSharesCount(result.sharesCount);
      callbackRef.current?.(result.isShared, result.sharesCount);
    } catch (error) {
      console.error(
        `[SHARE API] Error toggling share for note ${voiceNoteId}:`,
        error
      );
      setIsShared(previousState.isShared);
      setSharesCount(previousState.sharesCount);
      callbackRef.current?.(
        previousState.isShared,
        previousState.sharesCount
      );
    } finally {
      setIsProcessing(false);
    }
  }, [voiceNoteId, userId, isProcessing, isShared, sharesCount]);

  return {
    isShared,
    sharesCount,
    isLoading,
    isProcessing,
    toggleShare,
  };
}; 