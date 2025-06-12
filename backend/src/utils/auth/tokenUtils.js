const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Utility functions for JWT token management
 */

// JWT Secret - in production, this would be an environment variable
const JWT_SECRET =
	process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex");

// Token expiration time
const TOKEN_EXPIRATION = "7d"; // 7 days

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @param {boolean} rememberMe - Whether to use extended expiration
 * @returns {string} JWT token
 */
const generateToken = (user, rememberMe = false) => {
	const expiresIn = rememberMe ? "30d" : "7d"; // 30 days if rememberMe is true, 7 days otherwise

	return jwt.sign(
		{ id: user.id, email: user.email, username: user.username },
		JWT_SECRET,
		{ expiresIn }
	);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
	return jwt.verify(token, JWT_SECRET);
};

/**
 * Set secure authentication cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {boolean} rememberMe - Whether to use extended expiration
 */
const setAuthCookie = (res, token, rememberMe = false) => {
	// Only set secure cookie in production
	if (process.env.NODE_ENV === "production") {
		res.cookie("auth_token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: rememberMe
				? 30 * 24 * 60 * 60 * 1000 // 30 days
				: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
	}
};

/**
 * Clear authentication cookie
 * @param {Object} res - Express response object
 */
const clearAuthCookie = (res) => {
	res.clearCookie("auth_token");
};

/**
 * Extract token from request (header or cookie)
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
const extractToken = (req) => {
	return req.headers.authorization?.split(" ")[1] || req.cookies?.auth_token;
};

/**
 * Generate token for social auth redirect
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateSocialAuthToken = (user) => {
	return jwt.sign({ id: user.id }, JWT_SECRET, {
		expiresIn: TOKEN_EXPIRATION,
	});
};

/**
 * Set social auth cookie (for OAuth flows)
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
const setSocialAuthCookie = (res, token) => {
	if (process.env.NODE_ENV === "production") {
		res.cookie("token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
	}
};

module.exports = {
	JWT_SECRET,
	TOKEN_EXPIRATION,
	generateToken,
	verifyToken,
	setAuthCookie,
	clearAuthCookie,
	extractToken,
	generateSocialAuthToken,
	setSocialAuthCookie,
};
