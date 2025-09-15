import { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// API URL for authentication
const API_URL = "https://ripply-backend.onrender.com";

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: '341363879666-1n31b0blrrlpsbk4c44qbeb1bp23o04d.apps.googleusercontent.com', // From Google Cloud Console
    offlineAccess: true, // For refresh tokens
    hostedDomain: '', // Optional: restrict to specific domain
    forceCodeForRefreshToken: true, // Ensures refresh tokens
});

export const useNativeGoogleAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setAuthError(null);
        
        try {
            console.log("🚀 [NATIVE GOOGLE AUTH] Starting native Google Sign-In");
            
            // Check if device has Google Play Services
            await GoogleSignin.hasPlayServices();
            console.log("✅ [NATIVE GOOGLE AUTH] Google Play Services available");
            
            // Sign in with Google
            const userInfo = await GoogleSignin.signIn();
            console.log("✅ [NATIVE GOOGLE AUTH] Google Sign-In successful");
            console.log("👤 [NATIVE GOOGLE AUTH] User info:", {
                id: userInfo.user.id,
                email: userInfo.user.email,
                name: userInfo.user.name,
            });
            
            // Get the ID token for backend verification
            const idToken = userInfo.idToken;
            if (!idToken) {
                throw new Error('No ID token received from Google');
            }
            
            console.log("🎫 [NATIVE GOOGLE AUTH] ID Token received, sending to backend");
            
            // Send token to your backend for verification and user creation/login
            const response = await fetch(`${API_URL}/api/auth/google/native`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: idToken,
                    userInfo: {
                        id: userInfo.user.id,
                        email: userInfo.user.email,
                        name: userInfo.user.name,
                        photo: userInfo.user.photo,
                    }
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Backend auth failed: ${response.status}`);
            }
            
            const authResult = await response.json();
            console.log("✅ [NATIVE GOOGLE AUTH] Backend auth successful");
            
            // Return the result for the calling component to handle
            return {
                success: true,
                token: authResult.token,
                user: authResult.user,
            };
            
        } catch (error: any) {
            console.error("💥 [NATIVE GOOGLE AUTH] Error:", error);
            
            let errorMessage = 'Failed to sign in with Google';
            
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                errorMessage = 'Sign in was cancelled';
                console.log("❌ [NATIVE GOOGLE AUTH] User cancelled sign-in");
            } else if (error.code === statusCodes.IN_PROGRESS) {
                errorMessage = 'Sign in is already in progress';
                console.log("⏳ [NATIVE GOOGLE AUTH] Sign-in already in progress");
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                errorMessage = 'Google Play Services not available';
                console.log("❌ [NATIVE GOOGLE AUTH] Google Play Services not available");
            } else {
                console.log("❌ [NATIVE GOOGLE AUTH] Other error:", error.message);
            }
            
            setAuthError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await GoogleSignin.signOut();
            console.log("✅ [NATIVE GOOGLE AUTH] Signed out successfully");
        } catch (error) {
            console.error("💥 [NATIVE GOOGLE AUTH] Sign out error:", error);
        }
    };

    return {
        signInWithGoogle,
        signOut,
        isLoading,
        authError,
    };
};
