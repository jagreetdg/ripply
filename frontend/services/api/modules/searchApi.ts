/**
 * Search API functions
 */
import { ENDPOINTS, apiRequest } from '../config';

export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  type?: 'users' | 'voice_notes' | 'all';
}

export interface SearchResults {
  users: any[];
  voice_notes: any[];
  total: number;
}

/**
 * Search for users and voice notes
 */
export const search = async (params: SearchParams): Promise<SearchResults> => {
  try {
    const queryString = new URLSearchParams(params as any).toString();
    const endpoint = `/api/search?${queryString}`;
    
    const response = await apiRequest(endpoint);
    
    return {
      users: response.users || [],
      voice_notes: response.voice_notes || [],
      total: (response.users?.length || 0) + (response.voice_notes?.length || 0)
    };
  } catch (error) {
    console.error('Error performing search:', error);
    return { users: [], voice_notes: [], total: 0 };
  }
};

/**
 * Search for users only
 */
export const searchUsers = async (query: string, limit = 20, offset = 0) => {
  try {
    const params = new URLSearchParams({
      query,
      type: 'users',
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    const response = await apiRequest(`/api/search?${params}`);
    return response.users || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Search for voice notes only
 */
export const searchVoiceNotes = async (query: string, limit = 20, offset = 0) => {
  try {
    const params = new URLSearchParams({
      query,
      type: 'voice_notes',
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    const response = await apiRequest(`/api/search?${params}`);
    return response.voice_notes || [];
  } catch (error) {
    console.error('Error searching voice notes:', error);
    return [];
  }
};

/**
 * Get trending searches
 */
export const getTrendingSearches = async () => {
  try {
    const response = await apiRequest('/api/search/trending');
    return response.trending || [];
  } catch (error) {
    console.error('Error getting trending searches:', error);
    return [];
  }
};

/**
 * Get search suggestions
 */
export const getSearchSuggestions = async (query: string) => {
  try {
    const params = new URLSearchParams({ query });
    const response = await apiRequest(`/api/search/suggestions?${params}`);
    return response.suggestions || [];
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}; 