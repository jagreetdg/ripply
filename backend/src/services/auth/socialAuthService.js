const authService = require("./authService");
const { generateSocialAuthToken } = require("../../utils/auth/tokenUtils");

/**
 * Social authentication service
 */

/**
 * Handle Google OAuth callback
 * @param {Object} profile - Google profile data
 * @returns {Object} User data and token
 */
const handleGoogleAuth = async (profile) => {
	try {
		// Check if user already exists by email
		let user = await authService.findUserByEmail(profile.email);

		if (!user) {
			// Create new user from Google profile
			user = await authService.createSocialUser(profile, "google");
		}

		// Update last login
		await authService.updateLastLogin(user.id);

		// Generate token
		const token = generateSocialAuthToken(user);

		return {
			user,
			token,
			isNewUser: !user.provider_id, // If no provider_id, it's a newly created social user
		};
	} catch (error) {
		console.error("[Social Auth] Error in Google authentication:", error);
		throw error;
	}
};

/**
 * Handle Apple OAuth callback
 * @param {Object} profile - Apple profile data
 * @returns {Object} User data and token
 */
const handleAppleAuth = async (profile) => {
	try {
		// Check if user already exists by email
		let user = await authService.findUserByEmail(profile.email);

		if (!user) {
			// Create new user from Apple profile
			user = await authService.createSocialUser(profile, "apple");
		}

		// Update last login
		await authService.updateLastLogin(user.id);

		// Generate token
		const token = generateSocialAuthToken(user);

		return {
			user,
			token,
			isNewUser: !user.provider_id, // If no provider_id, it's a newly created social user
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
	const baseUrl = process.env.FRONTEND_URL;

	if (error) {
		return `${baseUrl}/auth/login?error=${error}`;
	}

	if (token) {
		return `${baseUrl}/auth/${provider}-callback?token=${token}`;
	}

	return `${baseUrl}/auth/login?error=auth_failed`;
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
