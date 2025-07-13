const { supabase, supabaseAdmin } = require("../../config/supabase");

/**
 * Service layer for user follow system
 */

/**
 * Check if one user is following another
 * @param {string} followerId - ID of the user who might be following
 * @param {string} followingId - ID of the user who might be followed
 * @returns {boolean} Whether the follow relationship exists
 */
const checkFollowStatus = async (followerId, followingId) => {
	const { data, error } = await supabaseAdmin
		.from("follows")
		.select("*")
		.eq("follower_id", followerId)
		.eq("following_id", followingId)
		.single();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return !!data;
};

/**
 * Follow a user
 * @param {string} followerId - ID of the user who wants to follow
 * @param {string} followingId - ID of the user to be followed
 * @returns {Object} Created follow relationship
 */
const followUser = async (followerId, followingId) => {
	// Check if already following
	const alreadyFollowing = await checkFollowStatus(followerId, followingId);

	if (alreadyFollowing) {
		throw new Error("Already following this user");
	}

	// Create follow relationship
	const { data, error } = await supabaseAdmin
		.from("follows")
		.insert([{ follower_id: followerId, following_id: followingId }])
		.select()
		.single();

	if (error) throw error;

	return data;
};

/**
 * Unfollow a user
 * @param {string} followerId - ID of the user who wants to unfollow
 * @param {string} followingId - ID of the user to be unfollowed
 * @returns {boolean} Success status
 */
const unfollowUser = async (followerId, followingId) => {
	const { error } = await supabaseAdmin
		.from("follows")
		.delete()
		.eq("follower_id", followerId)
		.eq("following_id", followingId);

	if (error) throw error;

	return true;
};

/**
 * Get users that follow a specific user
 * @param {string} userId - ID of the user whose followers to get
 * @param {Object} options - Query options
 * @returns {Array} Array of followers with user info
 */
const getFollowers = async (userId, options = {}) => {
	const { page = 1, limit = 20 } = options;
	const offset = (page - 1) * limit;

	const { data, error, count } = await supabaseAdmin
		.from("follows")
		.select("follower_id, users!follower_id(*)", { count: "exact" })
		.eq("following_id", userId)
		.range(offset, offset + parseInt(limit) - 1);

	if (error) throw error;

	return {
		data,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: count,
			totalPages: Math.ceil(count / limit),
		},
	};
};

/**
 * Get users that a specific user is following
 * @param {string} userId - ID of the user whose following list to get
 * @param {Object} options - Query options
 * @returns {Array} Array of following users with user info
 */
const getFollowing = async (userId, options = {}) => {
	const { page = 1, limit = 20 } = options;
	const offset = (page - 1) * limit;

	const { data, error, count } = await supabaseAdmin
		.from("follows")
		.select("following_id, users!following_id(*)", { count: "exact" })
		.eq("follower_id", userId)
		.range(offset, offset + parseInt(limit) - 1);

	if (error) throw error;

	return {
		data,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: count,
			totalPages: Math.ceil(count / limit),
		},
	};
};

/**
 * Get follower count for a user
 * @param {string} userId - User ID
 * @returns {number} Number of followers
 */
const getFollowerCount = async (userId) => {
	const { count, error } = await supabaseAdmin
		.from("follows")
		.select("*", { count: "exact", head: true })
		.eq("following_id", userId);

	if (error) throw error;

	return count || 0;
};

/**
 * Get following count for a user
 * @param {string} userId - User ID
 * @returns {number} Number of users being followed
 */
const getFollowingCount = async (userId) => {
	const { count, error } = await supabaseAdmin
		.from("follows")
		.select("*", { count: "exact", head: true })
		.eq("follower_id", userId);

	if (error) throw error;

	return count || 0;
};

/**
 * Get follow statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} Object containing follower and following counts
 */
const getFollowStats = async (userId) => {
	const [followerCount, followingCount] = await Promise.all([
		getFollowerCount(userId),
		getFollowingCount(userId),
	]);

	return {
		followers: followerCount,
		following: followingCount,
	};
};

/**
 * Get mutual follow relationships between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Object} Object indicating mutual follow status
 */
const getMutualFollowStatus = async (userId1, userId2) => {
	const [user1FollowsUser2, user2FollowsUser1] = await Promise.all([
		checkFollowStatus(userId1, userId2),
		checkFollowStatus(userId2, userId1),
	]);

	return {
		user1FollowsUser2,
		user2FollowsUser1,
		isMutual: user1FollowsUser2 && user2FollowsUser1,
	};
};

module.exports = {
	checkFollowStatus,
	followUser,
	unfollowUser,
	getFollowers,
	getFollowing,
	getFollowerCount,
	getFollowingCount,
	getFollowStats,
	getMutualFollowStatus,
};
