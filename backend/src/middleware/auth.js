/**
 * Authentication middleware for protecting routes
 */
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// JWT Secret - must be provided in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	console.error("JWT_SECRET environment variable is required");
	process.exit(1);
}

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
	try {
		// Get token from Authorization header or cookie
		const token =
			req.headers.authorization?.split(" ")[1] || req.cookies?.auth_token;

		if (!token) {
			return res.status(401).json({ message: "Authentication required" });
		}

		// Verify token
		const decoded = jwt.verify(token, JWT_SECRET);

		// Get user from database
		const { data: user, error } = await supabase
			.from("users")
			.select(
				"id, username, email, display_name, avatar_url, bio, is_verified, created_at, updated_at"
			)
			.eq("id", decoded.id)
			.single();

		if (error || !user) {
			return res.status(401).json({ message: "Invalid token" });
		}

		// Ensure password is never included in the user object
		const { password, ...userWithoutPassword } = user;

		// Attach user to request
		req.user = userWithoutPassword;

		next();
	} catch (error) {
		console.error("Authentication error:", error);

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ message: "Token expired" });
		}

		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({ message: "Invalid token" });
		}

		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Middleware to check if user is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireVerified = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({ message: "Authentication required" });
	}

	if (!req.user.is_verified) {
		return res.status(403).json({ message: "Account verification required" });
	}

	next();
};

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = async (req, res, next) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		// Check if user is an admin
		const { data, error } = await supabase
			.from("user_roles")
			.select("role")
			.eq("user_id", req.user.id)
			.eq("role", "admin")
			.single();

		if (error || !data) {
			return res.status(403).json({ message: "Admin access required" });
		}

		next();
	} catch (error) {
		console.error("Admin check error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	authenticateToken,
	requireVerified,
	requireAdmin,
};
