import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext'; // Assuming this path is correct
import { getCurrentUser } from '../services/api/authService'; // Assuming this path is correct

const API_URL = "https://ripply-backend.onrender.com"; // Consider moving to a config file
const TOKEN_KEY = "@ripply_auth_token";
const USER_KEY = "@ripply_user"; // This seems to be defined but not used in the original logic for storing user, relying on UserContext

WebBrowser.maybeCompleteAuthSession();

export const useAuthHandler = () => {
    const router = useRouter();
    const { user, setUser } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    const clearUrlParams = useCallback(() => {
        if (Platform.OS === 'web' && window.history && window.history.replaceState) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            console.log("[DEBUG] AuthHandler - URL params cleared, new URL:", window.location.href);
        }
    }, []);

    const handleAuthSuccess = useCallback(async (receivedToken?: string) => {
        let tokenToUse = receivedToken;
        if (tokenToUse) {
            console.log("[Auth Flow] Token provided to handleAuthSuccess");
            await AsyncStorage.setItem(TOKEN_KEY, tokenToUse);
        } else {
            console.log("[Auth Flow] No token provided, attempting to retrieve from storage");
            tokenToUse = await AsyncStorage.getItem(TOKEN_KEY);
        }

        if (tokenToUse) {
            try {
                console.log("[DEBUG] AuthHandler - Getting user data with token");
                const currentUser = await getCurrentUser(); // getCurrentUser should implicitly use the stored token
                console.log("[DEBUG] AuthHandler - User data retrieved:", !!currentUser);
                if (currentUser) {
                    setUser(currentUser);
                    // Storing user in AsyncStorage as well, though context is primary
                    await AsyncStorage.setItem(USER_KEY, JSON.stringify(currentUser)); 
                    router.replace('/(tabs)/home');
                    console.log("[DEBUG] AuthHandler - Navigation to home triggered");
                    return true;
                } else {
                    console.log("[DEBUG] AuthHandler - No user found with token, clearing token");
                    await AsyncStorage.removeItem(TOKEN_KEY);
                    setUser(null);
                    setAuthError("Failed to fetch user data after authentication.");
                }
            } catch (error) {
                console.error("[Auth Flow] Error fetching user data:", error);
                await AsyncStorage.removeItem(TOKEN_KEY);
                setUser(null);
                setAuthError("An error occurred while fetching your profile.");
            }
        }
        return false;
    }, [setUser, router, clearUrlParams]);

    useEffect(() => {
        const checkAuthStatus = async () => {
            setIsLoading(true);
            setAuthError(null);
            console.log("[DEBUG] AuthHandler - checkAuthStatus started");
            console.log("[DEBUG] AuthHandler - Current URL:", Platform.OS === 'web' ? window.location.href : 'N/A');

            try {
                if (Platform.OS === 'web') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const tokenFromUrl = urlParams.get("token");
                    const errorFromUrl = urlParams.get("error");

                    console.log("[DEBUG] AuthHandler - Token in URL:", !!tokenFromUrl);
                    console.log("[DEBUG] AuthHandler - Error in URL:", !!errorFromUrl);

                    if (tokenFromUrl) {
                        console.log("[Auth Flow] Token found in URL");
                        await handleAuthSuccess(tokenFromUrl);
                        clearUrlParams(); 
                        setIsLoading(false);
                        return;
                    } else if (errorFromUrl) {
                        console.error("[Auth Flow] Auth error in URL:", errorFromUrl);
                        setAuthError(`Authentication failed: ${errorFromUrl}. Please try again.`);
                        clearUrlParams();
                        setIsLoading(false);
                        return;
                    }
                }

                // If no URL token/error, or not web, check stored token
                console.log("[DEBUG] AuthHandler - No token in URL or not web, checking stored token");
                const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
                console.log("[DEBUG] AuthHandler - Stored token exists:", !!storedToken);

                if (storedToken) {
                    console.log("[DEBUG] AuthHandler - Attempting auth with stored token");
                    await handleAuthSuccess(); // Will use stored token
                } else {
                     // No stored token, user is not authenticated
                    setUser(null); // Ensure user is cleared if no token
                }
            } catch (err) {
                console.error("[Auth Flow] Error checking auth status:", err);
                setAuthError("An unexpected error occurred during authentication check.");
                await AsyncStorage.removeItem(TOKEN_KEY); // Clear potentially bad token
                setUser(null);
            } finally {
                setIsLoading(false);
                console.log("[DEBUG] AuthHandler - checkAuthStatus completed");
            }
        };

        checkAuthStatus();
         // Clean-up function to see if component is being unmounted during navigation
        return () => {
            console.log("[DEBUG] AuthHandler - Hook unmounting or dependencies changed");
        };
    }, [handleAuthSuccess, setUser, clearUrlParams]); // Dependencies for checkAuthStatus

    const initiateSocialAuth = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        setAuthError(null);
        const authUrl = `${API_URL}/api/auth/${provider}`;
        try {
            if (Platform.OS === "web") {
                window.location.href = authUrl;
            } else {
                // For native, openAuthSessionAsync should handle the redirect and result.
                // The result.url will be processed by checkAuthStatus on component remount/focus.
                const result = await WebBrowser.openAuthSessionAsync(authUrl);
                if (result.type === "success") {
                    // For native, success means the browser opened and closed.
                    // The actual token processing happens when checkAuthStatus runs on app focus/return.
                    // We might not get the token directly here if the redirect is to a custom scheme handled by the app.
                    console.log("[Auth Flow] Native WebBrowser session success:", result.url);
                    // If result.url contains token (depends on backend redirect), could process here too.
                    // However, relying on checkAuthStatus is more robust for native.
                } else if (result.type === "cancel" || result.type === "dismiss") {
                    console.log("[Auth Flow] Native WebBrowser session cancelled or dismissed by user.");
                    setIsLoading(false);
                } else {
                    console.warn("[Auth Flow] Native WebBrowser session returned unexpected result type:", result.type);
                     setIsLoading(false); // Stop loading on other unexpected results
                }
            }
        } catch (error) {
            console.error(`[Auth Flow] ${provider} auth error:`, error);
            setAuthError(`Failed to authenticate with ${provider}. Please try again.`);
            setIsLoading(false);
        }
        // setIsLoading(false) // Do not set loading false here for web, as page will redirect.
    };

    const signOut = async () => {
        console.log("[Auth Flow] Signing out user.");
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
        setUser(null);
        // Optionally, redirect to login or home page after sign out
        // router.replace('/'); // Or your designated sign-out destination
        console.log("[Auth Flow] User signed out, token and user data cleared.");
    };

    return { user, isLoading, authError, initiateSocialAuth, signOut, setUser, setIsLoading };
}; 