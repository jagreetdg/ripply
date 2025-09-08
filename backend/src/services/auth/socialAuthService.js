const authService = require("./authService");
const { generateSocialAuthToken } = require("../../utils/auth/tokenUtils");

/**
 * Social authentication service
 */

/**
 * Handle Google OAuth callback
 * @param {Object} user - User data from passport
 * @returns {Object} User data and token
 */
const handleGoogleAuth = async (user) => {
	try {
		// User is already created/found by passport, just process it
		// Update last login
		await authService.updateLastLogin(user.id);

		// Generate token
		const token = generateSocialAuthToken(user);

		return {
			user,
			token,
			isNewUser: !user.google_id, // If no google_id, it's a newly created social user
		};
	} catch (error) {
		console.error("[Social Auth] Error in Google authentication:", error);
		throw error;
	}
};

/**
 * Handle Apple OAuth callback
 * @param {Object} user - User data from passport
 * @returns {Object} User data and token
 */
const handleAppleAuth = async (user) => {
	try {
		// User is already created/found by passport, just process it
		// Update last login
		await authService.updateLastLogin(user.id);

		// Generate token
		const token = generateSocialAuthToken(user);

		return {
			user,
			token,
			isNewUser: !user.apple_id, // If no apple_id, it's a newly created social user
		};
	} catch (error) {
		console.error("[Social Auth] Error in Apple authentication:", error);
		throw error;
	}
};

/**
 * Build OAuth redirect URL
 * @param {string} provider - OAuth provider (google, apple)
 * @param {string} token - JWT token
 * @param {string} error - Error message if any
 * @returns {string} Redirect URL
 */
const buildOAuthRedirectUrl = (provider, token = null, error = null) => {
	// Always use deep linking for mobile app (Ripply is primarily a mobile app)
	// This ensures OAuth works on physical devices, simulators, and Expo Go
	// Using simple expo deep link format

	if (error) {
		return `ripply://auth/social-callback?error=${error}`;
	}

	if (token) {
		return `ripply://auth/${provider}-callback?token=${token}`;
	}

	return `ripply://auth/social-callback?error=auth_failed`;
};

/**
 * Check if OAuth provider is configured
 * @param {string} provider - OAuth provider name
 * @returns {boolean} Whether provider is configured
 */
const isProviderConfigured = (provider) => {
	const passport = require("../../config/passport");
	return passport._strategies && passport._strategies[provider];
};

/**
 * Get available OAuth providers
 * @returns {Array} List of configured OAuth providers
 */
const getAvailableProviders = () => {
	const providers = [];

	if (isProviderConfigured("google")) {
		providers.push("google");
	}

	if (isProviderConfigured("apple")) {
		providers.push("apple");
	}

	return providers;
};

/**
 * Validate OAuth profile data
 * @param {Object} profile - OAuth profile
 * @param {string} provider - Provider name
 * @returns {Object} Validation result
 */
const validateOAuthProfile = (profile, provider) => {
	if (!profile) {
		return {
			isValid: false,
			message: "No profile data received from OAuth provider",
		};
	}

	if (!profile.email) {
		return {
			isValid: false,
			message: "Email is required for OAuth authentication",
		};
	}

	// Additional provider-specific validation could go here

	return { isValid: true };
};

module.exports = {
	handleGoogleAuth,
	handleAppleAuth,
	buildOAuthRedirectUrl,
	isProviderConfigured,
	getAvailableProviders,
	validateOAuthProfile,
};
