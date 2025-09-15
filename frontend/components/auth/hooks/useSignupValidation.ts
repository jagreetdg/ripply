import { useState, useEffect } from 'react';
import { checkUsernameAvailability, checkEmailAvailability } from '../../../services/api';

interface ApiResponse {
  exists?: boolean;
  available?: boolean;
  message?: string;
  user?: any;
  token?: string;
  field?: string;
  [key: string]: any;
}

interface ValidationState {
  // Field values
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;

  // Error states
  usernameError: string;
  emailError: string;
  passwordError: string;
  confirmPasswordError: string;

  // Validation states
  isCheckingUsername: boolean;
  isCheckingEmail: boolean;
  isUsernameValid: boolean;
  isEmailValid: boolean;
}

interface ValidationActions {
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setDisplayName: (value: string) => void;
  clearErrors: () => void;
  validateForm: () => boolean;
}

export const useSignupValidation = (): ValidationState & ValidationActions => {
  // Field values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Error states
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Validation states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // Validate username with debounce
  useEffect(() => {
    setUsernameError('');
    setIsUsernameValid(true);

    if (!username) return;

    // Basic validation
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsUsernameValid(false);
      return;
    }

    // Check if username contains only allowed characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setIsUsernameValid(false);
      return;
    }

    // Debounce the API call
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        setIsCheckingUsername(true);
        try {
          const response = (await checkUsernameAvailability(username)) as ApiResponse;
          if (response && !response.available) {
            setUsernameError('Username is already taken');
            setIsUsernameValid(false);
          }
        } catch (error: Error) {
          console.error('Error checking username:', error);
        } finally {
          setIsCheckingUsername(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Validate email with debounce
  useEffect(() => {
    setEmailError('');
    setIsEmailValid(true);

    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
      return;
    }

    // Debounce the API call
    const timer = setTimeout(async () => {
      if (emailRegex.test(email)) {
        setIsCheckingEmail(true);
        try {
          const response = (await checkEmailAvailability(email)) as ApiResponse;
          if (response && !response.available) {
            setEmailError('Email is already registered');
            setIsEmailValid(false);
          }
        } catch (error: Error) {
          console.error('Error checking email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Validate password
  useEffect(() => {
    setPasswordError('');

    if (!password) return;

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    }
  }, [password]);

  // Validate confirm password
  useEffect(() => {
    setConfirmPasswordError('');

    if (!confirmPassword) return;

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    }
  }, [confirmPassword, password]);

  const clearErrors = () => {
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  const validateForm = (): boolean => {
    clearErrors();
    let hasError = false;

    if (!username) {
      setUsernameError('Username is required');
      hasError = true;
    } else if (!isUsernameValid) {
      hasError = true;
    }

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!isEmailValid) {
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    return !hasError;
  };

  return {
    // Field values
    username,
    email,
    password,
    confirmPassword,
    displayName,

    // Error states
    usernameError,
    emailError,
    passwordError,
    confirmPasswordError,

    // Validation states
    isCheckingUsername,
    isCheckingEmail,
    isUsernameValid,
    isEmailValid,

    // Actions
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    setDisplayName,
    clearErrors,
    validateForm,
  };
}; 