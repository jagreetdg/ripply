/**
 * Voice Note service for handling voice note-related API calls
 */
import { ENDPOINTS, apiRequest } from "./config";

/**
 * Get personalized feed (voice notes from users the current user follows)
 * @param {string} userId - Current user ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of voice notes from followed users
 */
export const getPersonalizedFeed = async (userId, params = {}) => {
	console.log("[DIAGNOSTIC] Starting getPersonalizedFeed for user:", userId);
	const queryString = new URLSearchParams(params).toString();
	const endpoint = queryString
		? `${ENDPOINTS.VOICE_NOTES}/feed/${userId}?${queryString}`
		: `${ENDPOINTS.VOICE_NOTES}/feed/${userId}`;
	console.log("[DIAGNOSTIC] Endpoint being called:", endpoint);

	try {
		const response = await apiRequest(endpoint);

		// Log the entire response structure for diagnosis
		console.log("[DIAGNOSTIC] Response type:", typeof response);
		console.log("[DIAGNOSTIC] Response is array:", Array.isArray(response));
		console.log("[DIAGNOSTIC] Response keys:", Object.keys(response || {}));
		if (response && response.data) {
			console.log("[DIAGNOSTIC] Response.data type:", typeof response.data);
			console.log(
				"[DIAGNOSTIC] Response.data is array:",
				Array.isArray(response.data)
			);
			console.log(
				"[DIAGNOSTIC] Response.data length:",
				Array.isArray(response.data) ? response.data.length : "N/A"
			);
		}

		// If response contains data, log the first item to see structure
		if (Array.isArray(response) && response.length > 0) {
			console.log("[DIAGNOSTIC] First item user_id:", response[0].user_id);
			// Extract unique user IDs to see which users' posts we're getting
			const userIds = [...new Set(response.map((item) => item.user_id))];
			console.log("[DIAGNOSTIC] Unique user IDs in feed:", userIds);
		} else if (
			response &&
			Array.isArray(response.data) &&
			response.data.length > 0
		) {
			console.log("[DIAGNOSTIC] First item user_id:", response.data[0].user_id);
			// Extract unique user IDs to see which users' posts we're getting
			const userIds = [...new Set(response.data.map((item) => item.user_id))];
			console.log("[DIAGNOSTIC] Unique user IDs in feed:", userIds);
		}

		// The backend now returns a direct array of voice notes
		if (Array.isArray(response)) {
			console.log(`[DIAGNOSTIC] Returning array of ${response.length} items`);
			return response;
		} else if (response && Array.isArray(response.data)) {
			console.log(
				`[DIAGNOSTIC] Returning array of ${response.data.length} items from response.data`
			);
			return response.data;
		} else {
			console.log(
				"[DIAGNOSTIC] Unexpected response format for personalized feed:",
				response
			);
			return [];
		}
	} catch (error) {
		console.error("[DIAGNOSTIC] Error in getPersonalizedFeed:", error);
		return [];
	}
};

/**
 * Get all voice notes (feed)
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of voice notes
 */
export const getVoiceNotes = async (params = {}) => {
	console.log("Fetching all voice notes with params:", params);
	const queryString = new URLSearchParams(params).toString();
	const endpoint = queryString
		? `${ENDPOINTS.VOICE_NOTES}?${queryString}`
		: ENDPOINTS.VOICE_NOTES;

	try {
		const response = await apiRequest(endpoint);

		// Log the structure to debug
		console.log("Response type:", typeof response, Array.isArray(response));

		// The backend now returns a direct array of voice notes
		if (Array.isArray(response)) {
			return response;
		} else if (response && Array.isArray(response.data)) {
			return response.data;
		} else {
			console.log("Unexpected response format for voice notes:", response);
			return [];
		}
	} catch (error) {
		console.error("Error fetching all voice notes:", error);
		return [];
	}
};

/**
 * Get a voice note by ID
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Voice note data
 */
export const getVoiceNoteById = async (voiceNoteId) => {
	try {
		console.log(`Fetching voice note by ID: ${voiceNoteId}`);
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`
		);
		console.log(
			`Response from getVoiceNoteById for ${voiceNoteId}:`,
			JSON.stringify(response)
		);
		return response;
	} catch (error) {
		console.error(`Error fetching voice note ${voiceNoteId}:`, error);
		throw error;
	}
};

/**
 * Create a new voice note
 * @param {Object} voiceNoteData - Voice note data
 * @returns {Promise<Object>} - Created voice note
 */
export const createVoiceNote = (voiceNoteData) => {
	return apiRequest(ENDPOINTS.VOICE_NOTES, {
		method: "POST",
		body: JSON.stringify(voiceNoteData),
	});
};

/**
 * Update a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {Object} voiceNoteData - Voice note data to update
 * @returns {Promise<Object>} - Updated voice note
 */
export const updateVoiceNote = (voiceNoteId, voiceNoteData) => {
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
		method: "PUT",
		body: JSON.stringify(voiceNoteData),
	});
};

/**
 * Delete a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteVoiceNote = (voiceNoteId) => {
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
		method: "DELETE",
	});
};

/**
 * Like a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Like data
 */
export const likeVoiceNote = (voiceNoteId, userId) => {
	console.log(`Liking voice note: ${voiceNoteId} by user: ${userId}`);
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/like`, {
		method: "POST",
		body: JSON.stringify({ user_id: userId }),
	});
};

/**
 * Unlike a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Response data
 */
export const unlikeVoiceNote = (voiceNoteId, userId) => {
	console.log(`Unliking voice note: ${voiceNoteId} by user: ${userId}`);
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/unlike`, {
		method: "POST",
		body: JSON.stringify({ user_id: userId }),
	});
};

/**
 * Check if a user has liked a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether the user has liked the voice note
 */
export const checkLikeStatus = async (voiceNoteId, userId) => {
	try {
		console.log(
			`Checking if user ${userId} has liked voice note ${voiceNoteId}`
		);
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/likes/check?userId=${userId}`
		);
		return response?.isLiked || false;
	} catch (error) {
		console.error("Error checking like status:", error);
		// Return false for 404 errors (endpoint doesn't exist or not found)
		// This provides graceful degradation
		return false;
	}
};

/**
 * Check if a user has shared a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether the user has shared the voice note
 */
export const checkShareStatus = async (voiceNoteId, userId) => {
	try {
		console.log(
			`Checking if user ${userId} has shared voice note ${voiceNoteId}`
		);
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares/check?userId=${userId}`
		);
		return response?.isShared || false;
	} catch (error) {
		console.error("Error checking share status:", error);
		// Return false for 404 errors (endpoint doesn't exist or not found)
		// This provides graceful degradation
		return false;
	}
};

/**
 * Add a comment to a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} - Created comment
 */
export const addComment = (voiceNoteId, commentData) => {
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/comments`, {
		method: "POST",
		body: JSON.stringify(commentData),
	});
};

/**
 * Get comments for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Array>} - List of comments
 */
export const getComments = (voiceNoteId) => {
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/comments`);
};

/**
 * Record a play for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Play data
 */
export const recordPlay = (voiceNoteId, userId) => {
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/play`, {
		method: "POST",
		body: JSON.stringify({ userId }),
	});
};

/**
 * Get voice notes by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of voice notes
 */
export const getUserVoiceNotes = (userId) => {
	return apiRequest(`${ENDPOINTS.USERS}/${userId}/voice-notes`);
};

/**
 * Record a share for a voice note (toggles share status)
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - ID of user sharing the voice note
 * @returns {Promise<{shareCount: number, isShared: boolean, message?: string, voiceNoteId: string, userId: string, error?: string}>} - Share data with updated count and share status
 */
export const recordShare = async (voiceNoteId, userId) => {
	console.log(`Toggle share for voice note: ${voiceNoteId} by user: ${userId}`);
	try {
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`,
			{
				method: "POST",
				body: JSON.stringify({ userId: userId }),
			}
		);

		console.log(`Share toggle response:`, JSON.stringify(response));

		// Make sure we have valid data in the response
		let shareCount =
			typeof response.shareCount === "number" ? response.shareCount : 0;
		const isShared =
			typeof response.isShared === "boolean" ? response.isShared : false;

		// Try to get a more accurate share count directly
		try {
			const accurateShareCount = await getShareCount(voiceNoteId, true);
			if (typeof accurateShareCount === "number") {
				console.log(
					`Updating share count from ${shareCount} to more accurate ${accurateShareCount}`
				);
				shareCount = accurateShareCount;
			}
		} catch (error) {
			console.error("Error getting accurate share count:", error);
			// Keep the original share count if this fails
		}

		// Return the response with shareCount and isShared flag
		return {
			shareCount: shareCount,
			isShared: isShared,
			message: response.message || "",
			voiceNoteId,
			userId,
		};
	} catch (error) {
		console.error("Error toggling share:", error);
		// Return a default response instead of throwing to avoid UI freezing
		return {
			shareCount: 0,
			isShared: false,
			message: "Error toggling share",
			voiceNoteId,
			userId,
			error: error.message,
		};
	}
};

/**
 * Get share count for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {boolean} includeResponseDebug - Whether to include the full response in debug logs
 * @returns {Promise<number>} - Share count
 */
export const getShareCount = async (
	voiceNoteId,
	includeResponseDebug = false
) => {
	try {
		console.log(`Fetching share count for voice note: ${voiceNoteId}`);
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`
		);

		// Log the full response for debugging
		if (includeResponseDebug) {
			console.log(
				`DEBUG - Full response for getShareCount(${voiceNoteId}):`,
				JSON.stringify(response)
			);
		}

		// Make sure we extract the share count correctly, prefer shareCount property
		if (typeof response?.shareCount === "number") {
			console.log(
				`Share count from response.shareCount: ${response.shareCount}`
			);
			return response.shareCount;
		} else if (typeof response?.data?.shareCount === "number") {
			console.log(
				`Share count from response.data.shareCount: ${response.data.shareCount}`
			);
			return response.data.shareCount;
		} else if (response?.data && Array.isArray(response.data)) {
			// Try to use the length of the shares array if available
			console.log(
				`Share count from response.data array length: ${response.data.length}`
			);
			return response.data.length;
		} else {
			// If we can't find a valid share count, use 0 as default
			console.warn(
				`No valid share count found for ${voiceNoteId}, response:`,
				JSON.stringify(response, null, 2)
			);
			return 0;
		}
	} catch (error) {
		console.error("Error fetching share count:", error);
		return 0; // Return 0 if there's an error
	}
};

/**
 * Get complete stats for a voice note (likes, comments, shares, plays)
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<{likes: number, comments: number, shares: number, plays: number}>} - Voice note stats
 */
export const getVoiceNoteStats = async (voiceNoteId) => {
	try {
		console.log(`Fetching complete stats for voice note: ${voiceNoteId}`);

		// First try to get the complete voice note data
		const voiceNoteData = await getVoiceNoteById(voiceNoteId);

		// Helper function to normalize any count value
		const normalizeCount = (value) => {
			// If it's already a number, return it
			if (typeof value === "number") {
				return value;
			}

			// If it's an object with a count property
			if (value && typeof value === "object") {
				// Handle {count: number}
				if (typeof value.count === "number") {
					return value.count;
				}

				// Handle arrays of objects with count
				if (Array.isArray(value) && value.length > 0) {
					if (typeof value[0].count === "number") {
						return value[0].count;
					}
					// Try to use the array length as a fallback
					return value.length;
				}
			}

			// Try to parse it as a number if it's a string
			if (typeof value === "string") {
				const parsed = parseInt(value, 10);
				if (!isNaN(parsed)) {
					return parsed;
				}
			}

			// Fallback to 0 for undefined, null, or unparseable formats
			return 0;
		};

		// Initialize with default values
		let stats = {
			likes: 0,
			comments: 0,
			shares: 0,
			plays: 0,
		};

		// If we got valid data, extract stats
		if (voiceNoteData) {
			// Use our normalize function for each stat
			stats.likes = normalizeCount(voiceNoteData.likes);
			stats.comments = normalizeCount(voiceNoteData.comments);
			stats.plays = normalizeCount(voiceNoteData.plays);
			stats.shares = normalizeCount(voiceNoteData.shares);

			console.log(`Normalized stats from API for ${voiceNoteId}:`, stats);
		}

		// Try to get a more accurate share count if available
		try {
			// Pass true to enable full response debugging
			const shareCount = await getShareCount(voiceNoteId, true);
			if (typeof shareCount === "number") {
				console.log(
					`Previous share count: ${stats.shares}, updated from getShareCount: ${shareCount}`
				);
				stats.shares = shareCount;
			}
		} catch (shareError) {
			console.error("Error getting share count:", shareError);
			// Keep the existing share count
		}

		console.log(`Final stats for ${voiceNoteId}:`, stats);
		return stats;
	} catch (error) {
		console.error(`Error getting voice note stats for ${voiceNoteId}:`, error);
		// Return default values if something went wrong
		return {
			likes: 0,
			comments: 0,
			shares: 0,
			plays: 0,
		};
	}
};
