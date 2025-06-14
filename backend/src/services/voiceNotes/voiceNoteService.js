const supabase = require("../../config/supabase");

/**
 * Service layer for basic voice note CRUD operations
 */

/**
 * Get a single voice note by ID with all related data
 * @param {string} id - Voice note ID
 * @returns {Object|null} Voice note with user info and engagement counts, or null if not found
 */
const getVoiceNoteById = async (id) => {
	const { data, error } = await supabase
		.from("voice_notes")
		.select(
			`
			*,
			users:user_id (id, username, display_name, avatar_url, is_verified),
			likes:voice_note_likes (count),
			comments:voice_note_comments (count),
			plays:voice_note_plays (count),
			shares:voice_note_shares (count),
			tags:voice_note_tags (tag_name)
		`
		)
		.eq("id", id)
		.single();

	// Handle the case when no record is found
	if (error) {
		// PGRST116 = "JSON object requested, multiple (or no) rows returned"
		// This means the record doesn't exist, so return null instead of throwing
		if (error.code === "PGRST116") {
			return null;
		}
		// For other errors, still throw
		throw error;
	}

	return data;
};

/**
 * Get voice notes with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.userId - Filter by user ID
 * @param {string} options.orderBy - Order by field (default: created_at)
 * @param {boolean} options.ascending - Sort order (default: false)
 * @returns {Object} Voice notes with pagination info
 */
const getVoiceNotes = async (options = {}) => {
	const {
		page = 1,
		limit = 10,
		userId,
		orderBy = "created_at",
		ascending = false,
	} = options;

	const offset = (page - 1) * limit;

	let query = supabase.from("voice_notes").select(
		`
			*,
			users:user_id (id, username, display_name, avatar_url, is_verified),
			likes:voice_note_likes (count),
			comments:voice_note_comments (count),
			plays:voice_note_plays (count),
			shares:voice_note_shares (count),
			tags:voice_note_tags (tag_name)
		`,
		{ count: "exact" }
	);

	if (userId) {
		query = query.eq("user_id", userId);
	}

	const { data, error, count } = await query
		.order(orderBy, { ascending })
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
 * Create a new voice note
 * @param {Object} voiceNoteData - Voice note data
 * @returns {Object} Created voice note
 */
const createVoiceNote = async (voiceNoteData) => {
	const { data, error } = await supabase
		.from("voice_notes")
		.insert([voiceNoteData])
		.select(
			`
			*,
			users:user_id (id, username, display_name, avatar_url, is_verified)
		`
		)
		.single();

	if (error) throw error;
	return data;
};

/**
 * Update a voice note
 * @param {string} id - Voice note ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated voice note
 */
const updateVoiceNote = async (id, updates) => {
	const { data, error } = await supabase
		.from("voice_notes")
		.update(updates)
		.eq("id", id)
		.select(
			`
			*,
			users:user_id (id, username, display_name, avatar_url, is_verified)
		`
		)
		.single();

	if (error) throw error;
	return data;
};

/**
 * Delete a voice note
 * @param {string} id - Voice note ID
 * @returns {boolean} Success status
 */
const deleteVoiceNote = async (id) => {
	const { error } = await supabase.from("voice_notes").delete().eq("id", id);

	if (error) throw error;
	return true;
};

/**
 * Search voice notes by title or tags
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} options.searchType - Search type: 'title' or 'tag'
 * @returns {Array} Matching voice notes
 */
const searchVoiceNotes = async (query, options = {}) => {
	const { page = 1, limit = 10, searchType = "title" } = options;
	const offset = (page - 1) * limit;

	let voiceNoteQuery = supabase.from("voice_notes").select(
		`
			*,
			users:user_id (id, username, display_name, avatar_url, is_verified),
			likes:voice_note_likes (count),
			comments:voice_note_comments (count),
			plays:voice_note_plays (count),
			shares:voice_note_shares (count),
			tags:voice_note_tags (tag_name)
		`,
		{ count: "exact" }
	);

	if (searchType === "tag") {
		// Search by tags: first get voice note IDs that have matching tags
		const { data: tagMatches, error: tagError } = await supabase
			.from("voice_note_tags")
			.select("voice_note_id")
			.ilike("tag_name", `%${query}%`);

		if (tagError) throw tagError;

		if (!tagMatches || tagMatches.length === 0) {
			return {
				data: [],
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: 0,
					totalPages: 0,
				},
			};
		}

		// Get the voice note IDs from the tag matches
		const voiceNoteIds = tagMatches.map((match) => match.voice_note_id);
		voiceNoteQuery = voiceNoteQuery.in("id", voiceNoteIds);
	} else {
		// Search by title (default)
		voiceNoteQuery = voiceNoteQuery.ilike("title", `%${query}%`);
	}

	const { data, error, count } = await voiceNoteQuery
		.order("created_at", { ascending: false })
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
 * Get voice notes by specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User's voice notes with pagination
 */
const getVoiceNotesByUser = async (userId, options = {}) => {
	return getVoiceNotes({ ...options, userId });
};

module.exports = {
	getVoiceNoteById,
	getVoiceNotes,
	createVoiceNote,
	updateVoiceNote,
	deleteVoiceNote,
	searchVoiceNotes,
	getVoiceNotesByUser,
};
