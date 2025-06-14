const supabase = require("../../config/supabase");
const { randomUUID } = require("crypto");

/**
 * Service layer for voice note interactions (likes, comments, plays, shares)
 */

// ===== LIKES =====

/**
 * Check if user has liked a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {boolean} Whether user has liked the voice note
 */
const checkUserLiked = async (voiceNoteId, userId) => {
	const { data, error } = await supabase
		.from("voice_note_likes")
		.select("id")
		.eq("voice_note_id", voiceNoteId)
		.eq("user_id", userId)
		.single();

	if (error && error.code !== "PGRST116") throw error;
	return !!data;
};

/**
 * Like a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Object} Created like record
 */
const likeVoiceNote = async (voiceNoteId, userId) => {
	// Check if already liked
	const alreadyLiked = await checkUserLiked(voiceNoteId, userId);
	if (alreadyLiked) {
		// Return existing like instead of throwing error
		const { data, error } = await supabase
			.from("voice_note_likes")
			.select("*")
			.eq("voice_note_id", voiceNoteId)
			.eq("user_id", userId)
			.single();

		if (error) throw error;
		return data;
	}

	const { data, error } = await supabase
		.from("voice_note_likes")
		.insert([{ voice_note_id: voiceNoteId, user_id: userId }])
		.select()
		.single();

	if (error) throw error;
	return data;
};

/**
 * Unlike a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {boolean} Success status
 */
const unlikeVoiceNote = async (voiceNoteId, userId) => {
	const { error } = await supabase
		.from("voice_note_likes")
		.delete()
		.eq("voice_note_id", voiceNoteId)
		.eq("user_id", userId);

	if (error) throw error;
	return true;
};

/**
 * Get likes for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Array} List of likes with user info
 */
const getVoiceNoteLikes = async (voiceNoteId) => {
	const { data, error } = await supabase
		.from("voice_note_likes")
		.select("*, users:user_id (id, username, display_name, avatar_url)")
		.eq("voice_note_id", voiceNoteId)
		.order("created_at", { ascending: false });

	if (error) throw error;
	return data;
};

// ===== COMMENTS =====

/**
 * Get comments for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {Object} options - Pagination options
 * @returns {Object} Comments with pagination info
 */
const getVoiceNoteComments = async (voiceNoteId, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const offset = (page - 1) * limit;

	const { data, error, count } = await supabase
		.from("voice_note_comments")
		.select("*, users:user_id (id, username, display_name, avatar_url)", {
			count: "exact",
		})
		.eq("voice_note_id", voiceNoteId)
		.order("created_at", { ascending: false })
		.range(offset, offset + parseInt(limit) - 1);

	if (error) throw error;

	// Process the data to ensure user info is properly structured
	const processedData = data.map((comment) => ({
		...comment,
		user: comment.users, // Rename users to user to match frontend expectations
	}));

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
 * Add a comment to a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @param {string} content - Comment content
 * @returns {Object} Created comment with user info
 */
const addComment = async (voiceNoteId, userId, content) => {
	const { data, error } = await supabase
		.from("voice_note_comments")
		.insert([{ voice_note_id: voiceNoteId, user_id: userId, content }])
		.select("*, users:user_id (id, username, display_name, avatar_url)")
		.single();

	if (error) throw error;

	// Process the data to ensure user info is properly structured
	return {
		...data,
		user: data.users, // Rename users to user to match frontend expectations
	};
};

// ===== PLAYS =====

/**
 * Record a play for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID (can be null for anonymous plays)
 * @returns {Object} Created play record
 */
const recordPlay = async (voiceNoteId, userId = null) => {
	const { data, error } = await supabase
		.from("voice_note_plays")
		.insert([
			{
				voice_note_id: voiceNoteId,
				user_id: userId, // Allow anonymous plays
			},
		])
		.select()
		.single();

	if (error) throw error;
	return data;
};

// ===== SHARES =====

/**
 * Check if user has shared a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {boolean} Whether user has shared the voice note
 */
const checkUserShared = async (voiceNoteId, userId) => {
	const { data, error } = await supabase
		.from("voice_note_shares")
		.select("id")
		.eq("voice_note_id", voiceNoteId)
		.eq("user_id", userId)
		.single();

	if (error && error.code !== "PGRST116") throw error;
	return !!data;
};

/**
 * Share a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Object} Created share record
 */
const shareVoiceNote = async (voiceNoteId, userId) => {
	// Check if already shared
	const alreadyShared = await checkUserShared(voiceNoteId, userId);
	if (alreadyShared) {
		throw new Error("Already shared this voice note");
	}

	console.log(
		`[DEBUG] Attempting to insert share record: voiceNoteId=${voiceNoteId}, userId=${userId}`
	);

	// Try using a stored function first (if it exists)
	try {
		const { data, error } = await supabase.rpc("create_voice_note_share", {
			p_voice_note_id: voiceNoteId,
			p_user_id: userId,
		});

		if (!error && data) {
			console.log(`[DEBUG] Share insert successful via RPC:`, data);
			return data[0] || data; // Handle array or single object response
		}
	} catch (rpcError) {
		console.log(
			`[DEBUG] RPC function not available, falling back to direct insert`
		);
	}

	// Fallback to direct insert with explicit UUID
	const shareId = randomUUID();
	console.log(`[DEBUG] Generated share ID: ${shareId}`);

	const { data, error } = await supabase
		.from("voice_note_shares")
		.insert([
			{
				id: shareId,
				voice_note_id: voiceNoteId,
				user_id: userId,
			},
		])
		.select()
		.single();

	if (error) {
		console.error(`[DEBUG] Share insert error:`, {
			error,
			voiceNoteId,
			userId,
			shareId,
			errorCode: error.code,
			errorMessage: error.message,
			errorDetails: error.details,
			errorHint: error.hint,
		});
		throw error;
	}

	console.log(`[DEBUG] Share insert successful:`, data);
	return data;
};

/**
 * Unshare a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {boolean} Success status
 */
const unshareVoiceNote = async (voiceNoteId, userId) => {
	const { error } = await supabase
		.from("voice_note_shares")
		.delete()
		.eq("voice_note_id", voiceNoteId)
		.eq("user_id", userId);

	if (error) throw error;
	return true;
};

/**
 * Get shares for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {Object} options - Pagination options
 * @returns {Object} Shares with pagination info
 */
const getVoiceNoteShares = async (voiceNoteId, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const offset = (page - 1) * limit;

	const { data, error, count } = await supabase
		.from("voice_note_shares")
		.select("*, users:user_id (id, username, display_name, avatar_url)", {
			count: "exact",
		})
		.eq("voice_note_id", voiceNoteId)
		.order("shared_at", { ascending: false })
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

module.exports = {
	// Likes
	checkUserLiked,
	likeVoiceNote,
	unlikeVoiceNote,
	getVoiceNoteLikes,
	// Comments
	getVoiceNoteComments,
	addComment,
	// Plays
	recordPlay,
	// Shares
	checkUserShared,
	shareVoiceNote,
	unshareVoiceNote,
	getVoiceNoteShares,
};
