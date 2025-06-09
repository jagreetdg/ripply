import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  'https://ripply-backend.onrender.com';

// Storage keys
export const TOKEN_KEY = '@ripply_auth_token';

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  CURRENT_USER: '/api/users/me',
  VERIFY_TOKEN: '/api/auth/verify-token',
  CHECK_USERNAME: '/api/auth/check-username',
  CHECK_EMAIL: '/api/auth/check-email',

  // User endpoints
  USERS: '/api/users',
  USER_PROFILE: (userId: string) => `/api/users/${userId}`,
  USER_VOICE_NOTES: (userId: string) => `/api/users/${userId}/voice-notes`,
  USER_FOLLOWERS: (userId: string) => `/api/users/${userId}/followers`,
  USER_FOLLOWING: (userId: string) => `/api/users/${userId}/following`,
  FOLLOW_USER: (userId: string) => `/api/users/${userId}/follow`,
  UNFOLLOW_USER: (userId: string) => `/api/users/${userId}/unfollow`,

  // Voice Note endpoints
  VOICE_NOTES: '/api/voice-notes',
  VOICE_NOTE: (id: string) => `/api/voice-notes/${id}`,
  VOICE_NOTE_LIKE: (id: string) => `/api/voice-notes/${id}/like`,
  VOICE_NOTE_UNLIKE: (id: string) => `/api/voice-notes/${id}/unlike`,
  VOICE_NOTE_COMMENTS: (id: string) => `/api/voice-notes/${id}/comments`,
  VOICE_NOTE_PLAY: (id: string) => `/api/voice-notes/${id}/play`,
  VOICE_NOTE_SHARE: (id: string) => `/api/voice-notes/${id}/share`,
  VOICE_NOTE_REPOST: (id: string) => `/api/voice-notes/${id}/share`,
  CHECK_LIKE_STATUS: (id: string) => `/api/voice-notes/${id}/likes/check`,
  CHECK_SHARE_STATUS: (id: string) => `/api/voice-notes/${id}/shares/check`,

  // Feed endpoints
  FEED: '/api/voice-notes',
  PERSONALIZED_FEED: (userId: string) => `/api/voice-notes/feed/${userId}`,

  // Search endpoints
  SEARCH: '/api/users/search',
  SEARCH_USERS: '/api/users/search',
  SEARCH_VOICE_NOTES: '/api/voice-notes/search',

  // Voice Bio endpoints
  VOICE_BIO: (userId: string) => `/api/voice-bios/${userId}`,

  // Password Reset endpoints
  REQUEST_PASSWORD_RESET: '/api/password-reset/request-reset',
  RESET_PASSWORD: '/api/password-reset/reset-password',

  // Email Verification endpoints
  REQUEST_EMAIL_VERIFICATION: '/api/verification/request-verification',
  VERIFY_EMAIL: '/api/verification/verify-email',

  // Additional User endpoints
  USER_PHOTOS: (userId: string) => `/api/users/${userId}/photos`,
  USER_VERIFY: (userId: string) => `/api/users/${userId}/verify`,
  IS_FOLLOWING: (userId: string, followerId: string) => `/api/users/${userId}/is-following/${followerId}`,
  FOLLOWER_COUNT: (userId: string) => `/api/users/${userId}/follower-count`,
  FOLLOWING_COUNT: (userId: string) => `/api/users/${userId}/following-count`,
  USER_SHARED_VOICE_NOTES: (userId: string) => `/api/users/${userId}/shared-voice-notes`,
  USER_BY_USERNAME: (username: string) => `/api/users/username/${username}`,

  // Additional Voice Note endpoints  
  VOICE_NOTE_LIKES: (id: string) => `/api/voice-notes/${id}/likes`,
  VOICE_NOTE_TAGS: (id: string) => `/api/voice-notes/${id}/tags`,
  VOICE_NOTES_BY_TAG: (tagName: string) => `/api/voice-notes/tags/${tagName}`,
  VOICE_NOTE_SHARES: (id: string) => `/api/voice-notes/${id}/shares`,
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
  
  // Log share-related requests for debugging
  const isShareRelated = endpoint.includes('/share') || endpoint.includes('/repost');
  if (isShareRelated) {
    console.log(`[SHARE DEBUG] API Request - ${method} ${url}`);
    if (body) {
      console.log(`[SHARE DEBUG] API Request Body:`, JSON.stringify(body, null, 2));
    }
  }
  
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
      if (isShareRelated) {
        console.log(`[SHARE DEBUG] API Request - Auth token present: ${token.substring(0, 20)}...`);
      }
    } else if (isShareRelated) {
      console.log(`[SHARE DEBUG] API Request - No auth token found`);
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
    const response = await fetch(url, requestOptions);
    
    if (isShareRelated) {
      console.log(`[SHARE DEBUG] API Response - Status: ${response.status} ${response.statusText}`);
    }
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        const errorText = await response.text();
        if (isShareRelated) {
          console.error(`[SHARE DEBUG] API Error - Non-JSON response:`, errorText);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseText = await response.text();
      if (isShareRelated) {
        console.log(`[SHARE DEBUG] API Response - Text:`, responseText);
      }
      return responseText as unknown as T;
    }

    const data = await response.json();
    
    if (isShareRelated) {
      console.log(`[SHARE DEBUG] API Response - Data:`, JSON.stringify(data, null, 2));
    }

    if (!response.ok) {
      if (isShareRelated) {
        console.error(`[SHARE DEBUG] API Error - HTTP ${response.status}:`, data);
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (isShareRelated) {
      console.error(`[SHARE DEBUG] API Request Failed:`, {
        method,
        url,
        error: error instanceof Error ? error.message : String(error)
      });
    }
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