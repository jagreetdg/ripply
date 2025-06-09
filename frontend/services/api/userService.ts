/**
 * User service compatibility layer
 * This file provides backward compatibility with the original userService.js
 * It imports functionality from the modular TypeScript files
 */

// Import all functionality from the modular API modules
import * as userAPI from './modules/userApi';

// Re-export all functions for backward compatibility
export const {
  // Profile-related functions
  getUserProfile,
  updateUserProfile,
  getUserProfileByUsername,
  updateUserVerificationStatus,
  updateUserPhotos,
  
  // Relationship-related functions
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  getFollowerCount,
  getFollowingCount,
  isFollowing,
  
  // Content-related functions
  getUserVoiceNotes,
  getUserSharedVoiceNotes,
  debugFollowsSchema
} = userAPI; 