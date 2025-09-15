const express = require("express");
const router = express.Router();
const rateLimiter = require("../middleware/rateLimiter");
const { enforceHTTPS } = require("../middleware/auth/httpsMiddleware");
const { authenticateToken } = require("../middleware/auth");

// Import controllers
const authController = require("../controllers/auth/authController");
const socialAuthController = require("../controllers/auth/socialAuthController");
const universalOAuthController = require("../controllers/auth/universalOAuthController");

/**
 * Refactored Auth Routes
 *
 * This file replaces the monolithic auth.js route file with a clean,
 * modular structure using separate controllers for different concerns.
 */

// Apply HTTPS enforcement to all auth routes (disabled for testing)
// router.use(enforceHTTPS);

// Apply rate limiting to sensitive routes (disabled for testing)
// router.use(
// 	"/login",
// 	rateLimiter(
// 		5,
// 		15 * 60 * 1000,
// 		"Too many login attempts, please try again later"
// 	)
// );
// router.use(
// 	"/register",
// 	rateLimiter(
// 		3,
// 		60 * 60 * 1000,
// 		"Too many registration attempts, please try again later"
// 	)
// );

// ===== VALIDATION ENDPOINTS =====

// Check if username exists
router.get("/check-username/:username", authController.checkUsername);

// Check if email exists
router.get("/check-email/:email", authController.checkEmail);

// ===== CORE AUTHENTICATION =====

// Register a new user
router.post("/register", authController.register);

// Login user
router.post("/login", authController.login);

// Logout user
router.post("/logout", authController.logout);

// Verify token
router.get("/verify-token", authController.verifyTokenEndpoint);

// Get current user profile (authenticated)
router.get("/me", authenticateToken, authController.getCurrentUser);

// ===== SOCIAL AUTHENTICATION =====

// Universal OAuth 2.0 PKCE flow (industry standard)
// Works identically across all platforms (web, iOS, Android, dev, prod)

// Get available OAuth providers
router.get("/oauth/providers", universalOAuthController.getAvailableProviders);

// Check specific provider status
router.get(
	"/oauth/providers/:provider/status",
	universalOAuthController.getProviderStatus
);

// Initiate OAuth flow for any provider (Google, Apple, Facebook, etc.)
router.get("/oauth/:provider", universalOAuthController.initiateOAuth);

// Universal OAuth callback handler (handles all providers)
router.get("/oauth/callback", universalOAuthController.handleOAuthCallback);
router.post("/oauth/callback", universalOAuthController.handleOAuthCallback); // For Apple

// Test OAuth configuration
router.get("/oauth/test", universalOAuthController.testOAuthConfig);

// ===== LEGACY SOCIAL AUTH (DEPRECATED - use /oauth/ routes instead) =====

// Legacy routes for backward compatibility (will be removed in future versions)
router.get("/providers", socialAuthController.getProviders);
router.get(
	"/providers/:provider/status",
	socialAuthController.getProviderStatus
);
router.get("/google", socialAuthController.googleAuth);
router.get("/google/callback", socialAuthController.googleCallback);
router.get("/apple", socialAuthController.appleAuth);
router.get("/apple/callback", socialAuthController.appleCallback);

// ===== TEST ROUTES (for testing purposes) =====
router.get("/test", (req, res) => {
	console.log("[AUTH TEST] Test route hit!");
	res.json({ route: "auth" });
});

// Diagnostic endpoint to check environment variables
router.get("/debug/env", (req, res) => {
	const envCheck = {
		NODE_ENV: process.env.NODE_ENV,
		JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
		SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "NOT SET",
		SUPABASE_KEY: process.env.SUPABASE_KEY ? "SET" : "NOT SET",
		SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "SET" : "NOT SET",
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
			? "SET"
			: "NOT SET",
		FRONTEND_URL: process.env.FRONTEND_URL ? "SET" : "NOT SET",
		BACKEND_URL: process.env.BACKEND_URL ? "SET" : "NOT SET",
	};
	res.json(envCheck);
});

router.post("/test", (req, res) => {
	console.log("[AUTH TEST] Test POST route hit!");
	res.json({ route: "auth" });
});

module.exports = router;
