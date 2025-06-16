import { useState, useEffect } from 'react';
import { getComments } from '../../../services/api/voiceNoteService';

export interface Comment {
  id: string;
  voice_note_id?: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    id?: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
  };
}

interface CommentsFetchState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

interface CommentsFetchActions {
  fetchComments: () => Promise<void>;
  addCommentToList: (comment: Comment) => void;
  clearComments: () => void;
  refreshComments: () => Promise<void>;
}

interface CommentsFetchProps {
  voiceNoteId: string;
  visible: boolean;
}

export const useCommentsFetch = ({
  voiceNoteId,
  visible,
}: CommentsFetchProps): CommentsFetchState & CommentsFetchActions => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments when component becomes visible
  useEffect(() => {
    if (visible && voiceNoteId) {
      fetchComments();
    } else if (!visible) {
      // Clear error when modal closes
      setError(null);
    }
  }, [visible, voiceNoteId]);

  const fetchComments = async () => {
    if (!voiceNoteId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await getComments(voiceNoteId);
      if (response && typeof response === 'object' && 'data' in response) {
        setComments(response.data as Comment[]);
      } else {
        // Handle case where response format is unexpected
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addCommentToList = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const clearComments = () => {
    setComments([]);
    setError(null);
  };

  const refreshComments = async () => {
    await fetchComments();
  };

  return {
    // State
    comments,
    loading,
    error,

    // Actions
    fetchComments,
    addCommentToList,
    clearComments,
    refreshComments,
  };
}; 