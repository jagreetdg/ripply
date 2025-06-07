/**
 * Repost service for handling voice note reposts
 * Follows the Twitter repost model for consistency
 */
import { ENDPOINTS, apiRequest } from "./config";

// Cache to store repost status for quick access
const repostStatusCache = new Map();

/**
 * Check if the current user has reposted a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - Current user ID
 * @returns {Promise<boolean>} - Whether the current user has reposted the voice note
 */
export const hasUserRepostedVoiceNote = async (voiceNoteId, userId) => {
	if (!voiceNoteId || !userId) {
		console.log("[REPOST] Missing voiceNoteId or userId, returning false");
		return false;
	}

	try {
		console.log(
			`[REPOST] Checking if user ${userId} has reposted voice note ${voiceNoteId}`
		);
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares/check?userId=${userId}`
		);

		console.log(`[REPOST] Response:`, response);

		// Always return a boolean
		const isReposted =
			typeof response === "boolean" ? response : response?.isShared === true;

		console.log(
			`[REPOST] User ${userId} has${
				isReposted ? "" : " not"
			} reposted voice note ${voiceNoteId}`
		);
		return isReposted;
	} catch (error) {
		console.error("[REPOST] Error checking repost status:", error);
		return false;
	}
};

/**
 * Checks if a voice note has been reposted by the current user
 *
 * @param {string} voiceNoteId - The ID of the voice note
 * @param {string} userId - The ID of the current user
 * @returns {Promise<boolean>} - Whether the user has reposted this voice note
 */
export const checkRepostStatus = async (voiceNoteId, userId) => {
	if (!voiceNoteId || !userId) {
		console.log("[REPOST] Missing voiceNoteId or userId, returning false");
		return false;
	}

	// Create a cache key
	const cacheKey = `${voiceNoteId}:${userId}`;

	// Check cache first
	if (repostStatusCache.has(cacheKey)) {
		const cachedResult = repostStatusCache.get(cacheKey);
		console.log(
			`[REPOST] Using cached status for ${voiceNoteId}: ${cachedResult}`
		);
		return cachedResult;
	}

	try {
		console.log(
			`[REPOST] Checking if user ${userId} has reposted voice note ${voiceNoteId}`
		);

		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares/check?userId=${userId}`
		);

		// Parse the response to ensure a boolean value
		const isReposted =
			typeof response === "boolean" ? response : response?.isShared === true;

		// Update cache
		repostStatusCache.set(cacheKey, isReposted);

		console.log(
			`[REPOST] User ${userId} has${
				isReposted ? "" : " not"
			} reposted voice note ${voiceNoteId}`
		);
		return isReposted;
	} catch (error) {
		console.error("[REPOST] Error checking repost status:", error);
		return false;
	}
};

/**
 * Performs a repost action on a voice note
 *
 * @param {string} voiceNoteId - The ID of the voice note to repost
 * @param {string} userId - The ID of the current user
 * @returns {Promise<{success: boolean, isReposted: boolean, repostCount: number}>} - Result of the repost operation
 */
export const repostVoiceNote = async (voiceNoteId, userId) => {
	if (!voiceNoteId || !userId) {
		console.error("[REPOST] Missing voiceNoteId or userId");
		return { success: false, isReposted: false, repostCount: 0 };
	}

	try {
		console.log(
			`[REPOST] Reposting voice note ${voiceNoteId} by user ${userId}`
		);

		// Call the API to repost
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`,
			{
				method: "POST",
				body: JSON.stringify({ user_id: userId }),
			}
		);

		// Extract values from response
		const isReposted = response?.isShared === true;
		const repostCount =
			typeof response?.shareCount === "number" ? response.shareCount : 0;

		// Update cache
		const cacheKey = `${voiceNoteId}:${userId}`;
		repostStatusCache.set(cacheKey, isReposted);

		console.log(
			`[REPOST] Voice note ${voiceNoteId} repost status: ${isReposted}, count: ${repostCount}`
		);

		return {
			success: true,
			isReposted,
			repostCount,
		};
	} catch (error) {
		console.error("[REPOST] Error reposting voice note:", error);
		return { success: false, isReposted: false, repostCount: 0 };
	}
};

/**
 * Performs an unrepost action on a voice note
 *
 * @param {string} voiceNoteId - The ID of the voice note to unrepost
 * @param {string} userId - The ID of the current user
 * @returns {Promise<{success: boolean, isReposted: boolean, repostCount: number}>} - Result of the unrepost operation
 */
export const unrepostVoiceNote = async (voiceNoteId, userId) => {
	if (!voiceNoteId || !userId) {
		console.error("[REPOST] Missing voiceNoteId or userId");
		return { success: false, isReposted: true, repostCount: 0 };
	}

	try {
		console.log(
			`[REPOST] Unreposting voice note ${voiceNoteId} by user ${userId}`
		);

		// Call the API to unrepost
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/unshare`,
			{
				method: "POST",
				body: JSON.stringify({ user_id: userId }),
			}
		);

		// Extract values from response
		const isReposted = response?.isShared === true;
		const repostCount =
			typeof response?.shareCount === "number" ? response.shareCount : 0;

		// Update cache
		const cacheKey = `${voiceNoteId}:${userId}`;
		repostStatusCache.set(cacheKey, isReposted);

		console.log(
			`[REPOST] Voice note ${voiceNoteId} unrepost status: ${isReposted}, count: ${repostCount}`
		);

		return {
			success: true,
			isReposted,
			repostCount,
		};
	} catch (error) {
		console.error("[REPOST] Error unreposting voice note:", error);
		return { success: false, isReposted: true, repostCount: 0 };
	}
};

/**
 * Toggles the repost status of a voice note
 *
 * @param {string} voiceNoteId - The ID of the voice note
 * @param {string} userId - The ID of the current user
 * @returns {Promise<{success: boolean, isReposted: boolean, repostCount: number}>} - Result of the toggle operation
 */
export const toggleRepost = async (voiceNoteId, userId) => {
	if (!voiceNoteId || !userId) {
		console.error("[REPOST] Missing voiceNoteId or userId for toggle");
		return { success: false, isReposted: false, repostCount: 0 };
	}

	try {
		// First check the current status
		const isCurrentlyReposted = await checkRepostStatus(voiceNoteId, userId);

		// Based on current status, perform the opposite action
		if (isCurrentlyReposted) {
			return await unrepostVoiceNote(voiceNoteId, userId);
		} else {
			return await repostVoiceNote(voiceNoteId, userId);
		}
	} catch (error) {
		console.error("[REPOST] Error toggling repost:", error);
		return { success: false, isReposted: false, repostCount: 0 };
	}
};

/**
 * Gets the number of reposts for a voice note
 *
 * @param {string} voiceNoteId - The ID of the voice note
 * @returns {Promise<number>} - The number of reposts
 */
export const getRepostCount = async (voiceNoteId) => {
	if (!voiceNoteId) {
		console.error("[REPOST] Missing voiceNoteId for count");
		return 0;
	}

	try {
		console.log(`[REPOST] Getting repost count for voice note ${voiceNoteId}`);

		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares/count`
		);

		// Extract count from different possible response formats
		let count = 0;

		if (typeof response === "number") {
			count = response;
		} else if (typeof response?.shareCount === "number") {
			count = response.shareCount;
		} else if (typeof response?.count === "number") {
			count = response.count;
		} else if (Array.isArray(response)) {
			count = response.length;
		} else if (Array.isArray(response?.data)) {
			count = response.data.length;
		}

		console.log(`[REPOST] Voice note ${voiceNoteId} has ${count} reposts`);
		return count;
	} catch (error) {
		console.error("[REPOST] Error getting repost count:", error);
		return 0;
	}
};

/**
 * Get users who have reposted a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Array>} - Array of users who reposted the voice note
 */
export const getReposters = async (voiceNoteId) => {
	if (!voiceNoteId) {
		console.error("[REPOST] Missing voiceNoteId");
		return [];
	}

	try {
		console.log(`[REPOST] Getting reposters for voice note ${voiceNoteId}`);
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`
		);

		let reposters = [];

		if (Array.isArray(response)) {
			reposters = response;
		} else if (Array.isArray(response?.data)) {
			reposters = response.data;
		}

		console.log(
			`[REPOST] Found ${reposters.length} reposters for voice note ${voiceNoteId}`
		);
		return reposters;
	} catch (error) {
		console.error("[REPOST] Error getting reposters:", error);
		return [];
	}
};

/**
 * Get the reposter information for a voice note if it's a repost
 * @param {Object} voiceNote - Voice note object
 * @returns {Object|null} - Reposter information or null if not a repost
 */
export const getReposterInfo = (voiceNote) => {
	// Not a repost
	if (!voiceNote?.is_shared) return null;

	// Extract reposter info from the voice note
	if (voiceNote.shared_by) {
		return {
			id: voiceNote.shared_by.id,
			username: voiceNote.shared_by.username,
			displayName: voiceNote.shared_by.display_name,
			avatarUrl: voiceNote.shared_by.avatar_url,
		};
	}

	// Alternative fields for reposter info
	if (voiceNote.sharer_id) {
		return {
			id: voiceNote.sharer_id,
			username: voiceNote.sharer_username || "user",
			displayName:
				voiceNote.sharer_display_name || voiceNote.sharer_username || "User",
			avatarUrl: voiceNote.sharer_avatar_url || null,
		};
	}

	return null;
};

/**
 * Clears the cache for a specific voice note or user, or the entire cache
 *
 * @param {string} [voiceNoteId] - Optional voice note ID to clear from cache
 * @param {string} [userId] - Optional user ID to clear from cache
 */
export const clearRepostCache = (voiceNoteId, userId) => {
	if (voiceNoteId && userId) {
		// Clear specific voice note/user combination
		const cacheKey = `${voiceNoteId}:${userId}`;
		repostStatusCache.delete(cacheKey);
		console.log(
			`[REPOST] Cleared cache for voice note ${voiceNoteId} and user ${userId}`
		);
	} else if (voiceNoteId) {
		// Clear all entries for this voice note
		let count = 0;
		repostStatusCache.forEach((_, key) => {
			if (key.startsWith(`${voiceNoteId}:`)) {
				repostStatusCache.delete(key);
				count++;
			}
		});
		console.log(
			`[REPOST] Cleared cache for ${count} entries related to voice note ${voiceNoteId}`
		);
	} else if (userId) {
		// Clear all entries for this user
		let count = 0;
		repostStatusCache.forEach((_, key) => {
			if (key.endsWith(`:${userId}`)) {
				repostStatusCache.delete(key);
				count++;
			}
		});
		console.log(
			`[REPOST] Cleared cache for ${count} entries related to user ${userId}`
		);
	} else {
		// Clear entire cache
		const size = repostStatusCache.size;
		repostStatusCache.clear();
		console.log(`[REPOST] Cleared entire repost cache (${size} entries)`);
	}
};
