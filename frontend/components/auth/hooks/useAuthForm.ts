import { useState, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthFormData, AuthFocusState, AuthType, AuthResponse } from '../types';
import { useUser } from '../../../context/UserContext';
import { loginUser, registerUser } from '../../../services/api';
import { usePasswordStrength } from './usePasswordStrength';
import { useAuthValidation } from './useAuthValidation';
import { isValidEmail, isPasswordConfirmationValid } from '../utils/validation';

export const useAuthForm = (type: AuthType) => {
  const router = useRouter();
  const { setUser } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);

  // Form data state
  const [formData, setFormData] = useState<AuthFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states
  const [focusState, setFocusState] = useState<AuthFocusState>({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Use custom hooks
  const { passwordStrength, updatePasswordStrength, resetPasswordStrength } = usePasswordStrength();
  const { validationState, checkUsername, checkEmail, resetValidation } = useAuthValidation();

  // Update form field
  const updateField = useCallback((field: keyof AuthFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();

    // Handle password strength checking for signup
    if (field === 'password' && type === 'signup' && typeof value === 'string') {
      updatePasswordStrength(value);
    }
  }, [type, updatePasswordStrength]);

  // Update focus state
  const updateFocus = useCallback((field: keyof AuthFocusState, focused: boolean) => {
    setFocusState(prev => ({ ...prev, [field]: focused }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      rememberMe: false,
    });
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFocusState({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
    });
    resetPasswordStrength();
    resetValidation();
  }, [resetPasswordStrength, resetValidation]);

  // Validate form
  const validateForm = useCallback(() => {
    const { username, email, password, confirmPassword } = formData;

    if (type === 'signup') {
      if (!username.trim()) {
        setError('Username is required');
        return false;
      }
      if (validationState.usernameAvailable === false) {
        setError('Username is not available');
        return false;
      }
    }

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (type === 'signup' && validationState.emailAvailable === false) {
      setError('Email is already registered');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (type === 'signup') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }

      if (!isPasswordConfirmationValid(password, confirmPassword)) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  }, [formData, type, validationState]);

  // Check if auth button should be disabled
  const isAuthButtonDisabled = useCallback(() => {
    const { username, email, password, confirmPassword } = formData;
    
    if (isLoading) return true;
    
    if (type === 'signup') {
      return !username.trim() || !email.trim() || !password || !confirmPassword ||
             validationState.isCheckingUsername || validationState.isCheckingEmail ||
             validationState.usernameAvailable === false || validationState.emailAvailable === false;
    }
    
    return !email.trim() || !password;
  }, [formData, isLoading, type, validationState]);

  // Handle authentication
  const handleAuth = useCallback(async (): Promise<boolean> => {
    if (!validateForm()) {
      scrollToTop();
      return false;
    }

    setIsLoading(true);

    try {
      let response: AuthResponse;

      if (type === 'login') {
        response = await loginUser({ 
          email: formData.email, 
          password: formData.password, 
          rememberMe: formData.rememberMe 
        }) as AuthResponse;
      } else {
        response = await registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          display_name: formData.username // Use username as default display name
        }) as AuthResponse;
      }

      if (response.user && response.token) {
        setUser(response.user);
        router.replace('/(tabs)/home');
        return true;
      } else {
        setError('Authentication failed. Please try again.');
        return false;
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(type === 'login' ? 'Login failed. Please try again.' : 'Registration failed. Please try again.');
      }
      
      scrollToTop();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, type, validateForm, setUser, router, scrollToTop]);

  return {
    // Form data
    formData,
    updateField,
    
    // UI state
    isLoading,
    error,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    
    // Focus state
    focusState,
    updateFocus,
    
    // Password strength
    passwordStrength,
    
    // Validation
    validationState,
    checkUsername,
    checkEmail,
    
    // Actions
    handleAuth,
    resetForm,
    clearError,
    isAuthButtonDisabled,
    
    // Refs
    scrollViewRef,
  };
}; 