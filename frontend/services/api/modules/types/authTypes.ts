/**
 * Authentication type definitions
 */

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
  timestamp?: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  message?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenVerificationResponse {
  valid: boolean;
  user?: AuthUser;
  message?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  message?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export interface SecureCredentials extends LoginCredentials {
  timestamp: number;
}

export interface SecureRegisterData extends RegisterData {
  timestamp: number;
} 