const express = require("express");
const router = express.Router();
const rateLimiter = require("../middleware/rateLimiter");
const { enforceHTTPS } = require("../middleware/auth/httpsMiddleware");

// Import controllers
const authController = require("../controllers/auth/authController");
const socialAuthController = require("../controllers/auth/socialAuthController");

/**
 * Refactored Auth Routes
 *
 * This file replaces the monolithic auth.js route file with a clean,
 * modular structure using separate controllers for different concerns.
 */

// Apply HTTPS enforcement to all auth routes
router.use(enforceHTTPS);

// Apply rate limiting to sensitive routes
router.use(
	"/login",
	rateLimiter(
		5,
		15 * 60 * 1000,
		"Too many login attempts, please try again later"
	)
);
router.use(
	"/register",
	rateLimiter(
		3,
		60 * 60 * 1000,
		"Too many registration attempts, please try again later"
	)
);

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

// Get current user profile
router.get("/me", authController.getCurrentUser);

// ===== SOCIAL AUTHENTICATION =====

// Get available OAuth providers
router.get("/providers", socialAuthController.getProviders);

// Check specific provider status
router.get(
	"/providers/:provider/status",
	socialAuthController.getProviderStatus
);

// Google authentication routes
router.get("/google", socialAuthController.googleAuth);
router.get("/google/callback", socialAuthController.googleCallback);

// Apple authentication routes
router.get("/apple", socialAuthController.appleAuth);
router.get("/apple/callback", socialAuthController.appleCallback);

module.exports = router;
