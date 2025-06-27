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
	console.log("[SHARE DEBUG] checkUserShared - Checking:", {
		voiceNoteId,
		userId,
	});

	const { data, error } = await supabase
		.from("voice_note_shares")
		.select("id, user_id, voice_note_id, shared_at")
		.eq("voice_note_id", voiceNoteId)
		.eq("user_id", userId)
		.single();

	if (error && error.code !== "PGRST116") {
		console.error("[SHARE DEBUG] checkUserShared - Database error:", error);
		throw error;
	}

	const hasShared = !!data;
	console.log("[SHARE DEBUG] checkUserShared - Result:", {
		voiceNoteId,
		userId,
		hasShared,
		foundRecord: data || null,
		errorCode: error?.code,
	});

	return hasShared;
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

	// Try using a stored function first (if it exists)
	try {
		const { data, error } = await supabase.rpc("create_voice_note_share", {
			p_voice_note_id: voiceNoteId,
			p_user_id: userId,
		});

		if (!error && data) {
			return data[0] || data; // Handle array or single object response
		}
	} catch (rpcError) {
		// RPC function not available, fall back to direct insert
	}

	// Fallback to direct insert with explicit UUID
	const shareId = randomUUID();

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
		throw error;
	}

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

/**
 * Get the count of shares for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {number} Number of shares
 */
const getVoiceNoteShareCount = async (voiceNoteId) => {
	console.log(
		"[SHARE DEBUG] getVoiceNoteShareCount - Starting count query for:",
		voiceNoteId
	);

	try {
		const { count, error } = await supabase
			.from("voice_note_shares")
			.select("*", { count: "exact", head: true })
			.eq("voice_note_id", voiceNoteId);

		if (error) {
			console.error(
				"[SHARE DEBUG] getVoiceNoteShareCount - Database error:",
				error
			);
			throw error;
		}

		const finalCount = count || 0;
		console.log("[SHARE DEBUG] getVoiceNoteShareCount - Count result:", {
			voiceNoteId,
			count: finalCount,
			rawCount: count,
		});

		// Also fetch actual records for debugging inconsistencies
		if (finalCount === 0) {
			const { data: records, error: recordsError } = await supabase
				.from("voice_note_shares")
				.select("id, user_id, voice_note_id, shared_at")
				.eq("voice_note_id", voiceNoteId);

			console.log(
				"[SHARE DEBUG] getVoiceNoteShareCount - Records check for count=0:",
				{
					voiceNoteId,
					recordsFound: records?.length || 0,
					records: records || [],
					recordsError: recordsError?.message,
				}
			);
		}

		return finalCount;
	} catch (error) {
		console.error(
			"[SHARE DEBUG] getVoiceNoteShareCount - Unexpected error:",
			error
		);
		throw error;
	}
};

// ===== NEW CLEAN INTERACTION SYSTEM =====

/**
 * Toggle like status for a voice note (NEW SYSTEM)
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Object} {isLiked: boolean, likesCount: number}
 */
const toggleLikeNew = async (voiceNoteId, userId) => {
	console.log(
		`[NEW LIKE] Toggle like: voiceNoteId=${voiceNoteId}, userId=${userId}`
	);

	try {
		// Check current like status
		const { data: existingLike, error: checkError } = await supabase
			.from("voice_note_likes")
			.select("id")
			.eq("voice_note_id", voiceNoteId)
			.eq("user_id", userId)
			.single();

		if (checkError && checkError.code !== "PGRST116") {
			throw checkError;
		}

		const isCurrentlyLiked = !!existingLike;
		console.log(`[NEW LIKE] Current status: isLiked=${isCurrentlyLiked}`);

		if (isCurrentlyLiked) {
			// Remove like
			const { error: deleteError } = await supabase
				.from("voice_note_likes")
				.delete()
				.eq("voice_note_id", voiceNoteId)
				.eq("user_id", userId);

			if (deleteError) throw deleteError;
		} else {
			// Add like
			const { error: insertError } = await supabase
				.from("voice_note_likes")
				.insert([{ voice_note_id: voiceNoteId, user_id: userId }]);

			if (insertError) throw insertError;
		}

		// Get new count
		const { count, error: countError } = await supabase
			.from("voice_note_likes")
			.select("*", { count: "exact", head: true })
			.eq("voice_note_id", voiceNoteId);

		if (countError) throw countError;

		const newIsLiked = !isCurrentlyLiked;
		const newCount = count || 0;

		console.log(`[NEW LIKE] Result: isLiked=${newIsLiked}, count=${newCount}`);

		return {
			isLiked: newIsLiked,
			likesCount: newCount,
		};
	} catch (error) {
		console.error(`[NEW LIKE] Error:`, error);
		throw error;
	}
};

/**
 * Toggle share status for a voice note (NEW SYSTEM)
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Object} {isShared: boolean, sharesCount: number}
 */
const toggleShareNew = async (voiceNoteId, userId) => {
	console.log(
		`[NEW SHARE] Toggle share: voiceNoteId=${voiceNoteId}, userId=${userId}`
	);

	try {
		// Check current share status
		const { data: existingShare, error: checkError } = await supabase
			.from("voice_note_shares")
			.select("id")
			.eq("voice_note_id", voiceNoteId)
			.eq("user_id", userId)
			.single();

		if (checkError && checkError.code !== "PGRST116") {
			throw checkError;
		}

		const isCurrentlyShared = !!existingShare;
		console.log(`[NEW SHARE] Current status: isShared=${isCurrentlyShared}`);

		if (isCurrentlyShared) {
			// Remove share
			const { error: deleteError } = await supabase
				.from("voice_note_shares")
				.delete()
				.eq("voice_note_id", voiceNoteId)
				.eq("user_id", userId);

			if (deleteError) throw deleteError;
		} else {
			// Add share
			const shareId = randomUUID();
			const { error: insertError } = await supabase
				.from("voice_note_shares")
				.insert([
					{
						id: shareId,
						voice_note_id: voiceNoteId,
						user_id: userId,
						shared_at: new Date().toISOString(),
					},
				]);

			if (insertError) throw insertError;
		}

		// Get new count
		const { count, error: countError } = await supabase
			.from("voice_note_shares")
			.select("*", { count: "exact", head: true })
			.eq("voice_note_id", voiceNoteId);

		if (countError) throw countError;

		const newIsShared = !isCurrentlyShared;
		const newCount = count || 0;

		console.log(
			`[NEW SHARE] Result: isShared=${newIsShared}, count=${newCount}`
		);

		return {
			isShared: newIsShared,
			sharesCount: newCount,
		};
	} catch (error) {
		console.error(`[NEW SHARE] Error:`, error);
		throw error;
	}
};

/**
 * Get interaction status for a voice note (NEW SYSTEM)
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID (optional)
 * @returns {Object} {isLiked: boolean, likesCount: number, isShared: boolean, sharesCount: number}
 */
const getInteractionStatusNew = async (voiceNoteId, userId = null) => {
	console.log(
		`[NEW STATUS] Get interaction status: voiceNoteId=${voiceNoteId}, userId=${userId}`
	);

	try {
		// Get counts in parallel
		const [
			{ count: likesCount, error: likesError },
			{ count: sharesCount, error: sharesError },
		] = await Promise.all([
			supabase
				.from("voice_note_likes")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", voiceNoteId),
			supabase
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", voiceNoteId),
		]);

		if (likesError) throw likesError;
		if (sharesError) throw sharesError;

		let isLiked = false;
		let isShared = false;

		// Check user status if userId provided
		if (userId) {
			const [
				{ data: likeData, error: likeCheckError },
				{ data: shareData, error: shareCheckError },
			] = await Promise.all([
				supabase
					.from("voice_note_likes")
					.select("id")
					.eq("voice_note_id", voiceNoteId)
					.eq("user_id", userId)
					.single(),
				supabase
					.from("voice_note_shares")
					.select("id")
					.eq("voice_note_id", voiceNoteId)
					.eq("user_id", userId)
					.single(),
			]);

			// Ignore "not found" errors
			if (likeCheckError && likeCheckError.code !== "PGRST116") {
				throw likeCheckError;
			}
			if (shareCheckError && shareCheckError.code !== "PGRST116") {
				throw shareCheckError;
			}

			isLiked = !!likeData;
			isShared = !!shareData;
		}

		const result = {
			isLiked,
			likesCount: likesCount || 0,
			isShared,
			sharesCount: sharesCount || 0,
		};

		console.log(`[NEW STATUS] Result:`, result);
		return result;
	} catch (error) {
		console.error(`[NEW STATUS] Error:`, error);
		throw error;
	}
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
	getVoiceNoteShareCount,
	// NEW CLEAN SYSTEM
	toggleLikeNew,
	toggleShareNew,
	getInteractionStatusNew,
};
