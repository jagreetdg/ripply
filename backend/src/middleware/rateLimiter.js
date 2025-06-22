/**
 * Rate limiter middleware to prevent brute force attacks
 */
const rateLimit = {}; // In-memory store for rate limiting

/**
 * Reset the rate limit store (for testing purposes)
 */
const resetRateLimit = () => {
	Object.keys(rateLimit).forEach((key) => delete rateLimit[key]);
};

/**
 * Cleanup expired entries periodically to prevent memory leaks
 */
const cleanupExpiredEntries = () => {
	const now = Date.now();
	for (const ip in rateLimit) {
		if (rateLimit[ip].resetAt < now) {
			delete rateLimit[ip];
		}
	}
};

// Run cleanup every 5 minutes (only in non-test environments)
if (process.env.NODE_ENV !== "test") {
	setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Rate limiter middleware
 * @param {number} maxAttempts - Maximum number of attempts allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Error message to return when rate limit is exceeded
 * @returns {function} Express middleware function
 */
const rateLimiter = (
	maxAttempts = 5,
	windowMs = 15 * 60 * 1000,
	message = "Too many attempts, please try again later"
) => {
	return (req, res, next) => {
		// Get client IP - handle various proxy scenarios
		const ip =
			req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
			req.connection?.remoteAddress ||
			req.socket?.remoteAddress ||
			"127.0.0.1";

		// Validate inputs
		if (!ip) {
			return next(); // If we can't determine IP, allow the request
		}

		// Get current time
		const now = Date.now();

		// Initialize or clean up rate limit data for this IP
		if (!rateLimit[ip] || rateLimit[ip].resetAt < now) {
			// Reset count if window has expired or doesn't exist
			rateLimit[ip] = {
				count: 0,
				resetAt: now + windowMs,
			};
		}

		// Increment count
		rateLimit[ip].count++;

		// Add rate limit headers before checking limit
		res.setHeader("X-RateLimit-Limit", maxAttempts);
		res.setHeader(
			"X-RateLimit-Remaining",
			Math.max(0, maxAttempts - rateLimit[ip].count)
		);
		res.setHeader("X-RateLimit-Reset", Math.ceil(rateLimit[ip].resetAt / 1000)); // Unix timestamp

		// Check if rate limit exceeded
		if (rateLimit[ip].count > maxAttempts) {
			return res.status(429).json({
				message,
				retryAfter: Math.ceil((rateLimit[ip].resetAt - now) / 1000), // seconds until reset
			});
		}

		next();
	};
};

// Export the main function and the reset function for testing
rateLimiter.resetRateLimit = resetRateLimit;

module.exports = rateLimiter;
