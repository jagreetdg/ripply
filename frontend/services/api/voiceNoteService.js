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
	console.log("Fetching personalized feed for user:", userId);
	const queryString = new URLSearchParams(params).toString();
	const endpoint = queryString
		? `${ENDPOINTS.VOICE_NOTES}/feed/${userId}?${queryString}`
		: `${ENDPOINTS.VOICE_NOTES}/feed/${userId}`;
	const response = await apiRequest(endpoint);

	// Extract just the voice notes array from the response
	const voiceNotes = response.data || [];

	// Log the data structure to help debug
	console.log(
		"Personalized feed data structure sample:",
		voiceNotes.length > 0
			? JSON.stringify(voiceNotes[0], null, 2)
			: "No voice notes"
	);

	// Ensure each voice note has proper user data
	return voiceNotes.map((note) => {
		// If the note already has user data, use it
		if (note.users && note.users.display_name) {
			return note;
		}

		// If not, add a placeholder
		return {
			...note,
			users: note.users || {
				id: note.user_id,
				username: "user",
				display_name: "User",
				avatar_url: null,
			},
		};
	});
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
	const response = await apiRequest(endpoint);

	// The backend returns data in a nested structure with pagination
	// Extract just the voice notes array from the response
	const voiceNotes = response.data || [];

	// Log the data structure to help debug
	console.log(
		"Voice notes data structure sample:",
		voiceNotes.length > 0
			? JSON.stringify(voiceNotes[0], null, 2)
			: "No voice notes"
	);

	// Ensure each voice note has proper user data
	return voiceNotes.map((note) => {
		// If the note already has user data, use it
		if (note.users && note.users.display_name) {
			return note;
		}

		// If not, add a placeholder
		return {
			...note,
			users: note.users || {
				id: note.user_id,
				username: "user",
				display_name: "User",
				avatar_url: null,
			},
		};
	});
};

/**
 * Get a voice note by ID
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Voice note data
 */
export const getVoiceNoteById = (voiceNoteId) => {
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`);
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
 * Record a share for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - ID of user sharing the voice note
 * @returns {Promise<Object>} - Share data with updated count
 */
export const recordShare = async (voiceNoteId, userId) => {
	console.log(
		`Recording share for voice note: ${voiceNoteId} by user: ${userId}`
	);
	return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`, {
		method: "POST",
		body: JSON.stringify({ userId: userId }),
	});
};

/**
 * Get share count for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Share count data
 */
export const getShareCount = async (voiceNoteId) => {
	const response = await apiRequest(
		`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`
	);
	return response.data?.shareCount || 0;
};
