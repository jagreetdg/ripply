const authService = require("../../services/auth/authService");
const {
	validateRegistrationData,
	validateLoginData,
} = require("../../utils/auth/validationUtils");
const {
	generateToken,
	verifyToken,
	setAuthCookie,
	clearAuthCookie,
	extractToken,
} = require("../../utils/auth/tokenUtils");

/**
 * Authentication controller
 */

/**
 * Check if username is available
 * @route GET /auth/check-username/:username
 */
const checkUsername = async (req, res) => {
	try {
		const { username } = req.params;

		const availability = await authService.checkUsernameAvailability(username);

		res.status(200).json(availability);
	} catch (error) {
		console.error("Error checking username:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Check if email is available
 * @route GET /auth/check-email/:email
 */
const checkEmail = async (req, res) => {
	try {
		const { email } = req.params;

		const availability = await authService.checkEmailAvailability(email);

		res.status(200).json(availability);
	} catch (error) {
		console.error("Error checking email:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Register a new user
 * @route POST /auth/register
 */
const register = async (req, res) => {
	try {
		const userData = req.body;

		// Validate input data
		const validation = validateRegistrationData(userData);
		if (!validation.isValid) {
			return res.status(400).json({
				message: validation.message,
				field: validation.field,
			});
		}

		// Create user
		const user = await authService.registerUser(userData);

		// Generate JWT token
		const token = generateToken(user);

		// Set secure cookie
		setAuthCookie(res, token);

		res.status(201).json({
			message: "User registered successfully",
			user,
			token,
		});
	} catch (error) {
		console.error("Error registering user:", error);

		// Handle specific errors
		if (error.message === "Username already exists") {
			return res.status(400).json({
				message: error.message,
				field: "username",
			});
		}

		if (error.message === "Email already exists") {
			return res.status(400).json({
				message: error.message,
				field: "email",
			});
		}

		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Login user
 * @route POST /auth/login
 */
const login = async (req, res) => {
	try {
		const { email, password, rememberMe, timestamp } = req.body;

		// Validate input data
		const validation = validateLoginData({ email, password, timestamp });
		if (!validation.isValid) {
			return res.status(400).json({
				message: validation.message,
				...(validation.field && { field: validation.field }),
			});
		}

		// Authenticate user
		const user = await authService.authenticateUser(email, password);

		// Update last login
		await authService.updateLastLogin(user.id);

		// Generate JWT token
		const token = generateToken(user, rememberMe);

		// Set secure cookie
		setAuthCookie(res, token, rememberMe);

		res.status(200).json({
			message: "Login successful",
			user,
			token,
		});
	} catch (error) {
		console.error("Error logging in:", error);

		// Handle specific errors
		if (
			error.message ===
			"Account temporarily locked due to too many failed attempts"
		) {
			return res.status(423).json({ message: error.message });
		}

		if (error.message === "Invalid credentials") {
			return res.status(401).json({ message: error.message });
		}

		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Logout user
 * @route POST /auth/logout
 */
const logout = (req, res) => {
	try {
		// Clear the auth cookie
		clearAuthCookie(res);

		res.status(200).json({
			message: "Logged out successfully",
		});
	} catch (error) {
		console.error("Error logging out:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Verify token
 * @route GET /auth/verify-token
 */
const verifyTokenEndpoint = async (req, res) => {
	try {
		// Get token from Authorization header or cookie
		const token = extractToken(req);

		if (!token) {
			return res.status(401).json({ message: "No token provided" });
		}

		// Verify token
		const decoded = verifyToken(token);

		// Get user from database
		const user = await authService.validateUserForToken(decoded.id);

		if (!user) {
			return res.status(401).json({ message: "Invalid token" });
		}

		res.status(200).json({
			message: "Token verified",
			user,
		});
	} catch (error) {
		console.error("Error verifying token:", error);
		res.status(401).json({ message: "Invalid token" });
	}
};

/**
 * Get current user profile
 * @route GET /auth/me
 */
const getCurrentUser = async (req, res) => {
	try {
		// Extract token
		const token = extractToken(req);

		if (!token) {
			return res.status(401).json({ message: "No token provided" });
		}

		// Verify token
		const decoded = verifyToken(token);

		// Get current user data
		const user = await authService.getUserById(decoded.id);

		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		res.status(200).json({
			message: "User profile retrieved",
			user,
		});
	} catch (error) {
		console.error("Error getting current user:", error);
		res.status(401).json({ message: "Invalid token" });
	}
};

module.exports = {
	checkUsername,
	checkEmail,
	register,
	login,
	logout,
	verifyTokenEndpoint,
	getCurrentUser,
};
