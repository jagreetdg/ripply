/**
 * Voice Note service for handling voice note-related API calls
 */
import { ENDPOINTS, apiRequest } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

		// Check if we have a token
		const token = await AsyncStorage.getItem("@ripply_auth_token");
		if (!token) {
			console.warn("No auth token found for checking share status");
			return false;
		}

		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares/check?userId=${userId}`
		);
		return response?.isShared || false;
	} catch (error) {
		console.error("Error checking share status:", error);

		// Check if this is an authentication error
		if (
			error.message &&
			(error.message.includes("Authentication required") ||
				error.message.includes("Invalid token") ||
				error.message.includes("Token expired"))
		) {
			// Clear the invalid token
			try {
				await AsyncStorage.removeItem("@ripply_auth_token");
				console.log("Cleared invalid auth token during share status check");
			} catch (clearError) {
				console.error("Error clearing invalid token:", clearError);
			}
		}

		// Return false for any errors (endpoint doesn't exist, not found, auth issues)
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
 * Check if the voice_note_shares table exists in the database
 * This is helpful for debugging issues with the Render backend
 * @returns {Promise<boolean>} - True if table exists
 */
export const checkVoiceSharesTableExists = async () => {
	try {
		console.log("[RENDER DEBUG] Checking if voice_note_shares table exists");
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/debug/check-shares-table`,
			{
				method: "GET",
			}
		);

		console.log("[RENDER DEBUG] Table check response:", response);
		return response?.exists || false;
	} catch (error) {
		console.error("[RENDER DEBUG] Error checking if table exists:", error);
		return false;
	}
};

/**
 * Record a share for a voice note (toggle share/unshare)
 * @param {string} voiceNoteId - ID of voice note to share
 * @param {string} userId - ID of user sharing the voice note (not used anymore, kept for compatibility)
 * @returns {Promise<{shareCount: number, isShared: boolean, message?: string, voiceNoteId: string, userId: string, error?: string}>} - Share data with updated count and share status
 */
export const recordShare = async (voiceNoteId, userId) => {
	console.log(`Toggle share for voice note: ${voiceNoteId} by user: ${userId}`);
	try {
		// Check if we have a token in AsyncStorage before making the request
		const token = await AsyncStorage.getItem("@ripply_auth_token");
		if (!token) {
			console.error("No auth token found for share request");
			return {
				shareCount: 0,
				isShared: false,
				message: "Authentication required",
				voiceNoteId,
				userId,
				error: "No authentication token found",
			};
		}

		// First check if the table exists - useful for debugging Render issues
		try {
			const tableExists = await checkVoiceSharesTableExists();
			if (!tableExists) {
				console.error("[RENDER DEBUG] voice_note_shares table does not exist!");
				return {
					shareCount: 0,
					isShared: false,
					message: "Database table missing",
					voiceNoteId,
					userId,
					error: "The voice_note_shares table does not exist in the database",
				};
			}
			console.log(
				"[RENDER DEBUG] voice_note_shares table exists, proceeding with share"
			);
		} catch (tableCheckError) {
			// Continue even if the check fails - it's just for debugging
			console.error(
				"[RENDER DEBUG] Error checking table existence:",
				tableCheckError
			);
		}

		// Note: We no longer send userId in the body since the backend uses the authenticated user's ID
		// Add detailed debugging for the Render backend
		console.log(
			"[RENDER DEBUG] About to send share request to:",
			`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`
		);

		try {
			// Make a direct fetch call with more detailed error handling for debugging
			const fullUrl = `${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`;
			console.log("[RENDER DEBUG] Full URL:", fullUrl);

			const fetchResponse = await fetch(fullUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({}),
			});

			// Log the full response details before parsing
			console.log(
				"[RENDER DEBUG] Share response status:",
				fetchResponse.status
			);
			console.log(
				"[RENDER DEBUG] Share response statusText:",
				fetchResponse.statusText
			);

			// Get the response text first to avoid parsing errors
			const responseText = await fetchResponse.text();
			console.log("[RENDER DEBUG] Share response text:", responseText);

			// Parse the JSON response if possible
			let debugResponse;
			try {
				debugResponse = JSON.parse(responseText);
			} catch (parseError) {
				console.error("[RENDER DEBUG] Error parsing response:", parseError);
				debugResponse = {
					error: "Invalid JSON response",
					rawResponse: responseText,
				};
			}

			if (!fetchResponse.ok) {
				console.error("[RENDER DEBUG] Server error response:", debugResponse);
				return {
					shareCount: 0,
					isShared: false,
					message: debugResponse.message || "Error sharing voice note",
					voiceNoteId,
					userId,
					error: debugResponse.error || responseText,
					status: fetchResponse.status,
					serverDetails: debugResponse,
				};
			}

			// Regular request via apiRequest for consistent behavior
			const apiResponse = await apiRequest(
				`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`,
				{
					method: "POST",
					body: JSON.stringify({}), // Empty body since backend uses authenticated user
				}
			);

			console.log(`Share toggle response:`, JSON.stringify(apiResponse));

			// Make sure we have valid data in the response
			let shareCount =
				typeof apiResponse.shareCount === "number" ? apiResponse.shareCount : 0;
			const isShared =
				typeof apiResponse.isShared === "boolean"
					? apiResponse.isShared
					: false;

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
				message: apiResponse.message || "",
				voiceNoteId,
				userId: apiResponse.userId || userId, // Use response userId if available
			};
		} catch (fetchError) {
			console.error("[RENDER DEBUG] Fetch error:", fetchError);
			return {
				shareCount: 0,
				isShared: false,
				message: "Network error while sharing",
				voiceNoteId,
				userId,
				error: fetchError.message || "Unknown fetch error occurred",
				fetchErrorDetails: fetchError,
			};
		}
	} catch (error) {
		console.error("Error toggling share:", error);
		// Check if this is an authentication error
		if (
			error.message &&
			(error.message.includes("Authentication required") ||
				error.message.includes("Invalid token") ||
				error.message.includes("Token expired"))
		) {
			// Clear the invalid token
			try {
				await AsyncStorage.removeItem("@ripply_auth_token");
				console.log("Cleared invalid auth token");
			} catch (clearError) {
				console.error("Error clearing invalid token:", clearError);
			}
		}

		// Return a default response instead of throwing to avoid UI freezing
		return {
			shareCount: 0,
			isShared: false,
			message: "Error toggling share",
			voiceNoteId,
			userId,
			error: error.message || "Unknown error occurred",
			errorDetails: error,
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
 * @param {number} retryCount - Number of retries attempted (internal use)
 * @returns {Promise<{likes: number, comments: number, shares: number, plays: number}>} - Voice note stats
 */
export const getVoiceNoteStats = async (voiceNoteId, retryCount = 0) => {
	try {
		console.log(`Fetching complete stats for voice note: ${voiceNoteId}`);

		// First try to get the complete voice note data
		let voiceNoteData;
		try {
			voiceNoteData = await getVoiceNoteById(voiceNoteId);
		} catch (error) {
			console.error(
				`Error fetching voice note data for ${voiceNoteId}:`,
				error
			);
			// If we fail to get the voice note data after 2 retries, throw the error
			if (retryCount >= 2) {
				throw error;
			}

			// Wait a short time before retrying
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Retry with increment to retry count
			return getVoiceNoteStats(voiceNoteId, retryCount + 1);
		}

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

		// If we've already retried 3 times, return default values
		if (retryCount >= 3) {
			console.warn(
				`Giving up on fetching stats for ${voiceNoteId} after ${retryCount} retries`
			);
			return {
				likes: 0,
				comments: 0,
				shares: 0,
				plays: 0,
			};
		}

		// Wait a bit longer before retrying
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Retry with increment to retry count
		console.log(
			`Retrying getVoiceNoteStats for ${voiceNoteId}, attempt ${retryCount + 1}`
		);
		return getVoiceNoteStats(voiceNoteId, retryCount + 1);
	}
};
