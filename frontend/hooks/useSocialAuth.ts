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
            console.log("🚀 [SOCIAL AUTH DEBUG] Starting social auth for:", provider);
            
            // Add client=mobile parameter for mobile platforms
            const authUrl = Platform.OS === "web" 
                ? `${API_URL}/api/auth/${provider}`
                : `${API_URL}/api/auth/${provider}?client=mobile`;
            
            console.log("🌐 [SOCIAL AUTH DEBUG] Auth URL:", authUrl);
            
            if (Platform.OS === "web") {
                // For web, redirect to the auth URL
                window.location.href = authUrl;
            } else {
                console.log("📱 [SOCIAL AUTH DEBUG] Opening WebBrowser with mobile client param");
                
                // Add timeout wrapper to prevent infinite hanging
                const authPromise = WebBrowser.openAuthSessionAsync(
                    authUrl,
                    "ripply://",
                    {
                        showInRecents: false,
                        preferEphemeralSession: false, // Try persistent session
                        dismissButtonStyle: "cancel",
                    }
                );
                
                // Add 60 second timeout
                const timeoutPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        console.log("⏰ [SOCIAL AUTH DEBUG] WebBrowser timeout reached (60s)");
                        resolve({ type: "timeout" });
                    }, 60000);
                });
                
                const result = await Promise.race([authPromise, timeoutPromise]);

                console.log("📱 [SOCIAL AUTH DEBUG] WebBrowser result:", JSON.stringify(result, null, 2));

                if (result.type === "success") {
                    console.log(`✅ [SOCIAL AUTH DEBUG] ${provider} auth success:`, result.url);
                } else if (result.type === "cancel" || result.type === "dismiss") {
                    console.log(`❌ [SOCIAL AUTH DEBUG] ${provider} auth cancelled by user`);
                    setIsLoading(false);
                } else {
                    console.warn(`💥 [SOCIAL AUTH DEBUG] ${provider} auth unexpected result:`, result.type);
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