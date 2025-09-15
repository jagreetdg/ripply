const universalAuthService = require("../../services/auth/universalAuthService");
const { setSocialAuthCookie } = require("../../utils/auth/tokenUtils");
const path = require("path");

/**
 * Universal OAuth Controller
 * Implements industry-standard OAuth 2.0 PKCE flow for all platforms
 * Works identically on web, iOS, Android, development, and production
 */

/**
 * Initiate OAuth flow for any provider
 * @route GET /auth/oauth/:provider
 */
const initiateOAuth = async (req, res) => {
	try {
		const { provider } = req.params;

		// Handle special routes that might be confused with provider names
		if (
			provider === "success" ||
			provider === "test" ||
			provider === "callback" ||
			provider === "providers"
		) {
			return res.status(404).json({
				error: "not_found",
				message: "OAuth endpoint not found",
			});
		}

		// Validate provider
		if (!["google", "apple"].includes(provider)) {
			return res.status(400).json({
				error: "unsupported_provider",
				message: `Provider '${provider}' is not supported`,
			});
		}

		// Check if provider is configured
		if (!universalAuthService.isProviderConfigured(provider)) {
			return res.status(400).json({
				error: "provider_not_configured",
				message: `${provider} OAuth is not configured on this server`,
			});
		}

		// Get base URL for redirect URI
		const baseUrl =
			process.env.BACKEND_URL ||
			(process.env.NODE_ENV === "production"
				? "https://ripply-backend.onrender.com"
				: `http://localhost:${process.env.PORT || 3000}`);

		// Generate OAuth URL with PKCE
		const oauthData = universalAuthService.generateUniversalOAuthURL(
			provider,
			baseUrl
		);

		console.log(`[Universal OAuth] Generated ${provider} OAuth URL`);

		// Check if this is a request for mobile (return URL) or web (redirect)
		if (req.query.return_url === "true") {
			// Return URL for mobile apps to handle
			return res.json({
				authUrl: oauthData.authUrl,
				state: oauthData.state,
				expiresAt: oauthData.expiresAt,
			});
		} else {
			// Redirect web browsers directly - this is the standard OAuth flow
			console.log(`[Universal OAuth] Redirecting to ${provider} OAuth URL`);
			return res.redirect(oauthData.authUrl);
		}
	} catch (error) {
		console.error(`[Universal OAuth] Error initiating OAuth:`, error);

		const redirectUrl = universalAuthService.generateUniversalRedirectURL(
			null,
			"oauth_init_failed"
		);

		return res.redirect(redirectUrl);
	}
};

/**
 * Handle OAuth callback for all providers
 * @route GET /auth/oauth/callback
 * @route POST /auth/oauth/callback (for Apple)
 */
const handleOAuthCallback = async (req, res) => {
	try {
		console.log("[Universal OAuth] Callback received");
		console.log("[Universal OAuth] Method:", req.method);
		console.log("[Universal OAuth] Query:", req.query);
		console.log("[Universal OAuth] Body:", req.body);

		// Extract code and state from query params or body (Apple uses POST)
		const code = req.query.code || req.body.code;
		const state = req.query.state || req.body.state;
		const error = req.query.error || req.body.error;

		// Handle OAuth errors
		if (error) {
			console.error("[Universal OAuth] OAuth provider error:", error);
			const redirectUrl = universalAuthService.generateUniversalRedirectURL(
				null,
				`oauth_error_${error}`
			);
			return res.redirect(redirectUrl);
		}

		// Validate required parameters
		if (!code || !state) {
			console.error("[Universal OAuth] Missing code or state parameter");
			const redirectUrl = universalAuthService.generateUniversalRedirectURL(
				null,
				"missing_parameters"
			);
			return res.redirect(redirectUrl);
		}

		// Get base URL for token exchange
		const baseUrl =
			process.env.BACKEND_URL ||
			(process.env.NODE_ENV === "production"
				? "https://ripply-backend.onrender.com"
				: `http://localhost:${process.env.PORT || 3000}`);

		// Exchange authorization code for tokens
		const authResult = await universalAuthService.exchangeCodeForToken(
			code,
			state,
			baseUrl
		);

		console.log("[Universal OAuth] Authentication successful:", {
			userId: authResult.user.id,
			provider: authResult.provider,
		});

		// Set secure cookie for web browsers
		setSocialAuthCookie(res, authResult.token);

		// For web browsers, redirect to the frontend with token as a URL parameter
		// This is the standard OAuth flow - frontend will handle the token
		const frontendUrl =
			process.env.FRONTEND_URL || "https://ripply-app.netlify.app";
		const redirectUrl = `${frontendUrl}/?auth_token=${encodeURIComponent(
			authResult.token
		)}`;

		console.log(
			"[Universal OAuth] Redirecting to frontend with token:",
			redirectUrl
		);
		return res.redirect(redirectUrl);
	} catch (error) {
		console.error("[Universal OAuth] Callback error:", error);

		// For web browsers, redirect to the frontend with error
		const frontendUrl =
			process.env.FRONTEND_URL || "https://ripply-app.netlify.app";
		const redirectUrl = `${frontendUrl}/?auth_error=${encodeURIComponent(
			"callback_failed"
		)}`;

		console.log(
			"[Universal OAuth] Redirecting to frontend with error:",
			redirectUrl
		);
		return res.redirect(redirectUrl);
	}
};

/**
 * Get available OAuth providers
 * @route GET /auth/oauth/providers
 */
const getAvailableProviders = (req, res) => {
	try {
		const providers = [];

		if (universalAuthService.isProviderConfigured("google")) {
			providers.push({
				id: "google",
				name: "Google",
				configured: true,
			});
		}

		if (universalAuthService.isProviderConfigured("apple")) {
			providers.push({
				id: "apple",
				name: "Apple",
				configured: true,
			});
		}

		res.json({
			providers,
			message: "Available OAuth providers",
		});
	} catch (error) {
		console.error("[Universal OAuth] Error getting providers:", error);
		res.status(500).json({
			error: "server_error",
			message: "Failed to get available providers",
		});
	}
};

/**
 * Check OAuth provider status
 * @route GET /auth/oauth/providers/:provider/status
 */
const getProviderStatus = (req, res) => {
	try {
		const { provider } = req.params;
		const isConfigured = universalAuthService.isProviderConfigured(provider);

		res.json({
			provider,
			configured: isConfigured,
			available: isConfigured,
		});
	} catch (error) {
		console.error(
			`[Universal OAuth] Error checking ${req.params.provider} status:`,
			error
		);
		res.status(500).json({
			error: "server_error",
			message: "Failed to check provider status",
		});
	}
};

/**
 * Test OAuth configuration
 * @route GET /auth/oauth/test
 */
const testOAuthConfig = (req, res) => {
	try {
		const config = {
			google: {
				configured: universalAuthService.isProviderConfigured("google"),
				hasClientId: !!process.env.GOOGLE_CLIENT_ID,
				hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
			},
			apple: {
				configured: universalAuthService.isProviderConfigured("apple"),
				hasClientId: !!process.env.APPLE_CLIENT_ID,
				hasTeamId: !!process.env.APPLE_TEAM_ID,
				hasKeyId: !!process.env.APPLE_KEY_ID,
				hasPrivateKey: !!(
					process.env.APPLE_PRIVATE_KEY ||
					process.env.APPLE_PRIVATE_KEY_LOCATION
				),
			},
		};

		res.json({
			message: "OAuth configuration status",
			config,
			environment: process.env.NODE_ENV,
			backendUrl: process.env.BACKEND_URL,
		});
	} catch (error) {
		console.error("[Universal OAuth] Error testing config:", error);
		res.status(500).json({
			error: "server_error",
			message: "Failed to test OAuth configuration",
		});
	}
};

module.exports = {
	initiateOAuth,
	handleOAuthCallback,
	getAvailableProviders,
	getProviderStatus,
	testOAuthConfig,

	/**
	 * Show OAuth success page for web browsers
	 * @route GET /auth/oauth-success
	 */
	showOAuthSuccess: (req, res) => {
		try {
			const filePath = path.join(__dirname, "../../views/oauth-success.html");
			return res.sendFile(filePath);
		} catch (error) {
			console.error("[Universal OAuth] Error showing success page:", error);
			return res.status(500).json({
				error: "server_error",
				message: "Failed to show success page",
			});
		}
	},
};
