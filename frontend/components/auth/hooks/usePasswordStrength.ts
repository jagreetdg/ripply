import { useState, useCallback } from 'react';
import { PasswordStrength } from '../types';
import { checkPasswordStrength } from '../utils/validation';

export const usePasswordStrength = () => {
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(null);

  const updatePasswordStrength = useCallback((password: string) => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, []);

  const resetPasswordStrength = useCallback(() => {
    setPasswordStrength(null);
  }, []);

  return {
    passwordStrength,
    updatePasswordStrength,
    resetPasswordStrength,
  };
}; 