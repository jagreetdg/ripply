import React from 'react';
import { StyleSheet, View, Pressable, Text, Platform } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Register for the auth callback
WebBrowser.maybeCompleteAuthSession();

// API URL for authentication
const API_URL = "https://ripply-backend.onrender.com";

type SocialAuthButtonsProps = {
  onGoogleAuth: () => void;
  onAppleAuth: () => void;
  onFacebookAuth: () => void;
};

/**
 * Component for social authentication buttons (Google, Apple, Facebook)
 */
export default function SocialAuthButtons({ 
  onGoogleAuth, 
  onAppleAuth, 
  onFacebookAuth 
}: SocialAuthButtonsProps) {
  // Handle Google authentication
  const handleGoogleAuth = async () => {
    try {
      // Call the onGoogleAuth callback to show loading state
      onGoogleAuth();
      
      // Open the Google auth URL in a web browser
      const authUrl = `${API_URL}/api/auth/google`;
      await WebBrowser.openAuthSessionAsync(authUrl);
    } catch (error) {
      console.error('Google auth error:', error);
    }
  };

  // Handle Apple authentication
  const handleAppleAuth = async () => {
    try {
      // Call the onAppleAuth callback to show loading state
      onAppleAuth();
      
      // Open the Apple auth URL in a web browser
      const authUrl = `${API_URL}/api/auth/apple`;
      await WebBrowser.openAuthSessionAsync(authUrl);
    } catch (error) {
      console.error('Apple auth error:', error);
    }
  };

  // Handle Facebook authentication (placeholder for future implementation)
  const handleFacebookAuth = () => {
    // Call the onFacebookAuth callback
    onFacebookAuth();
    
    // Facebook auth is not implemented yet
    alert('Facebook authentication is not implemented yet.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>
      
      <View style={styles.buttonsContainer}>
        <Pressable 
          style={[styles.socialButton, styles.googleButton]}
          onPress={handleGoogleAuth}
        >
          <Feather name="chrome" size={20} color="#DB4437" style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </Pressable>
        
        {/* Only show Apple login on iOS devices */}
        {Platform.OS === 'ios' && (
          <Pressable 
            style={[styles.socialButton, styles.appleButton]}
            onPress={handleAppleAuth}
          >
            <FontAwesome name="apple" size={20} color="#000" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </Pressable>
        )}
        
        <Pressable 
          style={[styles.socialButton, styles.facebookButton]}
          onPress={handleFacebookAuth}
        >
          <FontAwesome name="facebook" size={20} color="#1877F2" style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Continue with Facebook</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  buttonsContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  googleButton: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  appleButton: {
    borderColor: '#000',
    backgroundColor: '#FFFFFF',
  },
  facebookButton: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    color: '#333',
  },
  socialIcon: {
    width: 20,
    height: 20,
  }
});
