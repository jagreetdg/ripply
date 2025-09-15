const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { supabaseAdmin } = require("../../config/supabase");
const { generateToken } = require("../../utils/auth/tokenUtils");

/**
 * Universal Authentication Service
 * Implements industry-standard OAuth 2.0 PKCE flow used by major platforms
 * Works identically across all platforms (web, iOS, Android, development, production)
 */

// In-memory store for PKCE challenges (in production, use Redis or database)
const pkceStore = new Map();

// Clean up expired PKCE challenges every 10 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, value] of pkceStore.entries()) {
		if (now - value.created > 10 * 60 * 1000) {
			// 10 minutes
			pkceStore.delete(key);
		}
	}
}, 10 * 60 * 1000);

/**
 * Generate OAuth 2.0 PKCE parameters
 * @returns {Object} PKCE challenge parameters
 */
const generatePKCEChallenge = () => {
	const codeVerifier = crypto.randomBytes(32).toString("base64url");
	const codeChallenge = crypto
		.createHash("sha256")
		.update(codeVerifier)
		.digest("base64url");

	const state = crypto.randomBytes(16).toString("hex");

	return {
		codeVerifier,
		codeChallenge,
		state,
		codeChallengeMethod: "S256",
	};
};

/**
 * Generate universal OAuth URL for any provider
 * @param {string} provider - OAuth provider (google, apple, facebook)
 * @param {string} baseUrl - Backend base URL
 * @returns {Object} OAuth URL and state information
 */
const generateUniversalOAuthURL = (provider, baseUrl) => {
	const pkce = generatePKCEChallenge();

	// Store PKCE challenge for verification
	pkceStore.set(pkce.state, {
		...pkce,
		provider,
		created: Date.now(),
	});

	let authUrl = "";

	switch (provider) {
		case "google":
			authUrl =
				`https://accounts.google.com/o/oauth2/v2/auth?` +
				`client_id=${process.env.GOOGLE_CLIENT_ID}&` +
				`redirect_uri=${encodeURIComponent(
					`${baseUrl}/api/auth/oauth/callback`
				)}&` +
				`response_type=code&` +
				`scope=${encodeURIComponent("profile email")}&` +
				`code_challenge=${pkce.codeChallenge}&` +
				`code_challenge_method=S256&` +
				`state=${pkce.state}&` +
				`prompt=select_account`;
			break;

		case "apple":
			authUrl =
				`https://appleid.apple.com/auth/authorize?` +
				`client_id=${process.env.APPLE_CLIENT_ID}&` +
				`redirect_uri=${encodeURIComponent(
					`${baseUrl}/api/auth/oauth/callback`
				)}&` +
				`response_type=code&` +
				`scope=${encodeURIComponent("name email")}&` +
				`code_challenge=${pkce.codeChallenge}&` +
				`code_challenge_method=S256&` +
				`state=${pkce.state}&` +
				`response_mode=form_post`;
			break;

		default:
			throw new Error(`Unsupported OAuth provider: ${provider}`);
	}

	return {
		authUrl,
		state: pkce.state,
		expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
	};
};

/**
 * Exchange authorization code for tokens using OAuth 2.0 PKCE
 * @param {string} code - Authorization code from OAuth provider
 * @param {string} state - State parameter for CSRF protection
 * @param {string} baseUrl - Backend base URL
 * @returns {Object} User data and JWT token
 */
const exchangeCodeForToken = async (code, state, baseUrl) => {
	// Retrieve and validate PKCE challenge
	const pkceData = pkceStore.get(state);
	if (!pkceData) {
		throw new Error("Invalid or expired OAuth state");
	}

	// Clean up used PKCE challenge
	pkceStore.delete(state);

	const { provider, codeVerifier } = pkceData;

	let tokenUrl = "";
	let tokenRequestBody = {};

	switch (provider) {
		case "google":
			tokenUrl = "https://oauth2.googleapis.com/token";
			tokenRequestBody = {
				client_id: process.env.GOOGLE_CLIENT_ID,
				client_secret: process.env.GOOGLE_CLIENT_SECRET,
				code,
				grant_type: "authorization_code",
				redirect_uri: `${baseUrl}/api/auth/oauth/callback`,
				code_verifier: codeVerifier,
			};
			break;

		case "apple":
			// Apple requires client_secret to be a JWT
			const appleClientSecret = generateAppleClientSecret();
			tokenUrl = "https://appleid.apple.com/auth/token";
			tokenRequestBody = {
				client_id: process.env.APPLE_CLIENT_ID,
				client_secret: appleClientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: `${baseUrl}/api/auth/oauth/callback`,
				code_verifier: codeVerifier,
			};
			break;

		default:
			throw new Error(`Unsupported OAuth provider: ${provider}`);
	}

	// Exchange code for access token
	const tokenResponse = await fetch(tokenUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams(tokenRequestBody).toString(),
	});

	if (!tokenResponse.ok) {
		const error = await tokenResponse.text();
		console.error(`[OAuth] Token exchange failed for ${provider}:`, error);
		throw new Error(`Failed to exchange authorization code for ${provider}`);
	}

	const tokenData = await tokenResponse.json();

	// Get user profile from OAuth provider
	const userProfile = await getUserProfile(
		provider,
		tokenData.access_token,
		tokenData.id_token
	);

	// Create or update user in database
	const user = await createOrUpdateSocialUser(userProfile, provider);

	// Generate JWT token for our app
	const jwtToken = generateToken(user);

	return {
		user,
		token: jwtToken,
		provider,
	};
};

/**
 * Get user profile from OAuth provider
 * @param {string} provider - OAuth provider
 * @param {string} accessToken - Access token
 * @param {string} idToken - ID token (for some providers)
 * @returns {Object} User profile data
 */
const getUserProfile = async (provider, accessToken, idToken = null) => {
	let profileUrl = "";
	let headers = {};

	switch (provider) {
		case "google":
			profileUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
			headers = {
				Authorization: `Bearer ${accessToken}`,
			};
			break;

		case "apple":
			// For Apple, decode the ID token to get user info
			if (!idToken) {
				throw new Error("Apple OAuth requires ID token");
			}

			// Decode JWT without verification (we trust it came from Apple's servers)
			const applePayload = JSON.parse(
				Buffer.from(idToken.split(".")[1], "base64").toString()
			);

			return {
				id: applePayload.sub,
				email: applePayload.email,
				name: applePayload.name || null,
				picture: null, // Apple doesn't provide profile pictures
			};

		default:
			throw new Error(`Unsupported OAuth provider: ${provider}`);
	}

	if (profileUrl) {
		const profileResponse = await fetch(profileUrl, { headers });

		if (!profileResponse.ok) {
			throw new Error(`Failed to fetch user profile from ${provider}`);
		}

		return await profileResponse.json();
	}
};

/**
 * Create or update user from social OAuth
 * @param {Object} profile - User profile from OAuth provider
 * @param {string} provider - OAuth provider
 * @returns {Object} User data
 */
const createOrUpdateSocialUser = async (profile, provider) => {
	const email = profile.email;

	if (!email) {
		throw new Error("Email is required from OAuth provider");
	}

	console.log(`[Universal Auth] Processing ${provider} user:`, email);

	// Check if user already exists
	const { data: existingUser, error: findError } = await supabaseAdmin
		.from("users")
		.select("*")
		.eq("email", email)
		.single();

	if (findError && findError.code !== "PGRST116") {
		throw findError;
	}

	if (existingUser) {
		// Update existing user with OAuth provider ID
		const updateData = {
			updated_at: new Date().toISOString(),
		};

		// Add provider-specific ID
		if (provider === "google" && !existingUser.google_id) {
			updateData.google_id = profile.id;
		} else if (provider === "apple" && !existingUser.apple_id) {
			updateData.apple_id = profile.id;
		}

		const { data: updatedUser, error: updateError } = await supabaseAdmin
			.from("users")
			.update(updateData)
			.eq("id", existingUser.id)
			.select()
			.single();

		if (updateError) throw updateError;

		// Remove password from response
		const { password: _, ...userWithoutPassword } = updatedUser;
		return userWithoutPassword;
	}

	// Create new user
	const userId = uuidv4();
	const baseUsername = profile.name
		? profile.name.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "")
		: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");

	// Generate unique username
	let username = baseUsername + Math.floor(Math.random() * 1000);
	let attempts = 0;

	while (attempts < 10) {
		const { data: usernameCheck } = await supabaseAdmin
			.from("users")
			.select("id")
			.eq("username", username);

		if (!usernameCheck || usernameCheck.length === 0) {
			break;
		}

		attempts++;
		username = baseUsername + Math.floor(Math.random() * 10000);
	}

	const userData = {
		id: userId,
		username,
		email,
		display_name: profile.name || baseUsername,
		avatar_url: profile.picture || null,
		is_sso_user: true,
		is_anonymous: false,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	// Add provider-specific ID
	if (provider === "google") {
		userData.google_id = profile.id;
	} else if (provider === "apple") {
		userData.apple_id = profile.id;
	}

	const { data: newUser, error: createError } = await supabaseAdmin
		.from("users")
		.insert(userData)
		.select()
		.single();

	if (createError) throw createError;

	console.log(`[Universal Auth] Created new ${provider} user:`, newUser.id);
	return newUser;
};

/**
 * Generate Apple client secret JWT
 * @returns {string} Apple client secret JWT
 */
const generateAppleClientSecret = () => {
	if (
		!process.env.APPLE_PRIVATE_KEY &&
		!process.env.APPLE_PRIVATE_KEY_LOCATION
	) {
		throw new Error("Apple private key not configured");
	}

	let privateKey;
	if (process.env.APPLE_PRIVATE_KEY) {
		privateKey = Buffer.from(process.env.APPLE_PRIVATE_KEY, "base64").toString(
			"utf-8"
		);
	} else {
		const fs = require("fs");
		privateKey = fs.readFileSync(
			process.env.APPLE_PRIVATE_KEY_LOCATION,
			"utf8"
		);
	}

	const payload = {
		iss: process.env.APPLE_TEAM_ID,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
		aud: "https://appleid.apple.com",
		sub: process.env.APPLE_CLIENT_ID,
	};

	return jwt.sign(payload, privateKey, {
		algorithm: "ES256",
		keyid: process.env.APPLE_KEY_ID,
	});
};

/**
 * Generate universal redirect URL for all platforms
 * @param {string} token - JWT token (if success)
 * @param {string} error - Error message (if failure)
 * @returns {string} Universal redirect URL
 */
const generateUniversalRedirectURL = (token = null, error = null) => {
	// Use a single universal deep link that works for all platforms
	const baseUrl = "ripply://auth/callback";

	if (error) {
		return `${baseUrl}?error=${encodeURIComponent(error)}`;
	}

	if (token) {
		return `${baseUrl}?token=${encodeURIComponent(token)}`;
	}

	return `${baseUrl}?error=unknown_error`;
};

/**
 * Check if OAuth provider is properly configured
 * @param {string} provider - OAuth provider name
 * @returns {boolean} Whether provider is configured
 */
const isProviderConfigured = (provider) => {
	switch (provider) {
		case "google":
			return !!(
				process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			);
		case "apple":
			return !!(
				process.env.APPLE_CLIENT_ID &&
				process.env.APPLE_TEAM_ID &&
				process.env.APPLE_KEY_ID &&
				(process.env.APPLE_PRIVATE_KEY ||
					process.env.APPLE_PRIVATE_KEY_LOCATION)
			);
		default:
			return false;
	}
};

module.exports = {
	generateUniversalOAuthURL,
	exchangeCodeForToken,
	generateUniversalRedirectURL,
	isProviderConfigured,
	generatePKCEChallenge,
	createOrUpdateSocialUser,
};
