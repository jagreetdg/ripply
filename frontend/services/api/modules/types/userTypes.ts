/**
 * TypeScript interfaces for user-related data
 */

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  stats?: UserStats;
  email: string;
  cover_photo_url?: string | null;
}

export interface UserStats {
  follower_count: number;
  following_count: number;
  voice_notes_count: number;
}

export interface UserPhoto {
  id: string;
  url: string;
  type: 'avatar' | 'cover' | 'profile';
  created_at: string;
}

export interface FollowRelationship {
  id: string;
  follower_id: string;
  followee_id: string;
  created_at: string;
  users?: User;
}

// VoiceNote interface is defined in voiceNoteTypes.ts to avoid duplication

export interface FollowResponse {
  success: boolean;
  data?: FollowRelationship;
  message?: string;
}

export interface IsFollowingResponse {
  isFollowing: boolean;
}

export interface CountResponse {
  count: number;
}

export interface UpdateUserProfileParams {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  cover_photo_url?: string | null;
  is_verified?: boolean;
}

export interface UpdateUserPhotosParams {
  photos: UserPhoto[];
} 