import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Alert, Share, Platform } from 'react-native';
import { toggleRepost, hasUserRepostedVoiceNote, getRepostCount } from '../../../services/api';
import { useToast } from '../../common/Toast';

interface UseVoiceNoteShareProps {
  voiceNoteId: string;
  voiceNoteTitle?: string;
  userId?: string;
  initialSharesCount?: number;
  onShareStatusChanged?: (voiceNoteId: string, isShared: boolean) => void;
  onVoiceNoteUnshared?: (voiceNoteId: string) => void;
}

interface UseVoiceNoteShareReturn {
  // State
  isShared: boolean;
  sharesCount: number;
  isLoading: boolean;
  isProcessing: boolean;
  
  // Animation values
  shareScale: Animated.Value;
  sharePulse: Animated.Value;
  
  // Actions
  handleSharePress: () => void;
  handleShareCountLongPress: () => void;
}

export const useVoiceNoteShare = ({
  voiceNoteId,
  voiceNoteTitle = '',
  userId,
  initialSharesCount = 0,
  onShareStatusChanged,
  onVoiceNoteUnshared
}: UseVoiceNoteShareProps): UseVoiceNoteShareReturn => {
  const { showToast } = useToast();
  
  // State
  const [isShared, setIsShared] = useState(false);
  const [sharesCount, setSharesCount] = useState(initialSharesCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation refs
  const shareScale = useRef(new Animated.Value(1)).current;
  const sharePulse = useRef(new Animated.Value(1)).current;
  
  // Load initial share status and count
  useEffect(() => {
    const loadShareData = async () => {
      if (!voiceNoteId || !userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        console.log(`[SHARE DEBUG] Loading share data for ${voiceNoteId}:`);
        console.log(`[SHARE DEBUG] - Initial prop count: ${initialSharesCount}`);
        
        // Load both share status and count
        const [shareStatus, shareCount] = await Promise.all([
          hasUserRepostedVoiceNote(voiceNoteId, userId),
          getRepostCount(voiceNoteId)
        ]);
        
        console.log(`[SHARE DEBUG] - API share status: ${shareStatus}`);
        console.log(`[SHARE DEBUG] - API share count: ${shareCount}`);
        console.log(`[SHARE DEBUG] - Count difference: ${shareCount} (API) vs ${initialSharesCount} (prop)`);
        
        setIsShared(shareStatus);
        setSharesCount(typeof shareCount === 'number' ? shareCount : 0);
        
      } catch (error) {
        console.error('Failed to load share data:', error);
        // Keep initial state on error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadShareData();
  }, [voiceNoteId, userId, initialSharesCount]);
  
  // Handle share button press with optimistic updates
  const handleSharePress = useCallback(async () => {
    if (!userId) {
      Alert.alert('Please log in', 'You need to be logged in to share voice notes.');
      return;
    }
    
    if (isProcessing) {
      return; // Prevent rapid clicks
    }
    
    setIsProcessing(true);
    
    // Store original values for rollback
    const originalIsShared = isShared;
    const originalSharesCount = sharesCount;
    
    // Optimistic update
    const newIsShared = !isShared;
    const newSharesCount = newIsShared 
      ? sharesCount + 1 
      : Math.max(0, sharesCount - 1);
    
    setIsShared(newIsShared);
    setSharesCount(newSharesCount);
    
    // Animation
    const scaleAnimation = Animated.sequence([
      Animated.timing(shareScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(shareScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);
    
    const pulseAnimation = Animated.sequence([
      Animated.timing(sharePulse, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sharePulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);
    
    Animated.parallel([scaleAnimation, pulseAnimation]).start();
    
    try {
      // Make API call
      const result = await toggleRepost(voiceNoteId, userId);
      
      // Always trust the backend state and count to ensure sync
      setIsShared(result.isReposted);
      
      if (typeof result.repostCount === 'number') {
        setSharesCount(result.repostCount);
      }
      
      // Call callbacks
      if (onShareStatusChanged) {
        onShareStatusChanged(voiceNoteId, result.isReposted);
      }
      
      if (!result.isReposted && onVoiceNoteUnshared) {
        onVoiceNoteUnshared(voiceNoteId);
      }
      
    } catch (error) {
      console.error('Share operation failed:', error);
      
      // Rollback optimistic update
      setIsShared(originalIsShared);
      setSharesCount(originalSharesCount);
      
      // Show error message
      const errorMessage = error instanceof Error && error.message.includes('429')
        ? 'Please wait a moment before trying again'
        : 'Failed to update share';
      
      showToast(errorMessage, 'error');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  }, [voiceNoteId, userId, isShared, sharesCount, isProcessing, shareScale, sharePulse, showToast, onShareStatusChanged, onVoiceNoteUnshared]);
  
  // Handle share count long press (link sharing)
  const handleShareCountLongPress = useCallback(() => {
    if (Platform.OS === 'web') {
      const url = `${window.location.origin}/voicenote/${voiceNoteId}`;
      navigator.clipboard.writeText(url);
      Alert.alert('Link copied', 'Voice note link copied to clipboard!');
    } else {
      Share.share({
        message: `Check out this voice note: ${voiceNoteTitle}`,
        url: `https://yourapp.com/voicenote/${voiceNoteId}`,
      });
    }
  }, [voiceNoteId, voiceNoteTitle]);
  
  return {
    isShared,
    sharesCount,
    isLoading,
    isProcessing,
    shareScale,
    sharePulse,
    handleSharePress,
    handleShareCountLongPress,
  };
}; 