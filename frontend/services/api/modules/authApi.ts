/**
 * Authentication API functions
 */
import { apiRequest } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Storage keys
const TOKEN_KEY = '@ripply_auth_token';
const USER_KEY = '@ripply_user';

// Auth endpoints
const AUTH_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  VERIFY_TOKEN: '/api/auth/verify-token',
  CHECK_USERNAME: '/api/auth/check-username',
  CHECK_EMAIL: '/api/auth/check-email',
};

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  user: any;
  message?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  message?: string;
}

/**
 * Hash a password client-side before sending to server
 */
async function hashPasswordForTransport(password: string): Promise<string> {
  const hashBuffer = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hashBuffer;
}

/**
 * Register a new user
 */
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const secureUserData = { ...userData };
    
    if (secureUserData.password) {
      secureUserData.password = await hashPasswordForTransport(secureUserData.password);
    }
    
    const response = await apiRequest(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ ...secureUserData, timestamp: Date.now() }),
    });
    
    if (response.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login a user
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('Login attempt with credentials:', { 
      email: credentials.email, 
      passwordLength: credentials.password?.length, 
      rememberMe: credentials.rememberMe 
    });
    
    const secureCredentials = { ...credentials };
    
    if (secureCredentials.password) {
      secureCredentials.password = await hashPasswordForTransport(secureCredentials.password);
    }
    
    const response = await apiRequest(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ ...secureCredentials, timestamp: Date.now() }),
    });
    
    if (response && response.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (username: string): Promise<AvailabilityResponse> => {
  try {
    const response = await apiRequest(`${AUTH_ENDPOINTS.CHECK_USERNAME}/${username}`);
    return response;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

/**
 * Check if an email is available
 */
export const checkEmailAvailability = async (email: string): Promise<AvailabilityResponse> => {
  try {
    const response = await apiRequest(`${AUTH_ENDPOINTS.CHECK_EMAIL}/${email}`);
    return response;
  } catch (error) {
    console.error('Error checking email availability:', error);
    throw error;
  }
};

/**
 * Logout the current user
 */
export const logoutUser = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    const response = await apiRequest(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    
    throw error;
  }
};

/**
 * Verify the current auth token
 */
export const verifyToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await apiRequest(AUTH_ENDPOINTS.VERIFY_TOKEN, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return response;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
};

/**
 * Get the current user from storage
 */
export const getCurrentUser = async () => {
  try {
    const userString = await AsyncStorage.getItem(USER_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}; 