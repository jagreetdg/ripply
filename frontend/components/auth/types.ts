/**
 * Authentication types and interfaces
 */

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  cover_photo_url?: string | null;
  bio?: string | null;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  message?: string;
}

export type AuthType = "login" | "signup";

export type PasswordStrength = "weak" | "medium" | "strong" | null;

export interface AuthFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
}

export interface AuthFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export interface AuthValidationState {
  usernameAvailable: boolean | null;
  emailAvailable: boolean | null;
  isCheckingUsername: boolean;
  isCheckingEmail: boolean;
}

export interface AuthFocusState {
  username: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  type: AuthType;
  onSwitchToLogin?: () => void;
  onSwitchToSignup?: () => void;
} 