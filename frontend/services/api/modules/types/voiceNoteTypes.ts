/**
 * Voice Note type definitions
 */

export interface VoiceNote {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  audio_url: string;
  duration: number;
  transcript?: string;
  created_at: string;
  updated_at: string;
  is_shared?: boolean;
  shared_at?: string;
  original_voice_note_id?: string;
  users?: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string;
  is_verified?: boolean;
}

export interface VoiceNoteStats {
  likes: number;
  comments: number;
  plays: number;
  shares: number;
}

export interface Comment {
  id: string;
  voice_note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: UserProfile;
}

export interface CreateVoiceNoteData {
  title?: string;
  description?: string;
  audio_url: string;
  duration: number;
  transcript?: string;
}

export interface UpdateVoiceNoteData {
  title?: string;
  description?: string;
  transcript?: string;
}

export interface CreateCommentData {
  content: string;
  user_id: string;
}

export interface FeedParams {
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'popular';
}

export interface LikeStatus {
  liked: boolean;
}

export interface ShareStatus {
  isShared: boolean;
}

export interface ShareCount {
  count: number;
}

export interface FeedDiagnostics {
  userCheck: {
    userId: string;
    isLoggedIn: boolean;
  };
  followData: {
    follows: Array<{ id: string; username: string }>;
  };
  feedTrace: {
    totalPostsCount: number;
    filteredPostsCount: number;
  };
  summary: {
    isFollowingAnyone: boolean;
    shouldHaveEmptyFeed: boolean;
    followingCount: number;
    postsAvailable: number;
    postsFromFollowedUsers: number;
    potentialIssues: string[];
  };
} 