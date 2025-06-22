/**
 * Validation utilities for authentication
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} Validation result with isValid and message
 */
const validateUsername = (username) => {
	if (!username) {
		return { isValid: false, message: "Username is required" };
	}

	// Alphanumeric, underscore, period, 3-30 chars
	const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;

	if (!usernameRegex.test(username)) {
		return {
			isValid: false,
			message:
				"Username must be 3-30 characters and can only contain letters, numbers, underscores, and periods",
		};
	}

	return { isValid: true };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
const validatePassword = (password) => {
	if (!password) {
		return { isValid: false, message: "Password is required" };
	}

	if (password.length < 8) {
		return {
			isValid: false,
			message: "Password must be at least 8 characters long",
		};
	}

	// Could add more sophisticated password validation here
	// e.g., requiring uppercase, lowercase, numbers, special chars

	return { isValid: true };
};

/**
 * Validate registration data
 * @param {Object} data - Registration data
 * @returns {Object} Validation result with isValid, message, and field
 */
const validateRegistrationData = (data) => {
	const { username, email, password, displayName, timestamp } = data;

	// Check required fields
	if (!username || !email || !password) {
		return {
			isValid: false,
			message:
				"Missing required fields: username, email, and password are required",
		};
	}

	// Validate email
	if (!isValidEmail(email)) {
		return {
			isValid: false,
			message: "Invalid email format",
			field: "email",
		};
	}

	// Validate username
	const usernameValidation = validateUsername(username);
	if (!usernameValidation.isValid) {
		return {
			isValid: false,
			message: usernameValidation.message,
			field: "username",
		};
	}

	// Validate password
	const passwordValidation = validatePassword(password);
	if (!passwordValidation.isValid) {
		return {
			isValid: false,
			message: passwordValidation.message,
			field: "password",
		};
	}

	// Validate timestamp to prevent replay attacks (within 5 minutes)
	if (timestamp) {
		const currentTime = Date.now();
		const requestTime = timestamp;
		if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
			// 5 minutes
			return {
				isValid: false,
				message: "Request expired, please try again",
			};
		}
	}

	return { isValid: true };
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} Validation result with isValid and message
 */
const validateLoginData = (data) => {
	const { email, password, timestamp } = data;

	if (!email || !password) {
		return {
			isValid: false,
			message: "Email and password are required",
		};
	}

	if (!isValidEmail(email)) {
		return {
			isValid: false,
			message: "Invalid email format",
			field: "email",
		};
	}

	// Validate timestamp to prevent replay attacks (within 5 minutes)
	if (timestamp) {
		const currentTime = Date.now();
		const requestTime = timestamp;
		if (Math.abs(currentTime - requestTime) > 5 * 60 * 1000) {
			// 5 minutes
			return {
				isValid: false,
				message: "Request expired, please try again",
			};
		}
	}

	return { isValid: true };
};

module.exports = {
	isValidEmail,
	validateUsername,
	validatePassword,
	validateRegistrationData,
	validateLoginData,
};
