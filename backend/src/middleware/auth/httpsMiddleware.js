/**
 * HTTPS enforcement middleware
 */

/**
 * Enforce HTTPS in production environments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const enforceHTTPS = (req, res, next) => {
	// Skip for local development
	if (process.env.NODE_ENV !== "production") {
		return next();
	}

	// Check if request is secure or via a proxy that sets X-Forwarded-Proto
	if (req.secure || req.headers["x-forwarded-proto"] === "https") {
		return next();
	}

	// Redirect to HTTPS
	return res.redirect("https://" + req.headers.host + req.url);
};

module.exports = {
	enforceHTTPS,
};
