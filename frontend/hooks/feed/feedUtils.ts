/**
 * Utility functions for feed data
 */
import { FeedItem, VoiceNote } from './types';

/**
 * Check if a string is a UUID
 * @param id - String to check
 * @returns True if the string is a valid UUID
 */
export const isUUID = (id: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
};

/**
 * Format raw voice note data into a consistent FeedItem structure
 * @param item - Raw voice note data from API
 * @returns Formatted FeedItem
 */
export const formatVoiceNote = (item: any): FeedItem => {
  // Default user data fallbacks
  const userData = item.users || {};
  
  // Create a consistent feed item structure
  const feedItem: FeedItem = {
    id: item.id,
    userId: item.user_id || userData.id || '',
    displayName: userData.display_name || 'Unknown',
    username: userData.username || 'user',
    userAvatar: userData.avatar_url,
    timePosted: item.created_at || new Date().toISOString(),
    isShared: item.is_shared || false,
    sharedBy: item.shared_by ? {
      id: item.shared_by.id,
      username: item.shared_by.username,
      displayName: item.shared_by.display_name,
      avatarUrl: item.shared_by.avatar_url
    } : null,
    voiceNote: {
      id: item.id,
      duration: item.duration || 0,
      title: item.title || '',
      likes: typeof item.likes === 'number' ? item.likes : 0,
      comments: typeof item.comments === 'number' ? item.comments : 0,
      plays: typeof item.plays === 'number' ? item.plays : 0,
      shares: typeof item.shares === 'number' ? item.shares : 0,
      backgroundImage: item.background_image || item.backgroundImage || null,
      tags: item.tags || [],
      users: userData
    }
  };
  
  return feedItem;
}; 