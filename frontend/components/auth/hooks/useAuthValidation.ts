import { useState, useCallback } from 'react';
import { AuthValidationState, AvailabilityResponse } from '../types';
import { isValidUsername, isValidEmail } from '../utils/validation';
import { checkUsernameAvailability, checkEmailAvailability } from '../../../services/api';

export const useAuthValidation = () => {
  const [validationState, setValidationState] = useState<AuthValidationState>({
    usernameAvailable: null,
    emailAvailable: null,
    isCheckingUsername: false,
    isCheckingEmail: false,
  });

  const checkUsername = useCallback(async (username: string) => {
    if (!username) return;

    // First check if username format is valid
    if (!isValidUsername(username)) {
      setValidationState(prev => ({
        ...prev,
        usernameAvailable: false,
        isCheckingUsername: false,
      }));
      return;
    }

    try {
      setValidationState(prev => ({ ...prev, isCheckingUsername: true }));
      const response = await checkUsernameAvailability(username) as AvailabilityResponse;
      setValidationState(prev => ({
        ...prev,
        usernameAvailable: response.available,
        isCheckingUsername: false,
      }));
    } catch (error) {
      console.error('Error checking username:', error);
      setValidationState(prev => ({
        ...prev,
        usernameAvailable: null,
        isCheckingUsername: false,
      }));
    }
  }, []);

  const checkEmail = useCallback(async (email: string) => {
    if (!email) return;

    // First check if email format is valid
    if (!isValidEmail(email)) {
      setValidationState(prev => ({
        ...prev,
        emailAvailable: false,
        isCheckingEmail: false,
      }));
      return;
    }

    try {
      setValidationState(prev => ({ ...prev, isCheckingEmail: true }));
      const response = await checkEmailAvailability(email) as AvailabilityResponse;
      setValidationState(prev => ({
        ...prev,
        emailAvailable: response.available,
        isCheckingEmail: false,
      }));
    } catch (error) {
      console.error('Error checking email:', error);
      setValidationState(prev => ({
        ...prev,
        emailAvailable: null,
        isCheckingEmail: false,
      }));
    }
  }, []);

  const resetValidation = useCallback(() => {
    setValidationState({
      usernameAvailable: null,
      emailAvailable: null,
      isCheckingUsername: false,
      isCheckingEmail: false,
    });
  }, []);

  return {
    validationState,
    checkUsername,
    checkEmail,
    resetValidation,
  };
}; 