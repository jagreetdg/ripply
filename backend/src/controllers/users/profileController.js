const profileService = require("../../services/users/profileService");

/**
 * Controller for user profile management
 */

/**
 * Get current authenticated user
 * @route GET /api/users/me
 */
const getCurrentUser = async (req, res) => {
	try {
		console.log("[DEBUG] Returning authenticated user info from /me endpoint");

		// The user is already attached to the request by the authenticateToken middleware
		if (!req.user) {
			return res.status(401).json({ message: "User not authenticated" });
		}

		res.status(200).json(req.user);
	} catch (error) {
		console.error("[ERROR] Error fetching current user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get user profile by ID
 * @route GET /api/users/:userId
 */
const getUserById = async (req, res) => {
	try {
		const { userId } = req.params;

		const user = await profileService.getUserById(userId);

		if (!user) {
			console.log(`User not found with ID: ${userId}`);
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get user profile by username
 * @route GET /api/users/username/:username
 */
const getUserByUsername = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await profileService.getUserByUsername(username);

		if (!user) {
			console.log(`User not found with username: ${username}`);
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(user);
	} catch (error) {
		console.error("Error fetching user by username:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Update user profile
 * @route PUT /api/users/:userId
 */
const updateUserProfile = async (req, res) => {
	try {
		console.log("[PROFILE UPDATE DEBUG] Request received:", {
			userId: req.params.userId,
			updates: req.body,
			userFromToken: req.user
				? { id: req.user.id, username: req.user.username }
				: null,
		});

		const { userId } = req.params;
		const updates = req.body;

		const updatedUser = await profileService.updateUserProfile(userId, updates);

		console.log("[PROFILE UPDATE DEBUG] Update successful:", updatedUser);
		res.status(200).json(updatedUser);
	} catch (error) {
		console.error("[PROFILE UPDATE DEBUG] Error details:", {
			message: error.message,
			code: error.code,
			details: error.details,
			hint: error.hint,
			stack: error.stack,
		});

		if (error.message === "User not found") {
			return res.status(404).json({ message: error.message });
		}

		// Check for specific database errors
		if (error.code === "23505") {
			// Unique constraint violation
			if (error.message.includes("username")) {
				return res.status(400).json({
					message: "Username is already taken",
					field: "username",
				});
			}
			if (error.message.includes("email")) {
				return res.status(400).json({
					message: "Email is already taken",
					field: "email",
				});
			}
		}

		console.error("Error updating user:", error);
		res.status(500).json({
			message: "Server error",
			error: error.message,
			details: error.details || null,
		});
	}
};

/**
 * Search for users
 * @route GET /api/users/search
 */
const searchUsers = async (req, res) => {
	try {
		const { term, currentUserId, page = 1, limit = 20 } = req.query;

		console.log(`[DEBUG] Searching for users with term: "${term}"`);

		if (!term || term.trim() === "") {
			return res.status(200).json([]);
		}

		const result = await profileService.searchUsers(term, {
			page: parseInt(page),
			limit: parseInt(limit),
			excludeUserId: currentUserId,
		});

		console.log(`[DEBUG] Found ${result.data.length} users matching "${term}"`);
		res.status(200).json(result.data);
	} catch (error) {
		console.error("Error searching users:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Update user verification status
 * @route PATCH /api/users/:userId/verify
 */
const updateVerificationStatus = async (req, res) => {
	try {
		const { userId } = req.params;
		const { isVerified } = req.body;

		if (isVerified === undefined) {
			return res.status(400).json({ message: "isVerified field is required" });
		}

		const updatedUser = await profileService.updateVerificationStatus(
			userId,
			isVerified
		);
		res.status(200).json(updatedUser);
	} catch (error) {
		if (error.message === "User not found") {
			return res.status(404).json({ message: error.message });
		}

		if (error.message.includes("is_verified column does not exist")) {
			return res.status(400).json({
				message: "is_verified column does not exist",
				note: "Please run the SQL script in the Supabase SQL Editor to add the necessary columns",
			});
		}

		console.error("Error updating user verification status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Update user profile photos
 * @route PATCH /api/users/:userId/photos
 */
const updateProfilePhotos = async (req, res) => {
	try {
		const { userId } = req.params;
		const { photos } = req.body;

		const updatedUser = await profileService.updateProfilePhotos(
			userId,
			photos
		);
		res.status(200).json(updatedUser);
	} catch (error) {
		if (error.message === "User not found") {
			return res.status(404).json({ message: error.message });
		}

		if (error.message === "photos array is required") {
			return res.status(400).json({ message: error.message });
		}

		if (error.message.includes("profile_photos column does not exist")) {
			return res.status(400).json({
				message: "profile_photos column does not exist",
				note: "Please run the SQL script in the Supabase SQL Editor to add the necessary columns",
			});
		}

		console.error("Error updating user profile photos:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	getCurrentUser,
	getUserById,
	getUserByUsername,
	updateUserProfile,
	searchUsers,
	updateVerificationStatus,
	updateProfilePhotos,
};
