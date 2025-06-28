const supabase = require("../../config/supabase");
const { processVoiceNoteCounts } = require("../../utils/voiceNotes/processors");

/**
 * Service layer for basic voice note CRUD operations
 */

const VOICE_NOTE_SELECT_QUERY = `
	*,
	users:user_id (id, username, display_name, avatar_url, is_verified),
	likes:voice_note_likes (count),
	comments:voice_note_comments (count),
	plays:voice_note_plays (count),
	tags:voice_note_tags (tag_name)
`;

/**
 * Get a single voice note by ID
 * @param {string} id - Voice note ID
 * @returns {Object|null} Voice note data with engagement stats or null if not found
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

	// Get actual share count
	try {
		const { count: shareCount } = await supabase
			.from("voice_note_shares")
			.select("*", { count: "exact", head: true })
			.eq("voice_note_id", id);

		// Process the voice note and override share count
		const processedNote = processVoiceNoteCounts(data);
		processedNote.shares = shareCount || 0;

		return processedNote;
	} catch (shareError) {
		console.warn(`Failed to get share count for ${id}:`, shareError);
		// Process normally and set shares to 0
		const processedNote = processVoiceNoteCounts(data);
		processedNote.shares = 0;
		return processedNote;
	}
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
		tag,
		search,
		discover,
		currentUserId,
	} = options;
	const offset = (page - 1) * limit;

	let query = supabase.from("voice_notes").select(VOICE_NOTE_SELECT_QUERY, {
		count: "exact",
	});

	if (userId) {
		query = query.eq("user_id", userId);
	}

	query = query.order("created_at", { ascending: false });

	const { data, error, count } = await query.range(offset, offset + limit - 1);

	if (error) throw error;
	// Get actual share counts for all voice notes in parallel
	const shareCountPromises = data.map(async (note) => {
		try {
			const { count } = await supabase
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", note.id);
			return { voiceNoteId: note.id, shareCount: count || 0 };
		} catch (error) {
			console.warn(`Failed to get share count for ${note.id}:`, error);
			return { voiceNoteId: note.id, shareCount: 0 };
		}
	});

	const shareCounts = await Promise.all(shareCountPromises);
	const shareCountMap = shareCounts.reduce(
		(map, { voiceNoteId, shareCount }) => {
			map[voiceNoteId] = shareCount;
			return map;
		},
		{}
	);

	// Process data and override share counts
	const processedData = data.map((note) => {
		const processedNote = processVoiceNoteCounts(note);
		processedNote.shares = shareCountMap[note.id] || 0;
		return processedNote;
	});

	return {
		data: processedData,
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
 * @param {string} searchTerm - Search query
 * @param {Object} options - Search options
 * @param {string} options.searchType - Search type: 'title' or 'tag'
 * @returns {Array} Matching voice notes
 */
const searchVoiceNotes = async (searchTerm, options = {}) => {
	const { page = 1, limit = 10, searchType = "title", currentUserId } = options;
	const offset = (page - 1) * limit;

	let query;

	if (searchType === "tag") {
		// This path is for specific tag searches (e.g., from clicking a tag)
		const { data: tagData, error: tagError } = await supabase
			.from("voice_note_tags")
			.select("voice_note_id")
			.ilike("tag_name", `%${searchTerm}%`);

		if (tagError) throw tagError;
		const voiceNoteIds = tagData.map((match) => match.voice_note_id);

		if (voiceNoteIds.length === 0) {
			return { data: [], pagination: { total: 0, totalPages: 0 } };
		}

		// Since this path is simpler, we can use the standard query for consistency
		query = supabase
			.from("voice_notes")
			.select(VOICE_NOTE_SELECT_QUERY, { count: "exact" })
			.in("id", voiceNoteIds);
	} else {
		// This path uses the new RPC for unified title and tag text search
		query = supabase.rpc(
			"search_voice_notes",
			{
				search_term: searchTerm,
				current_user_id: currentUserId,
			},
			{ count: "exact" }
		);
	}

	const { data, error, count } = await query
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("[SEARCH SERVICE ERROR]", { searchType, searchTerm }, error);
		throw error;
	}

	// For the RPC path, we need to restructure the data slightly to match
	// the shape expected by the frontend (which was based on the standard query).
	const processedData = data.map((note) => {
		if (searchType !== "tag") {
			// Data from RPC is already shaped, just need to rename fields
			return {
				id: note.id,
				user_id: note.user_id,
				title: note.title,
				audio_url: note.audio_url,
				waveform_data: note.waveform_data,
				is_private: note.is_private,
				created_at: note.created_at,
				duration_seconds: note.duration_seconds,
				users: note.users,
				tags: note.tags || [], // Ensure tags is always an array
				likes: note.likes_count || 0,
				comments: note.comments_count || 0,
				plays: note.plays_count || 0,
				shares: note.shares_count || 0,
				user_has_liked: note.user_has_liked,
				user_has_shared: note.user_has_shared,
			};
		}
		// Data from the 'tag' search path needs the standard processing
		const processedNote = processVoiceNoteCounts(note);
		processedNote.shares = 0; // Will be replaced by exact count below
		return processedNote;
	});

	// For the 'tag' search path, we still need to fetch exact share counts.
	// The RPC path already includes this.
	if (searchType === "tag") {
		const shareCountPromises = processedData.map(async (note) => {
			try {
				const { count: shareCount } = await supabase
					.from("voice_note_shares")
					.select("*", { count: "exact", head: true })
					.eq("voice_note_id", note.id);
				return { voiceNoteId: note.id, shareCount: shareCount || 0 };
			} catch (shareError) {
				console.warn(`Failed to get share count for ${note.id}:`, shareError);
				return { voiceNoteId: note.id, shareCount: 0 };
			}
		});

		const shareCounts = await Promise.all(shareCountPromises);
		const shareCountMap = shareCounts.reduce(
			(map, { voiceNoteId, shareCount }) => {
				map[voiceNoteId] = shareCount;
				return map;
			},
			{}
		);

		// Apply the exact share counts
		processedData.forEach((note) => {
			note.shares = shareCountMap[note.id] || 0;
		});
	}

	return {
		data: processedData,
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
	VOICE_NOTE_SELECT_QUERY,
};
