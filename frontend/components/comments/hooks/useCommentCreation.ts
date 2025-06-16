import { useState, useRef, useEffect } from 'react';
import { TextInput, Alert } from 'react-native';
import { addComment } from '../../../services/api/voiceNoteService';
import { Comment } from './useCommentsFetch';

interface CommentCreationState {
  newComment: string;
  submitting: boolean;
  textInputRef: React.RefObject<TextInput>;
}

interface CommentCreationActions {
  setNewComment: (comment: string) => void;
  handleAddComment: () => Promise<void>;
  clearComment: () => void;
  focusInput: () => void;
}

interface CommentCreationProps {
  voiceNoteId: string;
  loggedInUserId?: string;
  visible: boolean;
  onCommentAdded?: (comment: Comment) => void;
  onCommentCreated?: (comment: Comment) => void;
}

export const useCommentCreation = ({
  voiceNoteId,
  loggedInUserId,
  visible,
  onCommentAdded,
  onCommentCreated,
}: CommentCreationProps): CommentCreationState & CommentCreationActions => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    } else {
      // Clear comment when modal closes
      setNewComment('');
    }
  }, [visible]);

  const validateComment = (): boolean => {
    if (!newComment.trim()) {
      return false;
    }

    if (!loggedInUserId) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to comment on voice notes.'
      );
      return false;
    }

    if (!voiceNoteId) {
      console.error('No voice note ID provided');
      Alert.alert('Error', 'Unable to add comment. Voice note not found.');
      return false;
    }

    return true;
  };

  const handleAddComment = async () => {
    if (!validateComment()) return;

    setSubmitting(true);
    try {
      const response = await addComment(
        voiceNoteId,
        loggedInUserId!,
        newComment.trim()
      );

      if (response) {
        const newCommentData = response as Comment;
        
        // Clear the input
        setNewComment('');
        
        // Notify parent components
        onCommentAdded?.(newCommentData);
        onCommentCreated?.(newCommentData);
        
        // Optionally refocus input for quick successive comments
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearComment = () => {
    setNewComment('');
  };

  const focusInput = () => {
    textInputRef.current?.focus();
  };

  return {
    // State
    newComment,
    submitting,
    textInputRef,

    // Actions
    setNewComment,
    handleAddComment,
    clearComment,
    focusInput,
  };
}; 