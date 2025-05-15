/**
 * Search service for handling search-related API calls
 */
import { ENDPOINTS, apiRequest } from "./config";

/**
 * Search for users by term
 * @param {string} term - Search term
 * @returns {Promise<Array>} - List of matching users
 */
export const searchUsers = async (term) => {
	try {
		if (!term || term.trim().length === 0) {
			return [];
		}

		// Replace # with empty string if search term starts with it
		const searchTerm = term.startsWith("#") ? term.substring(1) : term;

		const response = await apiRequest(
			`${ENDPOINTS.USERS}/search?term=${encodeURIComponent(searchTerm)}`
		);
		return response.data || response || [];
	} catch (error) {
		console.error("Error searching users:", error);
		return [];
	}
};

/**
 * Search for voice notes by term
 * @param {string} term - Search term
 * @param {boolean} tagOnly - Search only in tags (default: false)
 * @returns {Promise<Array>} - List of matching voice notes
 */
export const searchVoiceNotes = async (term, tagOnly = false) => {
	try {
		if (!term || term.trim().length === 0) {
			return [];
		}

		// Determine if this is a tag search
		const isTagSearch = term.startsWith("#");

		// Remove # prefix if present for backend query
		const searchTerm = isTagSearch ? term.substring(1) : term;

		// Construct query params
		const params = new URLSearchParams();
		params.append("term", searchTerm);

		// If we're doing a tag-only search or the search term starts with #, specify that we want to search tags
		if (tagOnly || isTagSearch) {
			params.append("searchType", "tag");
		}

		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/search?${params.toString()}`
		);

		const voiceNotes = response.data || response || [];

		// Normalize the data format
		return voiceNotes.map((note) => ({
			...note,
			// Ensure we have the right properties with fallbacks
			likes: note.likes || 0,
			comments: note.comments || 0,
			plays: note.plays || 0,
			shares: note.shares || 0,
			tags: note.tags || [],
		}));
	} catch (error) {
		console.error("Error searching voice notes:", error);
		return [];
	}
};
