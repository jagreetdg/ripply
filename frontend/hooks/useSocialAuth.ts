import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Register for the auth callback
WebBrowser.maybeCompleteAuthSession();

// API URL for authentication
const API_URL = "https://ripply-backend.onrender.com";

export const useSocialAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const initiateSocialAuth = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        setAuthError(null);
        
        try {
            const authUrl = `${API_URL}/api/auth/${provider}`;
            
            if (Platform.OS === "web") {
                // For web, redirect to the auth URL
                window.location.href = authUrl;
            } else {
                // For native, use WebBrowser
                const result = await WebBrowser.openAuthSessionAsync(
                    authUrl,
                    "ripply://",
                    {
                        showInRecents: false,
                        preferEphemeralSession: true,
                        dismissButtonStyle: "cancel",
                    }
                );

                if (result.type === "success") {
                    console.log(`[Auth Flow] ${provider} auth success:`, result.url);
                } else if (result.type === "cancel" || result.type === "dismiss") {
                    console.log(`[Auth Flow] ${provider} auth cancelled by user`);
                    setIsLoading(false);
                } else {
                    console.warn(`[Auth Flow] ${provider} auth unexpected result:`, result.type);
                    setAuthError(`Authentication failed. Please try again.`);
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error(`[Auth Flow] ${provider} auth error:`, error);
            setAuthError(`Failed to authenticate with ${provider}. Please try again.`);
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        authError,
        initiateSocialAuth,
    };
}; 