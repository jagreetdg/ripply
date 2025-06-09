/**
 * Authentication validation utilities
 */

import { PasswordStrength } from '../types';

/**
 * Password strength color constants for consistent theming
 */
const PASSWORD_STRENGTH_COLORS = {
  weak: "#FF6B6B",
  medium: "#FFD93D", 
  strong: "#6BCF7F",
  default: "#E0E0E0"
} as const;

/**
 * Validates username format
 * Username must be at least 5 characters and only contain alphanumeric characters and underscores
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
  return usernameRegex.test(username);
};

/**
 * Validates email format using a comprehensive regex pattern
 * This pattern ensures:
 * - Local part starts with alphanumeric or allowed special chars
 * - No consecutive dots in local part
 * - Single @ symbol
 * - Domain has valid structure with proper TLD
 * - No spaces or invalid characters
 */
export const isValidEmail = (email: string): boolean => {
  // Trim whitespace and convert to lowercase for validation
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic length and structure checks
  if (!trimmedEmail || trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }
  
  // Check for single @ symbol
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return false;
  }
  
  // Split into local and domain parts
  const [localPart, domainPart] = trimmedEmail.split('@');
  
  // Validate local part (before @)
  if (!isValidEmailLocalPart(localPart)) {
    return false;
  }
  
  // Validate domain part (after @)
  if (!isValidEmailDomainPart(domainPart)) {
    return false;
  }
  
  return true;
};

/**
 * Validates the local part of an email (before @)
 * Rules based on RFC 5322 but simplified for practical use
 */
const isValidEmailLocalPart = (localPart: string): boolean => {
  // Check length (1-64 characters)
  if (!localPart || localPart.length < 1 || localPart.length > 64) {
    return false;
  }
  
  // Cannot start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // Cannot have consecutive dots
  if (localPart.includes('..')) {
    return false;
  }
  
  // Valid characters: alphanumeric, and common special characters
  const localPartRegex = /^[a-zA-Z0-9._+-]+$/;
  return localPartRegex.test(localPart);
};

/**
 * Validates the domain part of an email (after @)
 * Ensures proper domain structure with valid TLD
 */
const isValidEmailDomainPart = (domainPart: string): boolean => {
  // Check length (1-253 characters)
  if (!domainPart || domainPart.length < 1 || domainPart.length > 253) {
    return false;
  }
  
  // Must contain at least one dot
  if (!domainPart.includes('.')) {
    return false;
  }
  
  // Cannot start or end with a dot or hyphen
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || 
      domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return false;
  }
  
  // Split into labels (parts separated by dots)
  const labels = domainPart.split('.');
  
  // Must have at least 2 labels (e.g., domain.com)
  if (labels.length < 2) {
    return false;
  }
  
  // Validate each label
  for (const label of labels) {
    if (!isValidDomainLabel(label)) {
      return false;
    }
  }
  
  // Last label (TLD) must be at least 2 characters and only letters
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false;
  }
  
  return true;
};

/**
 * Validates a single domain label (part between dots)
 */
const isValidDomainLabel = (label: string): boolean => {
  // Length check (1-63 characters)
  if (!label || label.length < 1 || label.length > 63) {
    return false;
  }
  
  // Cannot start or end with hyphen
  if (label.startsWith('-') || label.endsWith('-')) {
    return false;
  }
  
  // Valid characters: alphanumeric and hyphens
  const labelRegex = /^[a-zA-Z0-9-]+$/;
  return labelRegex.test(label);
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
      return PASSWORD_STRENGTH_COLORS.weak;
    case "medium":
      return PASSWORD_STRENGTH_COLORS.medium;
    case "strong":
      return PASSWORD_STRENGTH_COLORS.strong;
    default:
      return PASSWORD_STRENGTH_COLORS.default;
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