import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 
  'http://localhost:3000';

// Storage keys
export const TOKEN_KEY = '@ripply_auth_token';
export const USER_KEY = '@ripply_user';

// API Endpoints
export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  CURRENT_USER: '/api/auth/me',
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
  VOICE_NOTE_SHARE: (voiceNoteId: string) => `/api/voice-notes/${voiceNoteId}/share`,
  VOICE_NOTE_REPOST: (voiceNoteId: string) => `/api/voice-notes/${voiceNoteId}/share`,
  CHECK_LIKE_STATUS: (id: string) => `/api/voice-notes/${id}/likes/check`,
  CHECK_SHARE_STATUS: (id: string) => `/api/voice-notes/${id}/shares/check`,

  // Feed endpoints
  FEED: '/api/voice-notes',
  PERSONALIZED_FEED: (userId: string) => `/api/voice-notes/feed/${userId}`,
  
  // Discovery endpoints
  DISCOVERY_POSTS: (userId: string) => `/api/voice-notes/discovery/posts/${userId}`,
  DISCOVERY_USERS: (userId: string) => `/api/voice-notes/discovery/users/${userId}`,

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
  VOICE_NOTE_SHARES: (voiceNoteId: string) => `/api/voice-notes/${voiceNoteId}/shares`,
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

// Get stored user data
export const getStoredUser = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting stored user data:', error);
    return null;
  }
};

// Set stored user data
export const setStoredUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting stored user data:', error);
  }
};

// Remove stored user data
export const removeStoredUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing stored user data:', error);
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
  
  // Log feed-related requests for debugging  
  const isFeedRelated = endpoint.includes('/feed') || endpoint.includes('/voice-notes');
  const isShareRelated = endpoint.includes('/share') || endpoint.includes('/repost');
  const isProfileUpdate = endpoint.includes('/users/') && method === 'PUT';
  
  if (isFeedRelated) {
    console.log(`🚨 API CONFIG - Feed request: ${method} ${url}`);
    console.log(`🚨 API CONFIG - API_BASE_URL: ${API_BASE_URL}`);
    console.log(`🚨 API CONFIG - Endpoint: ${endpoint}`);
  }
  
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
        console.log("[SHARE DEBUG] API Request - Auth token present");
      }
    } else {
      // If auth is required but no token is found, throw an error
      const error = {
        status: 401,
        message: "Authentication token not found. Please log in again.",
        data: null,
      };
      if (isShareRelated) {
        console.log(`[SHARE DEBUG] API Request - No auth token found`);
      }
      throw error; // Stop the request
    }
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Include credentials for CORS requests
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

    // Handle non-ok responses
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // If the error is 401 Unauthorized, clear token and force re-login
      if (response.status === 401) {
        await removeAuthToken();
        await removeStoredUser();
        // In an Expo app, we shouldn't force a page redirect here
        // Instead, let the UserContext handle the authentication state
        // The RequireAuth component will handle the proper redirect
        console.log("[API CONFIG] 401 Unauthorized - Cleared auth data, UserContext will handle redirect");
      }
      
      // Try to get error details from response body
      try {
        const errorText = await response.text();
        
        // Try to parse as JSON first
        try {
          const errorData = JSON.parse(errorText);
          throw { 
            status: response.status, 
            message: errorData.message || errorData.error || errorMessage,
            data: errorData 
          };
        } catch (parseError) {
          // If not JSON, use the text response
          throw { 
            status: response.status, 
            message: errorText || errorMessage,
            data: null 
          };
        }
      } catch (textError) {
        throw { 
          status: response.status, 
          message: errorMessage,
          data: null 
        };
      }
    }

    // Handle successful responses
    const responseText = await response.text();
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      return responseText as T;
    }

  } catch (error: any) {
    if (isShareRelated) {
      console.error(`[SHARE DEBUG] API Error:`, error);
    }
    
    // Re-throw the error for handling by the caller
    throw error;
  }
}; 