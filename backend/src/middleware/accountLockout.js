/**
 * Account lockout middleware to prevent brute force attacks
 */
const supabase = require("../config/supabase");

// Maximum number of failed attempts before locking account
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in minutes
const LOCKOUT_DURATION = 60;

/**
 * Check if an account is locked
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Whether the account is locked
 */
const isAccountLocked = async (email) => {
	try {
		const { data, error } = await supabase
			.from("account_lockouts")
			.select("failed_attempts, last_failed_attempt")
			.eq("email", email)
			.single();

		if (error || !data) return false;

		// Check if we have enough failed attempts to trigger lockout
		if (data.failed_attempts < MAX_FAILED_ATTEMPTS) return false;

		// Check if lockout has expired (1 hour after last failed attempt)
		if (data.last_failed_attempt) {
			const lockoutExpiry = new Date(
				new Date(data.last_failed_attempt).getTime() +
					LOCKOUT_DURATION * 60 * 1000
			);
			return new Date() < lockoutExpiry;
		}

		return false;
	} catch (error) {
		console.error("Error checking account lockout:", error);
		return false;
	}
};

/**
 * Get the number of failed attempts for an email
 * @param {string} email - User email
 * @returns {Promise<number>} - Number of failed attempts
 */
const getFailedAttempts = async (email) => {
	try {
		const { data, error } = await supabase
			.from("account_lockouts")
			.select("failed_attempts")
			.eq("email", email)
			.single();

		if (error || !data) return 0;

		return data.failed_attempts || 0;
	} catch (error) {
		console.error("Error getting failed attempts:", error);
		return 0;
	}
};

/**
 * Record a failed login attempt
 * @param {string} email - User email
 * @returns {Promise<boolean>} - Whether the account is now locked
 */
const recordFailedAttempt = async (email) => {
	try {
		// Get current failed attempts
		const { data, error } = await supabase
			.from("account_lockouts")
			.select("failed_attempts, last_failed_attempt")
			.eq("email", email)
			.single();

		let failedAttempts = 1;

		// If record exists, check if lockout has expired
		if (data && !error) {
			if (data.last_failed_attempt) {
				const lockoutExpiry = new Date(
					new Date(data.last_failed_attempt).getTime() +
						LOCKOUT_DURATION * 60 * 1000
				);

				// If lockout has expired, reset attempts to 1
				if (new Date() >= lockoutExpiry) {
					failedAttempts = 1;
				} else {
					// Lockout still active, increment attempts
					failedAttempts = (data.failed_attempts || 0) + 1;
				}
			} else {
				// No previous lockout, increment attempts
				failedAttempts = (data.failed_attempts || 0) + 1;
			}

			// Update existing record
			await supabase
				.from("account_lockouts")
				.update({
					failed_attempts: failedAttempts,
					last_failed_attempt: new Date().toISOString(),
				})
				.eq("email", email);
		} else {
			// Insert new record
			await supabase.from("account_lockouts").insert({
				email,
				failed_attempts: failedAttempts,
				last_failed_attempt: new Date().toISOString(),
			});
		}

		// Return whether account is now locked
		return failedAttempts >= MAX_FAILED_ATTEMPTS;
	} catch (error) {
		console.error("Error recording failed attempt:", error);
		return false;
	}
};

/**
 * Reset failed login attempts
 * @param {string} email - User email
 */
const resetFailedAttempts = async (email) => {
	try {
		// First check if record exists
		const { data, error } = await supabase
			.from("account_lockouts")
			.select("id")
			.eq("email", email)
			.single();

		// Only update if record exists
		if (data && !error) {
			await supabase
				.from("account_lockouts")
				.update({
					failed_attempts: 0,
					last_failed_attempt: null,
				})
				.eq("email", email);
		}
	} catch (error) {
		console.error("Error resetting failed attempts:", error);
	}
};

module.exports = {
	isAccountLocked,
	recordFailedAttempt,
	resetFailedAttempts,
	getFailedAttempts,
	MAX_FAILED_ATTEMPTS,
	LOCKOUT_DURATION,
};
