/**
 * Authentication validation utilities
 */

import { PasswordStrength } from '../types';

/**
 * Validates username format
 * Username must be at least 5 characters and only contain alphanumeric characters and underscores
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
  return usernameRegex.test(username);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks password strength based on complexity and length
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
  // Password must be at least 8 characters
  if (password.length < 8) return "weak";

  // Check for complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':",.<>/?]/.test(password);

  const complexity = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  if (complexity >= 3 && password.length >= 10) return "strong";
  if (complexity >= 2 && password.length >= 8) return "medium";
  return "weak";
};

/**
 * Validates password confirmation
 */
export const isPasswordConfirmationValid = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Gets password strength color
 */
export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case "weak":
      return "#FF6B6B";
    case "medium":
      return "#FFD93D";
    case "strong":
      return "#6BCF7F";
    default:
      return "#E0E0E0";
  }
};

/**
 * Gets password strength text
 */
export const getPasswordStrengthText = (strength: PasswordStrength): string => {
  switch (strength) {
    case "weak":
      return "Weak";
    case "medium":
      return "Medium";
    case "strong":
      return "Strong";
    default:
      return "";
  }
}; 