import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { likeVoiceNote, checkLikeStatus } from '../../../services/api';
import { useToast } from '../../common/Toast';

interface UseVoiceNoteLikeProps {
  voiceNoteId: string;
  userId?: string;
  initialLikesCount?: number;
}

interface UseVoiceNoteLikeReturn {
  // State
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  isProcessing: boolean;
  
  // Animation values
  likeScale: Animated.Value;
  likePulse: Animated.Value;
  
  // Actions
  handleLikePress: () => void;
}

export const useVoiceNoteLike = ({
  voiceNoteId,
  userId,
  initialLikesCount = 0
}: UseVoiceNoteLikeProps): UseVoiceNoteLikeReturn => {
  const { showToast } = useToast();
  
  // State
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation refs
  const likeScale = useRef(new Animated.Value(1)).current;
  const likePulse = useRef(new Animated.Value(1)).current;
  
  // Load initial like status and count
  useEffect(() => {
    const loadLikeData = async () => {
      if (!voiceNoteId || !userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        console.log(`[LIKE DEBUG] Loading like data for ${voiceNoteId}:`);
        console.log(`[LIKE DEBUG] - Initial prop count: ${initialLikesCount}`);
        
        const likeStatus = await checkLikeStatus(voiceNoteId, userId);
        
        console.log(`[LIKE DEBUG] - API like status: ${likeStatus.isLiked}`);
        console.log(`[LIKE DEBUG] - API like count: ${likeStatus.likesCount}`);
        console.log(`[LIKE DEBUG] - Count difference: ${likeStatus.likesCount} (API) vs ${initialLikesCount} (prop)`);
        
        setIsLiked(likeStatus.isLiked);
        // Always use the fresh count from API
        if (typeof likeStatus.likesCount === 'number') {
          setLikesCount(likeStatus.likesCount);
        }
      } catch (error) {
        console.error('Failed to load like data:', error);
        // Keep initial state on error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLikeData();
  }, [voiceNoteId, userId, initialLikesCount]);
  
  // Handle like button press with optimistic updates
  const handleLikePress = useCallback(async () => {
    if (!userId) {
      showToast('Please log in to like voice notes', 'error');
      return;
    }
    
    if (isProcessing) {
      return; // Prevent rapid clicks
    }
    
    setIsProcessing(true);
    
    // Store original values for rollback
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;
    
    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked 
      ? likesCount + 1 
      : Math.max(0, likesCount - 1);
    
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    
    // Animation
    const scaleAnimation = Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);
    
    const pulseAnimation = Animated.sequence([
      Animated.timing(likePulse, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likePulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);
    
    Animated.parallel([scaleAnimation, pulseAnimation]).start();
    
    try {
      // Make API call
      const result = await likeVoiceNote(voiceNoteId, userId);
      
      // Always trust the backend state and count to ensure sync
      setIsLiked(result.isLiked);
      
      if (typeof result.likesCount === 'number') {
        setLikesCount(result.likesCount);
      }
      
    } catch (error) {
      console.error('Like operation failed:', error);
      
      // Rollback optimistic update
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
      
      // Show error message
      const errorMessage = error instanceof Error && error.message.includes('429')
        ? 'Please wait a moment before trying again'
        : 'Failed to update like';
      
      showToast(errorMessage, 'error');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  }, [voiceNoteId, userId, isLiked, likesCount, isProcessing, likeScale, likePulse, showToast]);
  
  return {
    isLiked,
    likesCount,
    isLoading,
    isProcessing,
    likeScale,
    likePulse,
    handleLikePress,
  };
}; 