const followService = require("../../services/users/followService");

/**
 * Controller for user follow system
 */

/**
 * Follow a user
 * @route POST /api/users/:userId/follow
 */
const followUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const followerId = req.user?.id; // Use authenticated user ID

		if (!followerId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		console.log(
			`[DEBUG] Follow request: userId=${userId}, followerId=${followerId}`
		);

		const followRelationship = await followService.followUser(
			followerId,
			userId
		);

		console.log("[DEBUG] Successfully created follow relationship");
		res.status(201).json(followRelationship);
	} catch (error) {
		if (error.message === "Already following this user") {
			console.log("[DEBUG] Already following this user");
			return res.status(400).json({ message: error.message });
		}

		console.error("Error following user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Unfollow a user
 * @route POST /api/users/:userId/unfollow
 */
const unfollowUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const followerId = req.user?.id; // Use authenticated user ID

		if (!followerId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		console.log(
			`[DEBUG] Unfollow request: userId=${userId}, followerId=${followerId}`
		);

		await followService.unfollowUser(followerId, userId);

		console.log("[DEBUG] Successfully removed follow relationship");
		res.status(200).json({ message: "Successfully unfollowed user" });
	} catch (error) {
		console.error("Error unfollowing user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get user's followers
 * @route GET /api/users/:userId/followers
 */
const getFollowers = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const result = await followService.getFollowers(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching followers:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get users that a user is following
 * @route GET /api/users/:userId/following
 */
const getFollowing = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		const result = await followService.getFollowing(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching following:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Check if a user is following another user
 * @route GET /api/users/:userId/is-following/:followerId
 */
const checkFollowStatus = async (req, res) => {
	try {
		const { userId, followerId } = req.params;

		console.log(
			`[DEBUG] Checking if user ${followerId} is following ${userId}`
		);

		const isFollowing = await followService.checkFollowStatus(
			followerId,
			userId
		);

		console.log(`[DEBUG] Follow status: ${isFollowing}`);
		res.status(200).json({ isFollowing });
	} catch (error) {
		console.error("Error checking follow status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get follower count for a user
 * @route GET /api/users/:userId/follower-count
 */
const getFollowerCount = async (req, res) => {
	try {
		const { userId } = req.params;

		console.log(`[DEBUG] Getting follower count for user: ${userId}`);

		const count = await followService.getFollowerCount(userId);

		console.log(`[DEBUG] Follower count for ${userId}: ${count}`);
		res.status(200).json({ count });
	} catch (error) {
		console.error("Error getting follower count:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get following count for a user
 * @route GET /api/users/:userId/following-count
 */
const getFollowingCount = async (req, res) => {
	try {
		const { userId } = req.params;

		console.log(`[DEBUG] Getting following count for user: ${userId}`);

		const count = await followService.getFollowingCount(userId);

		console.log(`[DEBUG] Following count for ${userId}: ${count}`);
		res.status(200).json({ count });
	} catch (error) {
		console.error("Error getting following count:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get follow statistics for a user (both follower and following counts)
 * @route GET /api/users/:userId/follow-stats
 */
const getFollowStats = async (req, res) => {
	try {
		const { userId } = req.params;

		console.log(`[DEBUG] Getting follow stats for user: ${userId}`);

		const stats = await followService.getFollowStats(userId);

		console.log(`[DEBUG] Follow stats for ${userId}:`, stats);
		res.status(200).json(stats);
	} catch (error) {
		console.error("Error getting follow stats:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	followUser,
	unfollowUser,
	getFollowers,
	getFollowing,
	checkFollowStatus,
	getFollowerCount,
	getFollowingCount,
	getFollowStats,
};
