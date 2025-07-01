import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(!initialIsLiked);
  const [isProcessing, setIsProcessing] = useState(false);
  const callbackRef = useRef(onLikeStatusChanged);

  useEffect(() => {
    if (initialIsLiked !== isLiked) {
      setIsLiked(initialIsLiked);
    }
    if (initialLikesCount !== likesCount) {
      setLikesCount(initialLikesCount);
    }
  }, [initialIsLiked, initialLikesCount]);

  useEffect(() => {
    callbackRef.current = onLikeStatusChanged;
  }, [onLikeStatusChanged]);

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
        setIsLiked(status.isLiked);
        setLikesCount(status.likesCount);
        callbackRef.current?.(status.isLiked, status.likesCount);
      } catch (error) {
        console.error("Failed to sync like status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (voiceNoteId) {
      loadStatus();
    }
  }, [voiceNoteId, userId]);

  const toggleLike = useCallback(async () => {
    if (!userId || isProcessing) {
      return;
    }

    setIsProcessing(true);
    const previousState = { isLiked, likesCount };

    const newIsLiked = !isLiked;
    const optimisticCount = newIsLiked
      ? likesCount + 1
      : Math.max(0, likesCount - 1);

    setIsLiked(newIsLiked);
    setLikesCount(optimisticCount);
    callbackRef.current?.(newIsLiked, optimisticCount);

    try {
      const result = await newInteractionApi.toggleLike(voiceNoteId);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      callbackRef.current?.(result.isLiked, result.likesCount);
    } catch (error) {
      console.error(
        `[LIKE API] Error toggling like for note ${voiceNoteId}:`,
        error
      );
      setIsLiked(previousState.isLiked);
      setLikesCount(previousState.likesCount);
      callbackRef.current?.(
        previousState.isLiked,
        previousState.likesCount
      );
    } finally {
      setIsProcessing(false);
    }
  }, [voiceNoteId, userId, isProcessing, isLiked, likesCount]);

  return {
    isLiked,
    likesCount,
    isLoading,
    isProcessing,
    toggleLike,
  };
}; 