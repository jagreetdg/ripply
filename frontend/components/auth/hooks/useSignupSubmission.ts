import { useState } from 'react';
import { useRouter } from 'expo-router';
import { registerUser } from '../../../services/api';
import { useUser } from '../../../context/UserContext';

interface ApiResponse {
  exists?: boolean;
  available?: boolean;
  message?: string;
  user?: any;
  token?: string;
  field?: string;
  [key: string]: any;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface SubmissionState {
  isLoading: boolean;
  error: string;
}

interface SubmissionActions {
  submitSignup: (formData: SignupData, isFormValid: boolean) => Promise<void>;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useSignupSubmission = (): SubmissionState & SubmissionActions => {
  const router = useRouter();
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const submitSignup = async (formData: SignupData, isFormValid: boolean) => {
    if (!isFormValid) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        displayName: formData.displayName.trim() || formData.username.trim(),
      };

      const response = (await registerUser(userData)) as ApiResponse;

      if (response?.user && response?.token) {
        // Store user data in context
        setUser(response.user);
        
        // Navigate to the main app
        router.replace('/(tabs)');
      } else {
        throw new Error(response?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('username')) {
        errorMessage = 'Username is already taken or invalid';
      } else if (errorMessage.toLowerCase().includes('email')) {
        errorMessage = 'Email is already registered or invalid';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  return {
    isLoading,
    error,
    submitSignup,
    setError,
    clearError,
  };
}; 