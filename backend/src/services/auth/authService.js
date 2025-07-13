const supabase = require("../../config/supabase");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const {
	isAccountLocked,
	recordFailedAttempt,
	resetFailedAttempts,
} = require("../../middleware/accountLockout");

/**
 * Core authentication service
 */

/**
 * Check if username exists
 * @param {string} username - Username to check
 * @returns {Object} Availability status
 */
const checkUsernameAvailability = async (username) => {
	const { data, error } = await supabase
		.from("users")
		.select("id")
		.eq("username", username);

	if (error) throw error;

	const exists = data && data.length > 0;
	return {
		exists,
		available: !exists,
	};
};

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Object} Availability status
 */
const checkEmailAvailability = async (email) => {
	const { data, error } = await supabase
		.from("users")
		.select("id")
		.eq("email", email);

	if (error) throw error;

	const exists = data && data.length > 0;
	return {
		exists,
		available: !exists,
	};
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user data
 */
const registerUser = async (userData) => {
	const { username, email, password, displayName } = userData;

	// Check if username already exists
	const usernameCheck = await checkUsernameAvailability(username);
	if (usernameCheck.exists) {
		throw new Error("Username already exists");
	}

	// Check if email already exists
	const emailCheck = await checkEmailAvailability(email);
	if (emailCheck.exists) {
		throw new Error("Email already exists");
	}

	// Hash password with bcrypt (additional server-side hashing)
	// Note: The password is already hashed client-side with SHA-256
	const saltRounds = 10;
	const hashedPassword = await bcrypt.hash(password, saltRounds);

	// Generate a unique UUID for the user
	const userId = uuidv4();

	// Create user record
	const { data, error } = await supabase
		.from("users")
		.insert([
			{
				id: userId,
				username,
				email,
				password: hashedPassword,
				display_name: displayName || username,
				created_at: new Date().toISOString(),
			},
		])
		.select()
		.single();

	if (error) throw error;

	// Remove password from response
	const { password: _, ...userWithoutPassword } = data;

	return userWithoutPassword;
};

/**
 * Authenticate user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User data if authentication successful
 */
const authenticateUser = async (email, password) => {
	// Check if account is locked
	const accountLocked = await isAccountLocked(email);
	if (accountLocked) {
		throw new Error(
			"Account temporarily locked due to too many failed attempts"
		);
	}

	// Get user by email
	const { data: users, error } = await supabase
		.from("users")
		.select("*")
		.eq("email", email);

	if (error) throw error;

	if (!users || users.length === 0) {
		await recordFailedAttempt(email);
		throw new Error("Invalid credentials");
	}

	const user = users[0];

	// Compare passwords
	// Note: The password from client is already hashed with SHA-256
	const passwordMatch = await bcrypt.compare(password, user.password);

	if (!passwordMatch) {
		await recordFailedAttempt(email);
		throw new Error("Invalid credentials");
	}

	// Reset failed attempts on successful login
	await resetFailedAttempts(email);

	// Remove password from response
	const { password: _, ...userWithoutPassword } = user;

	return userWithoutPassword;
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User data without password
 */
const getUserById = async (userId) => {
	const { data: user, error } = await supabase
		.from("users")
		.select("*")
		.eq("id", userId)
		.single();

	if (error || !user) {
		return null;
	}

	// Remove password from response
	const { password: _, ...userWithoutPassword } = user;

	return userWithoutPassword;
};

/**
 * Validate user credentials for token verification
 * @param {string} userId - User ID from token
 * @returns {Object|null} User data if valid
 */
const validateUserForToken = async (userId) => {
	return await getUserById(userId);
};

/**
 * Check if user exists for social auth
 * @param {string} email - User email
 * @returns {Object|null} User data if exists
 */
const findUserByEmail = async (email) => {
	const { data: user, error } = await supabase
		.from("users")
		.select("*")
		.eq("email", email)
		.single();

	if (error || !user) {
		return null;
	}

	// Remove password from response
	const { password: _, ...userWithoutPassword } = user;

	return userWithoutPassword;
};

/**
 * Create user from social auth
 * @param {Object} profile - Social auth profile data
 * @param {string} provider - Auth provider (google, apple)
 * @returns {Object} Created user data
 */
const createSocialUser = async (profile, provider) => {
	const userId = uuidv4();

	// Extract common fields from social profile
	const userData = {
		id: userId,
		email: profile.email,
		username: profile.email.split("@")[0] + "_" + provider, // Generate username from email
		display_name:
			profile.displayName || profile.name || profile.email.split("@")[0],
		avatar_url: profile.picture || profile.photos?.[0]?.value,
		created_at: new Date().toISOString(),
	};

	// Add provider-specific ID field based on provider
	if (provider === "google") {
		userData.google_id = profile.id;
	} else if (provider === "apple") {
		userData.apple_id = profile.id;
	}

	const { data, error } = await supabase
		.from("users")
		.insert([userData])
		.select()
		.single();

	if (error) throw error;

	return data;
};

/**
 * Update user's last login timestamp
 * @param {string} userId - User ID
 */
const updateLastLogin = async (userId) => {
	try {
		// Use updated_at instead of last_login since last_login column doesn't exist
		await supabase
			.from("users")
			.update({ updated_at: new Date().toISOString() })
			.eq("id", userId);
	} catch (error) {
		// Don't throw error if last login update fails - it's not critical
		console.warn("[Auth] Failed to update last login:", error.message);
	}
};

module.exports = {
	checkUsernameAvailability,
	checkEmailAvailability,
	registerUser,
	authenticateUser,
	getUserById,
	validateUserForToken,
	findUserByEmail,
	createSocialUser,
	updateLastLogin,
};
