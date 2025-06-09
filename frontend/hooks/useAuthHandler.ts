import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useUser } from '../context/UserContext';
import { getCurrentUser, verifyToken } from '../services/api';

const TOKEN_KEY = '@ripply_auth_token';

export const useAuthHandler = () => {
  const { user, setUser, logout: contextLogout } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleAuthSuccess = async (tokenFromUrl?: string) => {
    try {
      // Clear URL params first
      if (Platform.OS === 'web' && window.location.search) {
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }

      let token = tokenFromUrl;
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }

      if (token) {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          await AsyncStorage.setItem('@ripply_user', JSON.stringify(currentUser));
          router.replace('/(tabs)/home');
          setIsAuthenticated(true);
        } else {
          // No user found with token, clear token
          await AsyncStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error in handleAuthSuccess:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (user) {
          setIsAuthenticated(true);
          return;
        }

        // Try to verify existing token
        const authData = await verifyToken();
        if (authData?.user) {
          setUser(authData.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
        await contextLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [user, setUser, contextLogout]);

  const signInWithOAuth = async (provider: 'google' | 'apple' = 'google') => {
    try {
      const authUrl = `https://ripply-backend.onrender.com/api/auth/${provider}`;
      
      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          'com.ripply.app://auth'
        );

        if (result.type === 'success' && result.url) {
          const urlParams = new URLSearchParams(result.url.split('?')[1]);
          const token = urlParams.get('token');
          const error = urlParams.get('error');

          if (token) {
            await handleAuthSuccess(token);
          } else if (error) {
            throw new Error(error);
          }
        } else {
          // User cancelled or dismissed
        }
      }
    } catch (error) {
      console.error('OAuth sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await contextLogout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signInWithOAuth,
    logout,
    handleAuthSuccess,
  };
}; 