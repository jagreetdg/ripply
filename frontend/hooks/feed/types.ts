/**
 * Types for feed-related data
 */

/**
 * Voice note data structure
 */
export interface VoiceNote {
  id: string;
  title: string;
  duration: number;
  likes: number | { count: number }[];
  comments: number | { count: number }[];
  plays: number | { count: number }[];
  shares?: number;
  backgroundImage?: string | null;
  background_image?: string | null;
  tags?: string[];
  user_id?: string;
  created_at?: string;
  users?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * User profile in shared content
 */
export interface SharedByUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Feed item structure for display in the UI
 */
export interface FeedItem {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  userAvatar: string | null;
  timePosted: string;
  isShared: boolean;
  sharedBy?: SharedByUser | null;
  voiceNote: {
    id: string;
    duration: number;
    title: string;
    likes: number;
    comments: number;
    plays: number;
    shares: number;
    backgroundImage: string | null;
    tags: string[];
    users?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

/**
 * Diagnostic data structure
 */
export interface DiagnosticData {
  userCheck: {
    userId: string;
    isLoggedIn: boolean;
    username: string;
  };
  followData: any;
  feedTrace: any;
  summary: {
    isFollowingAnyone: boolean;
    shouldHaveEmptyFeed: boolean;
    followingCount: number;
    postsAvailable: number;
    postsFromFollowedUsers: number;
    potentialIssues: string[];
  };
} 