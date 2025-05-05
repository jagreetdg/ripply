import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../context/UserContext';
import { verifyToken } from '../../services/api/authService';

// Token storage keys
const TOKEN_KEY = '@ripply_auth_token';
const USER_KEY = '@ripply_user';

// Define the type for token verification response
interface VerifyTokenResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    display_name?: string;
    avatar_url?: string | null;
    bio?: string | null;
    is_verified?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: any; // For any other properties
  };
}

export default function SocialCallbackScreen() {
  const router = useRouter();
  const { token, error } = useLocalSearchParams<{ token?: string; error?: string }>();
  const { setUser } = useUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleSocialCallback = async () => {
      try {
        // Check if there's an error parameter
        if (error) {
          setStatus('error');
          setErrorMessage('Authentication failed. Please try again.');
          return;
        }

        // Check if token is present
        if (!token) {
          setStatus('error');
          setErrorMessage('No authentication token received. Please try again.');
          return;
        }

        console.log('Social auth callback received token');

        // Store token in AsyncStorage
        await AsyncStorage.setItem(TOKEN_KEY, token);

        // Verify token and get user data
        const response = await verifyToken() as VerifyTokenResponse;
        
        if (response && response.user) {
          // Store user data in AsyncStorage
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
          
          // Update user context
          setUser({
            id: response.user.id,
            username: response.user.username,
            email: response.user.email,
            display_name: response.user.display_name || response.user.username,
            avatar_url: response.user.avatar_url || null,
            bio: response.user.bio || null,
            is_verified: response.user.is_verified || false,
            created_at: response.user.created_at,
            updated_at: response.user.updated_at
          });
          
          setStatus('success');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            router.replace('/(tabs)/home');
          }, 1000);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (err) {
        console.error('Error in social auth callback:', err);
        setStatus('error');
        setErrorMessage('Failed to authenticate. Please try again.');
      }
    };

    handleSocialCallback();
  }, [token, error]);

  return (
    <View style={styles.container}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color="#6B2FBC" />
          <Text style={styles.text}>Completing authentication...</Text>
        </>
      )}
      
      {status === 'success' && (
        <>
          <Text style={styles.successText}>Authentication successful!</Text>
          <Text style={styles.text}>Redirecting to home page...</Text>
        </>
      )}
      
      {status === 'error' && (
        <>
          <Text style={styles.errorText}>Authentication Error</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Text 
            style={styles.linkText}
            onPress={() => router.replace('/auth/login')}
          >
            Return to Login
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B2FBC',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#6B2FBC',
    fontWeight: '500',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});
