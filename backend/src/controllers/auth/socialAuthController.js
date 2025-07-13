const passport = require("../../config/passport");
const socialAuthService = require("../../services/auth/socialAuthService");
const { setSocialAuthCookie } = require("../../utils/auth/tokenUtils");

/**
 * Social authentication controller
 */

/**
 * Google authentication route
 * @route GET /auth/google
 */
const googleAuth = passport.authenticate("google", {
	scope: ["profile", "email"],
	prompt: "select_account", // Force Google to show account selection screen instead of auto-login
});

/**
 * Google callback route
 * @route GET /auth/google/callback
 */
const googleCallback = [
	passport.authenticate("google", {
		session: false,
		failureRedirect: `${
			process.env.FRONTEND_URL || "https://ripply-app.netlify.app"
		}/auth/login?error=auth_failed`,
	}),
	async (req, res) => {
		try {
			console.log("[Google OAuth] Callback received");
			console.log(
				"[Google OAuth] User from passport:",
				req.user ? "Present" : "Missing"
			);

			if (!req.user) {
				console.error("[Google OAuth] No user from passport authentication");
				const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
					"google",
					null,
					"auth_failed"
				);
				return res.redirect(redirectUrl);
			}

			console.log("[Google OAuth] Processing user:", {
				id: req.user.id,
				email: req.user.email,
				google_id: req.user.google_id,
			});

			// Handle Google authentication
			const authResult = await socialAuthService.handleGoogleAuth(req.user);

			console.log("[Google OAuth] Auth result:", {
				hasUser: !!authResult.user,
				hasToken: !!authResult.token,
				isNewUser: authResult.isNewUser,
			});

			// Set secure cookie in production
			setSocialAuthCookie(res, authResult.token);

			// Redirect to frontend with token
			const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
				"google",
				authResult.token
			);

			console.log("[Google OAuth] Redirecting to:", redirectUrl);
			res.redirect(redirectUrl);
		} catch (error) {
			console.error("[Google OAuth] Error in callback:", error);
			console.error("[Google OAuth] Error stack:", error.stack);

			const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
				"google",
				null,
				"auth_failed"
			);
			res.redirect(redirectUrl);
		}
	},
];

/**
 * Apple authentication route
 * @route GET /auth/apple
 */
const appleAuth = (req, res, next) => {
	// Check if Apple OAuth is configured before attempting authentication
	const isConfigured = socialAuthService.isProviderConfigured("apple");

	if (!isConfigured) {
		console.log("[Auth] Apple OAuth not configured, redirecting to error page");
		const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
			"apple",
			null,
			"provider_not_configured"
		);
		return res.redirect(redirectUrl);
	}

	// Check if Apple strategy is actually registered with passport
	if (!passport._strategies.apple) {
		console.log(
			"[Auth] Apple strategy not registered with passport, redirecting to error page"
		);
		const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
			"apple",
			null,
			"provider_not_configured"
		);
		return res.redirect(redirectUrl);
	}

	// If configured, proceed with normal authentication
	return passport.authenticate("apple", { scope: ["name", "email"] })(
		req,
		res,
		next
	);
};

/**
 * Apple callback route
 * @route GET /auth/apple/callback
 */
const appleCallback = (req, res, next) => {
	// Check if Apple OAuth is configured before attempting callback processing
	const isConfigured = socialAuthService.isProviderConfigured("apple");

	if (!isConfigured) {
		console.log("[Auth] Apple OAuth not configured, redirecting to error page");
		const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
			"apple",
			null,
			"provider_not_configured"
		);
		return res.redirect(redirectUrl);
	}

	// If configured, proceed with normal callback processing
	return passport.authenticate("apple", { session: false })(
		req,
		res,
		async (err) => {
			try {
				if (err) {
					console.error("[Auth Flow] Error in Apple authentication:", err);
					const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
						"apple",
						null,
						"auth_failed"
					);
					return res.redirect(redirectUrl);
				}

				if (!req.user) {
					const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
						"apple",
						null,
						"auth_failed"
					);
					return res.redirect(redirectUrl);
				}

				// Handle Apple authentication
				const authResult = await socialAuthService.handleAppleAuth(req.user);

				// Set secure cookie in production
				setSocialAuthCookie(res, authResult.token);

				// Redirect to frontend with token
				const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
					"apple",
					authResult.token
				);
				res.redirect(redirectUrl);
			} catch (error) {
				console.error("[Auth Flow] Error in Apple callback:", error);
				const redirectUrl = socialAuthService.buildOAuthRedirectUrl(
					"apple",
					null,
					"auth_failed"
				);
				res.redirect(redirectUrl);
			}
		}
	);
};

/**
 * Get available OAuth providers
 * @route GET /auth/providers
 */
const getProviders = (req, res) => {
	try {
		const providers = socialAuthService.getAvailableProviders();

		res.status(200).json({
			providers,
			message: "Available OAuth providers",
		});
	} catch (error) {
		console.error("Error getting OAuth providers:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Check OAuth provider configuration
 * @route GET /auth/providers/:provider/status
 */
const getProviderStatus = (req, res) => {
	try {
		const { provider } = req.params;
		const isConfigured = socialAuthService.isProviderConfigured(provider);

		res.status(200).json({
			provider,
			configured: isConfigured,
			available: isConfigured,
		});
	} catch (error) {
		console.error(
			`Error checking ${req.params.provider} provider status:`,
			error
		);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	googleAuth,
	googleCallback,
	appleAuth,
	appleCallback,
	getProviders,
	getProviderStatus,
};
