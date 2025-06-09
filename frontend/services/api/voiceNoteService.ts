/**
 * Voice Note Service
 * 
 * This file now serves as a facade for modularized voice note API functions.
 * It imports and re-exports all functions from the modules directory for backward compatibility.
 */

// Import all modules
import * as VoiceNoteModules from './modules';

// Re-export all functions
export const {
  // Core voice note API
  getVoiceNoteById,
  createVoiceNote,
  updateVoiceNote,
  deleteVoiceNote,
  getVoiceNotes,
  getUserVoiceNotes,
  
  // Feed API
  getPersonalizedFeed,
  runFeedDiagnostics,
  
  // Interaction API
  likeVoiceNote,
  unlikeVoiceNote,
  checkLikeStatus,
  addComment,
  getComments,
  recordPlay,
  recordShare,
  checkShareStatus,
  getShareCount,
  getVoiceNoteStats
} = VoiceNoteModules;

// Define interfaces for type safety
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

export interface FeedItem {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  userAvatar: string | null;
  timePosted: string;
  isShared: boolean;
  sharedBy?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
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