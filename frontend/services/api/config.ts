import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Storage keys
export const TOKEN_KEY = 'auth_token';

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  CURRENT_USER: '/auth/me',
  CHECK_USERNAME: '/auth/check-username',
  CHECK_EMAIL: '/auth/check-email',

  // User endpoints
  USERS: '/users',
  USER_PROFILE: (userId: string) => `/users/${userId}`,
  USER_VOICE_NOTES: (userId: string) => `/users/${userId}/voice-notes`,
  USER_FOLLOWERS: (userId: string) => `/users/${userId}/followers`,
  USER_FOLLOWING: (userId: string) => `/users/${userId}/following`,
  FOLLOW_USER: (userId: string) => `/users/${userId}/follow`,
  UNFOLLOW_USER: (userId: string) => `/users/${userId}/unfollow`,

  // Voice Note endpoints
  VOICE_NOTES: '/voice-notes',
  VOICE_NOTE: (id: string) => `/voice-notes/${id}`,
  VOICE_NOTE_STATS: (id: string) => `/voice-notes/${id}/stats`,
  VOICE_NOTE_LIKE: (id: string) => `/voice-notes/${id}/like`,
  VOICE_NOTE_UNLIKE: (id: string) => `/voice-notes/${id}/unlike`,
  VOICE_NOTE_COMMENTS: (id: string) => `/voice-notes/${id}/comments`,
  VOICE_NOTE_PLAY: (id: string) => `/voice-notes/${id}/play`,
  VOICE_NOTE_SHARE: (id: string) => `/voice-notes/${id}/share`,
  VOICE_NOTE_REPOST: (id: string) => `/voice-notes/${id}/repost`,
  CHECK_LIKE_STATUS: (id: string) => `/voice-notes/${id}/like-status`,
  CHECK_SHARE_STATUS: (id: string) => `/voice-notes/${id}/share-status`,

  // Feed endpoints
  FEED: '/feed',
  PERSONALIZED_FEED: (userId: string) => `/feed/personalized/${userId}`,

  // Search endpoints
  SEARCH: '/search',
  SEARCH_USERS: '/search/users',
  SEARCH_VOICE_NOTES: '/search/voice-notes',

  // Voice Bio endpoints
  VOICE_BIO: (userId: string) => `/users/${userId}/voice-bio`,
  UPLOAD_VOICE_BIO: (userId: string) => `/users/${userId}/voice-bio/upload`,
};

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

// Get auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Set auth token
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

// Remove auth token
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Generic API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    requiresAuth = true,
  } = config;

  const url = `${API_BASE_URL}${endpoint}`;
  
  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    console.log(`[API] ${method} ${url}`);
    
    const response = await fetch(url, requestOptions);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text() as unknown as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${method} ${url}:`, error);
    throw error;
  }
};

// Specialized request methods
export const get = <T = any>(endpoint: string, requiresAuth = true): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'GET', requiresAuth });

export const post = <T = any>(endpoint: string, body?: any, requiresAuth = true): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'POST', body, requiresAuth });

export const put = <T = any>(endpoint: string, body?: any, requiresAuth = true): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'PUT', body, requiresAuth });

export const patch = <T = any>(endpoint: string, body?: any, requiresAuth = true): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'PATCH', body, requiresAuth });

export const del = <T = any>(endpoint: string, requiresAuth = true): Promise<T> =>
  apiRequest<T>(endpoint, { method: 'DELETE', requiresAuth }); 