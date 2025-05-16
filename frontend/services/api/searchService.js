/**
 * Search service for handling search-related API calls
 */
import { ENDPOINTS, apiRequest } from "./config";

/**
 * Normalize user data structure
 * @param {Object} user - User data object
 * @returns {Object} - Normalized user object
 */
const normalizeUserData = (user) => {
	// Create a standardized user object
	return {
		id: user.id || "",
		username: user.username || "",
		display_name: user.display_name || user.username || "User",
		avatar_url:
			user.avatar_url ||
			`https://ui-avatars.com/api/?name=${encodeURIComponent(
				user.display_name || user.username || "User"
			)}&background=random`,
		is_verified: user.is_verified || false,
	};
};

/**
 * Normalize voice note data structure
 * @param {Object} note - Voice note data object
 * @returns {Object} - Normalized voice note object
 */
const normalizeVoiceNoteData = (note) => {
	// Create a standardized voice note object
	const normalizedNote = {
		id: note.id || "",
		title: note.title || "",
		duration: typeof note.duration === "number" ? note.duration : 60,
		likes: typeof note.likes === "number" ? note.likes : 0,
		comments: typeof note.comments === "number" ? note.comments : 0,
		plays: typeof note.plays === "number" ? note.plays : 0,
		shares: typeof note.shares === "number" ? note.shares : 0,
		tags: note.tags || [],
		backgroundImage: note.backgroundImage || note.background_image || null,
		user_id: note.user_id || (note.users && note.users.id) || "",
	};

	// Ensure users property is properly formatted
	if (note.users) {
		normalizedNote.users = normalizeUserData(note.users);
	}

	return normalizedNote;
};

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

		// API call to the backend
		const response = await apiRequest(
			`${ENDPOINTS.USERS}/search?term=${encodeURIComponent(searchTerm)}`
		);

		// Check if we got a valid response
		if (response && (response.data || Array.isArray(response))) {
			const userData = response.data || response;
			// Normalize each user object
			return userData.map((user) => normalizeUserData(user));
		}

		return [];
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

		// API call to backend
		const response = await apiRequest(
			`${ENDPOINTS.VOICE_NOTES}/search?${params.toString()}`
		);

		// Check if we got a valid response
		if (response && (response.data || Array.isArray(response))) {
			const voiceNotes = response.data || response;
			// Normalize each voice note
			return voiceNotes.map((note) => normalizeVoiceNoteData(note));
		}

		return [];
	} catch (error) {
		console.error("Error searching voice notes:", error);
		return [];
	}
};
