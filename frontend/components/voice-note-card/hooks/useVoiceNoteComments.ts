import { useState, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { getComments } from '../../../services/api';
import { Comment, CommentsResponse } from '../VoiceNoteCardTypes';

interface VoiceNoteCommentsProps {
  voiceNote: {
    id: string;
    comments?: number;
  };
}

interface CommentsState {
  showCommentPopup: boolean;
  commentsCount: number;
  comments: Comment[];
  isLoadingComments: boolean;
  commentScale: Animated.Value;
  commentPulse: Animated.Value;
}

interface CommentsActions {
  handleCommentPress: () => void;
  handleCloseCommentPopup: () => void;
  handleCommentAdded: (newComment: Comment) => void;
  fetchComments: () => Promise<void>;
  setCommentsCount: (count: number) => void;
}

export const useVoiceNoteComments = ({
  voiceNote,
}: VoiceNoteCommentsProps): CommentsState & CommentsActions => {
  // Comment state
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    typeof voiceNote.comments === 'number' && voiceNote.comments > 0 ? voiceNote.comments : 0
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Animation refs for comments
  const commentScale = useRef(new Animated.Value(1)).current;
  const commentPulse = useRef(new Animated.Value(1)).current;

  // Fetch comments when needed
  const fetchComments = useCallback(async () => {
    if (!voiceNote.id) return;

    setIsLoadingComments(true);
    try {
      const response = (await getComments(voiceNote.id)) as unknown as CommentsResponse;
      if (response && response.data) {
        setComments(response.data || []);
        setCommentsCount(response.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [voiceNote.id]);

  // Handle comment press with animations
  const handleCommentPress = useCallback(() => {
    setShowCommentPopup(true);
    
    // Enhanced comment button animation
    const scaleAnimation = Animated.sequence([
      Animated.timing(commentScale, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(commentScale, {
        toValue: 1,
        tension: 180,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    // Pulse effect
    const pulseAnimation = Animated.sequence([
      Animated.timing(commentPulse, {
        toValue: 1.15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(commentPulse, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);

    // Start animations
    Animated.parallel([scaleAnimation, pulseAnimation]).start();

    // Fetch comments when opening popup
    fetchComments();
  }, [fetchComments, commentScale, commentPulse]);

  // Handle comment popup close
  const handleCloseCommentPopup = useCallback(() => {
    setShowCommentPopup(false);
  }, []);

  // Handle comment added
  const handleCommentAdded = useCallback((newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
    setCommentsCount(prev => prev + 1);
  }, []);

  return {
    // State
    showCommentPopup,
    commentsCount,
    comments,
    isLoadingComments,
    commentScale,
    commentPulse,

    // Actions
    handleCommentPress,
    handleCloseCommentPopup,
    handleCommentAdded,
    fetchComments,
    setCommentsCount,
  };
}; 