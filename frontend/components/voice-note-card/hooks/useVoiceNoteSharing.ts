import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Alert, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { hasUserRepostedVoiceNote, toggleRepost, getRepostCount } from '../../../services/api';
import { useToast } from '../../common/Toast';

interface VoiceNoteSharingProps {
  voiceNote: {
    id: string;
    title?: string;
    shares?: number;
  };
  userId?: string;
  isReposted?: boolean;
  isLoadingRepostStatus?: boolean;
  onShareStatusChanged?: (voiceNoteId: string, isShared: boolean) => void;
  onVoiceNoteUnshared?: (voiceNoteId: string) => void;
}

interface SharingState {
  sharesCount: number;
  isLoadingShareCount: boolean;
  isRepostedEffective: boolean;
  shareScale: Animated.Value;
  sharePulse: Animated.Value;
  internalRepostedState: boolean;
  hasUserInteracted: boolean;
}

interface SharingActions {
  handleRepostPress: () => Promise<void>;
  handleShareCountLongPress: () => void;
  fetchShareCount: () => Promise<void>;
  logShareState: (context: string) => void;
  setSharesCount: (count: number) => void;
}

export const useVoiceNoteSharing = ({
  voiceNote,
  userId,
  isReposted: isRepostedProp,
  isLoadingRepostStatus = false,
  onShareStatusChanged,
  onVoiceNoteUnshared,
}: VoiceNoteSharingProps): SharingState & SharingActions => {
  const router = useRouter();
  const { showToast } = useToast();

  // Sharing state
  const [sharesCount, setSharesCount] = useState(
    typeof voiceNote.shares === 'number' && voiceNote.shares > 0 ? voiceNote.shares : 0
  );
  const [isLoadingShareCount, setIsLoadingShareCount] = useState(false);

  // Internal state for repost status (when user interacts)
  const [internalRepostedState, setInternalRepostedState] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);

  // Determine effective repost status - prioritize user interactions
  const isRepostedEffective = isLoadingRepostStatus
    ? false
    : hasUserInteracted 
      ? internalRepostedState
      : Boolean(isRepostedProp !== undefined ? isRepostedProp : internalRepostedState);

  // Animation refs for sharing
  const shareScale = useRef(new Animated.Value(1)).current;
  const sharePulse = useRef(new Animated.Value(1)).current;

  // Add comprehensive state logging for debugging
  const logShareState = useCallback((context: string) => {
    console.log(`[SHARE DEBUG] State Snapshot - ${context}:`, {
      voiceNoteId: voiceNote.id,
      // State values
      sharesCount,
      isLoadingShareCount,
      isRepostedEffective,
      internalRepostedState,
      hasUserInteracted,
      // Props
      isRepostedProp,
      isLoadingRepostStatus,
      // User
      userId,
      // Voice note data
      voiceNoteShares: voiceNote.shares,
      voiceNoteIsShared: (voiceNote as any).is_shared
    });
  }, [
    voiceNote.id, 
    voiceNote.shares, 
    (voiceNote as any).is_shared,
    sharesCount,
    isLoadingShareCount,
    isRepostedEffective,
    internalRepostedState,
    hasUserInteracted,
    isRepostedProp,
    isLoadingRepostStatus,
    userId
  ]);

  // Handle repost press with optimistic updates
  // Handle repost press with optimistic updates
  // OPTIMISTIC UPDATE PATTERN:
  // 1. Immediately update UI (share count + icon highlight)
  // 2. Make API request in background
  // 3. On SUCCESS: Only update if server response differs (prevents flickering)
  // 4. On FAILURE: Revert to original state and show error message
  const handleRepostPress = useCallback(async () => {
    if (!userId) {
      console.log('[SHARE DEBUG] handleRepostPress - No logged in user, showing alert');
      Alert.alert('Please log in', 'You need to be logged in to repost voice notes.');
      return;
    }

    // Store original values for potential rollback
    const originalRepostedState = isRepostedEffective;
    const originalSharesCount = sharesCount;
    const originalHasUserInteracted = hasUserInteracted;

    // STEP 1: OPTIMISTIC UPDATE - Immediately update UI
    const newRepostedState = !isRepostedEffective;
    const newSharesCount = newRepostedState ? sharesCount + 1 : Math.max(0, sharesCount - 1);
    
    setHasUserInteracted(true);
    setInternalRepostedState(newRepostedState);
    setSharesCount(newSharesCount);

    logShareState('Optimistic Update Applied');

    console.log('[SHARE DEBUG] handleRepostPress - Optimistic update:', {
      voiceNoteId: voiceNote.id,
      userId: userId,
      oldState: originalRepostedState,
      newState: newRepostedState,
      oldCount: originalSharesCount,
      newCount: newSharesCount
    });

    // Enhanced share button animation with scale and pulse effects
    const scaleAnimation = Animated.sequence([
      Animated.timing(shareScale, {
        toValue: 1.35,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(shareScale, {
        toValue: 1,
        tension: 220,
        friction: 9,
        useNativeDriver: true,
      }),
    ]);

    // Pulse effect for state change
    const pulseAnimation = Animated.sequence([
      Animated.timing(sharePulse, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(sharePulse, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);

    // Start animations immediately
    Animated.parallel([scaleAnimation, pulseAnimation]).start();

    // STEP 2: API REQUEST - Make API call in background
    try {
      console.log('[SHARE DEBUG] handleRepostPress - Calling toggleRepost API');
      const result = await toggleRepost(voiceNote.id, userId);
      console.log('[SHARE DEBUG] handleRepostPress - toggleRepost result:', result);
      
      // STEP 3: SUCCESS - Only update if the server response differs from our optimistic update
      // This prevents unnecessary state changes that cause visual flickering
      let hasServerDifference = false;
      const serverRepostedState = result.isReposted;
      
      // Update with server response if different from optimistic update
      if (serverRepostedState !== newRepostedState) {
        console.log('[SHARE DEBUG] handleRepostPress - Server state differs, updating:', {
          optimistic: newRepostedState,
          server: serverRepostedState
        });
        setInternalRepostedState(serverRepostedState);
        hasServerDifference = true;
      }
      
      // Update share count from API response (this is the authoritative count)
      if (typeof result.repostCount === 'number' && result.repostCount !== newSharesCount) {
        console.log('[SHARE DEBUG] handleRepostPress - Server count differs, updating:', {
          optimistic: newSharesCount,
          server: result.repostCount
        });
        setSharesCount(result.repostCount);
        hasServerDifference = true;
      }
      
      if (!hasServerDifference) {
        console.log('[SHARE DEBUG] handleRepostPress - Server response matches optimistic update, no changes needed');
      }
      
      if (onShareStatusChanged) {
        console.log('[SHARE DEBUG] handleRepostPress - Calling onShareStatusChanged callback');
        onShareStatusChanged(voiceNote.id, serverRepostedState);
      }

      if (!serverRepostedState && onVoiceNoteUnshared) {
        console.log('[SHARE DEBUG] handleRepostPress - Voice note unshared, calling callback');
        onVoiceNoteUnshared(voiceNote.id);
      }

      console.log('[SHARE DEBUG] handleRepostPress - Share toggle completed successfully');
      logShareState('After handleRepostPress');
    } catch (error) {
      console.error('[SHARE DEBUG] handleRepostPress - Error:', {
        voiceNoteId: voiceNote.id,
        userId: userId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // STEP 4: FAILURE - Revert optimistic update on error only
      console.log('[SHARE DEBUG] handleRepostPress - Rolling back optimistic update due to error');
      setHasUserInteracted(originalHasUserInteracted);
      setInternalRepostedState(originalRepostedState);
      setSharesCount(originalSharesCount);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Failed to ${originalRepostedState ? 'unshare' : 'share'}: ${errorMessage}`, 'error');
      
      logShareState('After Rollback');
    }
  }, [userId, shareScale, sharePulse, voiceNote.id, isRepostedEffective, sharesCount, hasUserInteracted, onShareStatusChanged, onVoiceNoteUnshared, logShareState, showToast]);

  // Handle share count long press
  const handleShareCountLongPress = useCallback(() => {
    if (Platform.OS === 'web') {
      const url = `${window.location.origin}/voicenote/${voiceNote.id}`;
      navigator.clipboard.writeText(url);
      Alert.alert('Link copied', 'Voice note link copied to clipboard!');
    } else {
      Share.share({
        message: `Check out this voice note: ${voiceNote.title}`,
        url: `https://yourapp.com/voicenote/${voiceNote.id}`,
      });
    }
  }, [voiceNote.id, voiceNote.title]);

  // Fetch the actual share count
  const fetchShareCount = useCallback(async () => {
    if (!voiceNote.id) {
      console.log('[SHARE DEBUG] fetchShareCount - No voice note ID, skipping');
      return;
    }

    logShareState('Before fetchShareCount');

    try {
      console.log('[SHARE DEBUG] fetchShareCount - Starting for voice note:', voiceNote.id);
      setIsLoadingShareCount(true);
      const count = await getRepostCount(voiceNote.id);
      console.log('[SHARE DEBUG] fetchShareCount - Received count:', { voiceNoteId: voiceNote.id, count });
      setSharesCount(typeof count === 'number' ? count : 0);
      console.log('[SHARE DEBUG] fetchShareCount - Share count state updated:', typeof count === 'number' ? count : 0);
      
      logShareState('After fetchShareCount');
    } catch (error) {
      console.error('[SHARE DEBUG] fetchShareCount - Error:', {
        voiceNoteId: voiceNote.id,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoadingShareCount(false);
      console.log('[SHARE DEBUG] fetchShareCount - Loading state set to false');
    }
  }, [voiceNote.id, logShareState]);

  // Sync with props when user hasn't interacted yet
  useEffect(() => {
    if (!hasUserInteracted && isRepostedProp !== undefined) {
      setInternalRepostedState(Boolean(isRepostedProp));
    }
  }, [isRepostedProp, hasUserInteracted]);

  // Reset interaction flag when voice note changes
  useEffect(() => {
    setHasUserInteracted(false);
    setInternalRepostedState(Boolean(isRepostedProp));
  }, [voiceNote.id, isRepostedProp]);

  // Log state changes for debugging
  useEffect(() => {
    logShareState('State Change');
  }, [sharesCount, isRepostedEffective, logShareState]);

  // Load initial repost status
  useEffect(() => {
    if (!voiceNote.id || !userId || isRepostedProp !== undefined) return;

    const loadRepostStatus = async () => {
      try {
        console.log('[SHARE DEBUG] Loading initial repost status from API');
        const repostStatus = await hasUserRepostedVoiceNote(voiceNote.id, userId);
        console.log('[SHARE DEBUG] Initial repost status from API:', repostStatus);
        setInternalRepostedState(repostStatus);
      } catch (error) {
        console.error('[SHARE DEBUG] Error loading initial repost status:', error);
      }
    };

    loadRepostStatus();
  }, [voiceNote.id, userId, isRepostedProp]);

  return {
    // State
    sharesCount,
    isLoadingShareCount,
    isRepostedEffective,
    shareScale,
    sharePulse,
    internalRepostedState,
    hasUserInteracted,

    // Actions
    handleRepostPress,
    handleShareCountLongPress,
    fetchShareCount,
    logShareState,
    setSharesCount,
  };
}; 