/**
 * Discovery API functions for trending/popular content
 */
import { ENDPOINTS, apiRequest } from '../config';
import { VoiceNote } from '../../../components/voice-note-card/VoiceNoteCardTypes';

export interface DiscoveryPost extends VoiceNote {
  discoveryScore?: number;
}

export interface DiscoveryUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  follower_count?: number;
  following_count?: number;
  voice_note_count?: number;
  discoveryScore?: number;
}

/**
 * Get discovery posts (personalized popular posts)
 */
export const getDiscoveryPosts = async (userId: string): Promise<DiscoveryPost[]> => {
  try {
    const response = await apiRequest<DiscoveryPost[]>(
      ENDPOINTS.DISCOVERY_POSTS(userId)
    );
    return response || [];
  } catch (error) {
    console.error('Error fetching discovery posts:', error);
    return [];
  }
};

/**
 * Get discovery users (trending creators)
 */
export const getDiscoveryUsers = async (userId: string): Promise<DiscoveryUser[]> => {
  try {
    const response = await apiRequest<DiscoveryUser[]>(
      ENDPOINTS.DISCOVERY_USERS(userId)
    );
    return response || [];
  } catch (error) {
    console.error('Error fetching discovery users:', error);
    return [];
  }
}; 