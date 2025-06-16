import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Alert } from 'react-native';
import { likeVoiceNote, unlikeVoiceNote, checkLikeStatus } from '../../../services/api';
import { useToast } from '../../common/Toast';

interface VoiceNoteInteractionsProps {
  voiceNote: {
    id: string;
    likes?: number;
  };
  userId?: string;
}

interface InteractionsState {
  isLiked: boolean;
  likesCount: number;
  likeScale: Animated.Value;
  likePulse: Animated.Value;
}

interface InteractionsActions {
  handleLikePress: () => Promise<void>;
  setIsLiked: (liked: boolean) => void;
  setLikesCount: (count: number) => void;
}

export const useVoiceNoteInteractions = ({
  voiceNote,
  userId,
}: VoiceNoteInteractionsProps): InteractionsState & InteractionsActions => {
  // Interaction state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    typeof voiceNote.likes === 'number' && voiceNote.likes > 0 ? voiceNote.likes : 0
  );

  // Animation refs
  const likeScale = useRef(new Animated.Value(1)).current;
  const likePulse = useRef(new Animated.Value(1)).current;

  const { showToast } = useToast();

  // Handle like press with optimistic updates
  const handleLikePress = useCallback(async () => {
    if (!userId) {
      Alert.alert('Please log in', 'You need to be logged in to like voice notes.');
      return;
    }

    // Store original values for potential rollback
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;

    // OPTIMISTIC UPDATE: Immediately update UI
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    // Enhanced like button animation with scale and pulse effects
    const scaleAnimation = Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.4,
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

    // Pulse effect for like state change
    const pulseAnimation = Animated.sequence([
      Animated.timing(likePulse, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likePulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    // Start animations immediately
    Animated.parallel([scaleAnimation, pulseAnimation]).start();

    // API request in background
    try {
      if (newIsLiked) {
        await likeVoiceNote(voiceNote.id, userId);
        console.log('Voice note liked successfully');
      } else {
        await unlikeVoiceNote(voiceNote.id, userId);
        console.log('Voice note unliked successfully');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // ROLLBACK: Revert optimistic update on error
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
      
      // Show user-friendly error message
      const action = originalIsLiked ? 'unlike' : 'like';
      showToast(`Failed to ${action} voice note. Please try again.`, 'error');
    }
  }, [userId, voiceNote.id, isLiked, likesCount, likeScale, likePulse, showToast]);

  // Load initial like status
  useEffect(() => {
    if (!voiceNote.id || !userId) return;

    const loadLikeStatus = async () => {
      try {
        const likeStatus = await checkLikeStatus(voiceNote.id, userId);
        setIsLiked(likeStatus.isLiked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    loadLikeStatus();
  }, [voiceNote.id, userId]);

  return {
    // State
    isLiked,
    likesCount,
    likeScale,
    likePulse,

    // Actions
    handleLikePress,
    setIsLiked,
    setLikesCount,
  };
}; 