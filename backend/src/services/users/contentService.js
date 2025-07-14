const { supabase, supabaseAdmin } = require("../../config/supabase");
const { processVoiceNoteCounts } = require("../../utils/voiceNotes/processors");
const { VOICE_NOTE_SELECT_QUERY } = require("../voiceNotes/voiceNoteService");

/**
 * Service layer for user content management
 */

/**
 * Get voice notes created by a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User's voice notes with pagination
 */
const getUserVoiceNotes = async (userId, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const offset = (page - 1) * limit;

	const { data, error, count } = await supabaseAdmin
		.from("voice_notes")
		.select(VOICE_NOTE_SELECT_QUERY, {
			count: "exact",
		})
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	// Get actual share counts for all voice notes in parallel
	const shareCountPromises = data.map(async (note) => {
		try {
			const { count } = await supabaseAdmin
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

	// Process the data to format tags and counts
	const processedData = data.map((note) => {
		// Extract tags from the nested structure
		const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

		const processedNote = {
			...processVoiceNoteCounts(note),
			tags,
		};

		// Override the share count with the actual count
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
 * Get voice notes shared by a user (reposted content)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} User's shared voice notes with pagination
 */
const getUserSharedVoiceNotes = async (userId, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const offset = (page - 1) * limit;

	console.log(
		`[DEBUG] getUserSharedVoiceNotes service - userId: ${userId}, page: ${page}, limit: ${limit}, offset: ${offset}`
	);

	try {
		// First get all the voice note share records by the user, with sharer's details
		console.log(`[DEBUG] Fetching voice_note_shares for user ${userId}`);
		const {
			data: sharedEntries,
			error: sharedError,
			count: totalSharesCount,
		} = await supabaseAdmin
			.from("voice_note_shares")
			.select(
				"voice_note_id, shared_at, user_id, sharer_details:users (id, username, display_name, avatar_url)",
				{ count: "exact" }
			)
			.eq("user_id", userId) // Filter shares made by the profile user
			.order("shared_at", { ascending: false }) // Order by when the share happened
			.range(offset, offset + parseInt(limit) - 1);

		console.log(`[DEBUG] voice_note_shares query result:`, {
			error: sharedError,
			dataLength: sharedEntries?.length,
			totalSharesCount,
		});

		if (sharedError) {
			console.error(`[DEBUG] Error in voice_note_shares query:`, {
				code: sharedError.code,
				message: sharedError.message,
				details: sharedError.details,
				hint: sharedError.hint,
			});

			if (sharedError.code === "42P01") {
				// Table doesn't exist
				console.log(
					`[DEBUG] voice_note_shares table doesn't exist, returning empty result`
				);
				return {
					data: [],
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total: 0,
						totalPages: 0,
					},
					message: "Shared voice notes feature not fully configured.",
				};
			}
			throw sharedError;
		}

		if (!sharedEntries || sharedEntries.length === 0) {
			console.log(`[DEBUG] No shared entries found for user ${userId}`);
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

		const voiceNoteIds = sharedEntries.map((entry) => entry.voice_note_id);
		console.log(
			`[DEBUG] Found ${voiceNoteIds.length} voice note IDs to fetch:`,
			voiceNoteIds
		);

		// Get the actual voice note data for these IDs, including original creator's details
		console.log(`[DEBUG] Fetching voice_notes data for IDs:`, voiceNoteIds);
		const { data: voiceNotesData, error: voiceNotesError } = await supabaseAdmin
			.from("voice_notes")
			.select(
				`
				*,
				users (id, username, display_name, avatar_url), 
				likes:voice_note_likes (count),
				comments:voice_note_comments (count),
				plays:voice_note_plays (count),
				tags:voice_note_tags (tag_name)
			`
			)
			.in("id", voiceNoteIds);

		console.log(`[DEBUG] voice_notes query result:`, {
			error: voiceNotesError,
			dataLength: voiceNotesData?.length,
		});

		if (voiceNotesError) {
			console.error(
				"[ERROR] Error fetching voice note details for shared items:",
				{
					code: voiceNotesError.code,
					message: voiceNotesError.message,
					details: voiceNotesError.details,
					hint: voiceNotesError.hint,
				}
			);
			throw voiceNotesError;
		}

		console.log(
			`[DEBUG] Starting share count queries for ${voiceNotesData.length} voice notes`
		);
		// Get actual share counts for all voice notes in parallel
		const shareCountPromises = voiceNotesData.map(async (note) => {
			try {
				const { count } = await supabaseAdmin
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
		console.log(`[DEBUG] Share counts fetched:`, shareCounts);

		const shareCountMap = shareCounts.reduce(
			(map, { voiceNoteId, shareCount }) => {
				map[voiceNoteId] = shareCount;
				return map;
			},
			{}
		);

		console.log(`[DEBUG] Processing ${voiceNotesData.length} voice notes data`);
		// Combine voice note data with share information
		const processedData = voiceNotesData.map((note) => {
			const tags = note.tags ? note.tags.map((tagObj) => tagObj.tag_name) : [];
			const shareInfo = sharedEntries.find(
				(entry) => entry.voice_note_id === note.id
			);

			// note.users is the original creator of the voice note
			// shareInfo.sharer_details is the user who shared this note (the profile owner)
			const processedNote = {
				...processVoiceNoteCounts(note),
				tags,
				is_shared: true,
				shared_at: shareInfo ? shareInfo.shared_at : null,
				shared_by: shareInfo?.sharer_details
					? {
							id: shareInfo.sharer_details.id,
							username: shareInfo.sharer_details.username,
							display_name: shareInfo.sharer_details.display_name,
							avatar_url: shareInfo.sharer_details.avatar_url,
					  }
					: null,
			};

			// Override the share count with the actual count
			processedNote.shares = shareCountMap[note.id] || 0;

			return processedNote;
		});

		// Re-sort based on the share time (created_at from voice_note_shares)
		processedData.sort((a, b) => {
			const dateA = a.shared_at ? new Date(a.shared_at).getTime() : 0;
			const dateB = b.shared_at ? new Date(b.shared_at).getTime() : 0;
			return dateB - dateA;
		});

		console.log(
			`[DEBUG] getUserSharedVoiceNotes completed successfully with ${processedData.length} items`
		);
		return {
			data: processedData,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: totalSharesCount,
				totalPages: Math.ceil(totalSharesCount / limit),
			},
		};
	} catch (error) {
		console.error(`[ERROR] getUserSharedVoiceNotes failed:`, {
			message: error.message,
			code: error.code,
			details: error.details,
			hint: error.hint,
			stack: error.stack,
		});
		throw error;
	}
};

/**
 * Get combined content for a user (both original and shared)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Combined user content with pagination
 */
const getUserCombinedContent = async (userId, options = {}) => {
	const { page = 1, limit = 10 } = options;

	// For combined content, we could either:
	// 1. Fetch both types and merge them (more complex pagination)
	// 2. Implement this as a separate database view/query
	// For now, let's implement a simple version that gets both and merges

	const [originalContent, sharedContent] = await Promise.all([
		getUserVoiceNotes(userId, { page: 1, limit: 50 }), // Get more to have content to mix
		getUserSharedVoiceNotes(userId, { page: 1, limit: 50 }),
	]);

	// Combine and sort by date (either created_at or shared_at)
	const allContent = [
		...originalContent.data.map((item) => ({
			...item,
			sort_date: item.created_at,
			content_type: "original",
		})),
		...sharedContent.data.map((item) => ({
			...item,
			sort_date: item.shared_at || item.created_at,
			content_type: "shared",
		})),
	];

	// Sort by date (newest first)
	allContent.sort((a, b) => {
		const dateA = new Date(a.sort_date).getTime();
		const dateB = new Date(b.sort_date).getTime();
		return dateB - dateA;
	});

	// Apply pagination to the combined results
	const offset = (page - 1) * limit;
	const paginatedContent = allContent.slice(offset, offset + limit);

	return {
		data: paginatedContent,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: allContent.length,
			totalPages: Math.ceil(allContent.length / limit),
		},
		summary: {
			originalCount: originalContent.data.length,
			sharedCount: sharedContent.data.length,
			totalContent: allContent.length,
		},
	};
};

module.exports = {
	getUserVoiceNotes,
	getUserSharedVoiceNotes,
	getUserCombinedContent,
};
