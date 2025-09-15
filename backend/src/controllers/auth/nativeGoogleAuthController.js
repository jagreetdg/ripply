const { OAuth2Client } = require('google-auth-library');
const socialAuthService = require('../../services/auth/socialAuthService');
const { setSocialAuthCookie } = require('../../utils/auth/tokenUtils');

// Initialize Google OAuth2 client for token verification
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handle native Google Sign-In token verification
 * @route POST /auth/google/native
 */
const handleNativeGoogleAuth = async (req, res) => {
    try {
        console.log("[Native Google Auth] Received native Google auth request");
        
        const { idToken, userInfo } = req.body;
        
        if (!idToken) {
            console.error("[Native Google Auth] No ID token provided");
            return res.status(400).json({ 
                error: 'No ID token provided',
                success: false 
            });
        }
        
        console.log("[Native Google Auth] Verifying ID token with Google");
        
        // Verify the ID token with Google
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        if (!payload) {
            console.error("[Native Google Auth] Invalid token payload");
            return res.status(400).json({ 
                error: 'Invalid token',
                success: false 
            });
        }
        
        console.log("[Native Google Auth] Token verified successfully");
        console.log("[Native Google Auth] User from token:", {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
        });
        
        // Create user object in the format expected by socialAuthService
        const googleUser = {
            id: payload.sub,
            google_id: payload.sub,
            email: payload.email,
            display_name: payload.name || userInfo.name,
            avatar_url: payload.picture || userInfo.photo,
        };
        
        // Handle Google authentication using existing service
        const authResult = await socialAuthService.handleGoogleAuth(googleUser);
        
        console.log("[Native Google Auth] Auth result:", {
            hasUser: !!authResult.user,
            hasToken: !!authResult.token,
            isNewUser: authResult.isNewUser,
        });
        
        // Set secure cookie in production
        setSocialAuthCookie(res, authResult.token);
        
        // Return success response
        res.json({
            success: true,
            token: authResult.token,
            user: authResult.user,
            isNewUser: authResult.isNewUser,
        });
        
    } catch (error) {
        console.error("[Native Google Auth] Error:", error);
        
        let errorMessage = 'Authentication failed';
        if (error.message?.includes('Token used too early')) {
            errorMessage = 'Token timing error, please try again';
        } else if (error.message?.includes('Invalid token')) {
            errorMessage = 'Invalid authentication token';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            success: false 
        });
    }
};

module.exports = {
    handleNativeGoogleAuth,
};
