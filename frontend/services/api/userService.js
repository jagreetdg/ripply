/**
 * User service for handling user-related API calls
 */
import { ENDPOINTS, apiRequest } from "./config";

/**
 * Get a user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = (userId) => {
	return apiRequest(`${ENDPOINTS.USERS}/${userId}`);
};

/**
 * Update a user profile
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateUserProfile = (userId, userData) => {
	return apiRequest(`${ENDPOINTS.USERS}/${userId}`, {
		method: "PUT",
		body: JSON.stringify(userData),
	});
};

/**
 * Follow a user
 * @param {string} userId - ID of user to follow
 * @param {string} followerId - ID of follower
 * @returns {Promise<Object>} - Follow relationship data
 */
export const followUser = async (userId, followerId) => {
	try {
		console.log(
			`Attempting to follow user: ${userId} by follower: ${followerId}`
		);
		const response = await apiRequest(`${ENDPOINTS.USERS}/${userId}/follow`, {
			method: "POST",
			body: JSON.stringify({ followerId }),
		});

		console.log("Follow user response:", JSON.stringify(response));
		return response;
	} catch (error) {
		console.error("Error following user:", error);
		throw error;
	}
};

/**
 * Get voice notes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of voice notes
 */
export const getUserVoiceNotes = async (userId) => {
	const response = await apiRequest(`${ENDPOINTS.USERS}/${userId}/voice-notes`);

	// Extract just the voice notes array from the response
	const voiceNotes = response.data || [];

	// Get the user data to attach to each voice note
	try {
		const userData = await getUserProfile(userId);

		// Attach the user data to each voice note
		return voiceNotes.map((note) => ({
			...note,
			users: {
				id: userData.id,
				username: userData.username,
				display_name: userData.display_name,
				avatar_url: userData.avatar_url,
			},
		}));
	} catch (error) {
		return voiceNotes;
	}
};

/**
 * Unfollow a user
 * @param {string} userId - ID of user to unfollow
 * @param {string} followerId - ID of follower
 * @returns {Promise<Object>} - Response data
 */
export const unfollowUser = async (userId, followerId) => {
	try {
		console.log(
			`Attempting to unfollow user: ${userId} by follower: ${followerId}`
		);
		const response = await apiRequest(`${ENDPOINTS.USERS}/${userId}/unfollow`, {
			method: "POST",
			body: JSON.stringify({ followerId }),
		});

		console.log("Unfollow user response:", JSON.stringify(response));
		return response;
	} catch (error) {
		console.error("Error unfollowing user:", error);
		throw error;
	}
};

/**
 * Get followers of a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of followers
 */
export const getUserFollowers = async (userId) => {
	try {
		console.log(`Fetching followers for user: ${userId}`);
		const response = await apiRequest(`${ENDPOINTS.USERS}/${userId}/followers`);
		console.log(`Followers API response:`, JSON.stringify(response));

		// Make sure we always return an array
		if (!response || (!response.data && !Array.isArray(response))) {
			console.log("No followers data found, returning empty array");
			return [];
		}

		const followers = response.data || response;
		console.log(`Found ${followers.length} followers`);
		return followers;
	} catch (error) {
		console.error("Error fetching followers:", error);
		return [];
	}
};

/**
 * Get users that a user is following
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of followed users
 */
export const getUserFollowing = async (userId) => {
	try {
		console.log(`Fetching following users for user: ${userId}`);
		const response = await apiRequest(`${ENDPOINTS.USERS}/${userId}/following`);
		console.log("getUserFollowing raw response:", JSON.stringify(response));

		// Make sure we always return an array
		if (!response || (!response.data && !Array.isArray(response))) {
			console.log("No following data found, returning empty array");
			return [];
		}

		const following = response.data || response;
		console.log(`Found ${following.length} following users`);
		return following;
	} catch (error) {
		console.error("Error fetching following:", error);
		return [];
	}
};

/**
 * Get follower count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of followers
 */
export const getFollowerCount = async (userId) => {
	try {
		console.log(`Getting follower count for user: ${userId}`);
		const response = await apiRequest(
			`${ENDPOINTS.USERS}/${userId}/follower-count`
		);
		console.log("Follower count response:", JSON.stringify(response));

		// Return the count from the response
		return response && typeof response.count === "number" ? response.count : 0;
	} catch (error) {
		console.error("Error getting follower count:", error);

		// Fallback to the old method if the new endpoint fails
		console.log("Falling back to counting followers array");
		const followers = await getUserFollowers(userId);
		return followers.length;
	}
};

/**
 * Get following count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of users being followed
 */
export const getFollowingCount = async (userId) => {
	try {
		console.log(`Getting following count for user: ${userId}`);
		const response = await apiRequest(
			`${ENDPOINTS.USERS}/${userId}/following-count`
		);
		console.log("Following count response:", JSON.stringify(response));

		// Return the count from the response
		return response && typeof response.count === "number" ? response.count : 0;
	} catch (error) {
		console.error("Error getting following count:", error);

		// Fallback to the old method if the new endpoint fails
		console.log("Falling back to counting following array");
		const following = await getUserFollowing(userId);
		return following.length;
	}
};

/**
 * Check if a user is following another user
 * @param {string} followerId - ID of the potential follower
 * @param {string} userId - ID of the user to check if being followed
 * @returns {Promise<boolean>} - Whether followerId is following userId
 */
export const isFollowing = async (followerId, userId) => {
	try {
		console.log(
			`Checking if user ${followerId} is following ${userId} (direct API call)`
		);

		// Use the dedicated endpoint to check follow status
		const response = await apiRequest(
			`${ENDPOINTS.USERS}/${userId}/is-following/${followerId}`
		);
		console.log("isFollowing direct API response:", JSON.stringify(response));

		if (response && typeof response.isFollowing === "boolean") {
			return response.isFollowing;
		}

		// Fallback to the old method if the new endpoint fails
		console.log("Falling back to checking follow status using following list");
		const following = await getUserFollowing(followerId);
		console.log(
			"isFollowing check - following data:",
			JSON.stringify(following)
		);

		// Check different possible data structures
		// Some API responses might include nested user objects
		return following.some((follow) => {
			// Check for direct following_id property
			if (follow.following_id === userId) {
				return true;
			}

			// Check for possibly nested user object
			if (follow.users && follow.users.id === userId) {
				return true;
			}

			// Check if follow itself is the user ID (depending on API response format)
			if (follow.id === userId) {
				return true;
			}

			return false;
		});
	} catch (error) {
		console.error("Error checking follow status:", error);
		return false;
	}
};

/**
 * Get user profile by username
 * @param {string} username - Username
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfileByUsername = async (username) => {
	try {
		// Remove @ symbol if present
		const cleanUsername = username.startsWith("@")
			? username.substring(1)
			: username;

		const response = await apiRequest(
			`${ENDPOINTS.USERS}/username/${cleanUsername}`
		);

		// The response might be the data directly or have a data property
		if (response && typeof response === "object") {
			if ("data" in response) {
				return response.data;
			} else {
				// The response itself is the user data
				return response;
			}
		}
		return null;
	} catch (error) {
		if (error.name === "UserNotFoundError") {
			return null;
		}
		throw error;
	}
};

/**
 * Update user verification status
 * @param {string} userId - User ID
 * @param {boolean} isVerified - Verification status
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserVerificationStatus = async (userId, isVerified) => {
	return apiRequest(`${ENDPOINTS.USERS}/${userId}/verify`, {
		method: "PATCH",
		body: JSON.stringify({ is_verified: isVerified }),
	});
};

/**
 * Update user profile photos
 * @param {string} userId - User ID
 * @param {Array} photos - Array of photo objects
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserPhotos = async (userId, photos) => {
	return apiRequest(`${ENDPOINTS.USERS}/${userId}/photos`, {
		method: "PATCH",
		body: JSON.stringify({ photos }),
	});
};

/**
 * Get shared voice notes for a user (reposted content)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of shared voice notes
 */
export const getUserSharedVoiceNotes = async (userId) => {
	const response = await apiRequest(
		`${ENDPOINTS.USERS}/${userId}/shared-voice-notes`
	);

	// Extract just the voice notes array from the response
	const voiceNotes = response.data || [];

	// The backend now provides complete shared_by objects, so we can just ensure
	// all notes have the is_shared flag set to true and return them
	return voiceNotes.map((note) => ({
		...note,
		is_shared: true,
		// Make sure shared_at exists
		shared_at: note.shared_at || new Date().toISOString(),
	}));
};

/**
 * For development/debugging: Check the database schema for the follows table
 * @param {string} userId - User ID to test with
 * @returns {Promise<Object>} - Debug information
 */
export const debugFollowsSchema = async (userId) => {
	try {
		console.log(`DEBUG: Checking follows schema for user ${userId}`);

		// Collect debug information
		const debugInfo = {
			user: userId,
			followersData: null,
			followingData: null,
			followerCount: null,
			followingCount: null,
			errors: [],
		};

		// Test 1: Get followers
		try {
			const followers = await getUserFollowers(userId);
			debugInfo.followersData = followers.slice(0, 2); // Just take first 2 to not clutter logs
			debugInfo.followersCount = followers.length;

			// Check the structure of the first follower
			if (followers.length > 0) {
				const firstFollower = followers[0];
				debugInfo.followerStructure = {
					has_follower_id: "follower_id" in firstFollower,
					has_followee_id: "followee_id" in firstFollower,
					has_following_id: "following_id" in firstFollower,
					has_users: "users" in firstFollower,
					user_data: firstFollower.users
						? Object.keys(firstFollower.users)
						: null,
				};
			}
		} catch (error) {
			console.error("DEBUG followers error:", error);
			debugInfo.errors.push({ type: "followers", error: String(error) });
		}

		// Test 2: Get following
		try {
			const following = await getUserFollowing(userId);
			debugInfo.followingData = following.slice(0, 2); // Just take first 2
			debugInfo.followingCount = following.length;

			// Check the structure of the first followed user
			if (following.length > 0) {
				const firstFollowing = following[0];
				debugInfo.followingStructure = {
					has_follower_id: "follower_id" in firstFollowing,
					has_followee_id: "followee_id" in firstFollowing,
					has_following_id: "following_id" in firstFollowing,
					has_users: "users" in firstFollowing,
					user_data: firstFollowing.users
						? Object.keys(firstFollowing.users)
						: null,
				};
			}
		} catch (error) {
			console.error("DEBUG following error:", error);
			debugInfo.errors.push({ type: "following", error: String(error) });
		}

		// Test 3: Get counts directly
		try {
			const followerCount = await getFollowerCount(userId);
			const followingCount = await getFollowingCount(userId);
			debugInfo.followerCount = followerCount;
			debugInfo.followingCount = followingCount;
		} catch (error) {
			console.error("DEBUG counts error:", error);
			debugInfo.errors.push({ type: "counts", error: String(error) });
		}

		console.log(
			"DEBUG follows schema results:",
			JSON.stringify(debugInfo, null, 2)
		);
		return debugInfo;
	} catch (error) {
		console.error("DEBUG schema test error:", error);
		return { error: String(error) };
	}
};
