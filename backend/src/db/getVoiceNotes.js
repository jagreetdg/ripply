// Database utility to get voice notes from Supabase
const { supabase, supabaseAdmin } = require("../config/supabase");
require("dotenv").config();

console.log("Connecting to Supabase at:", process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Get voice notes with optional filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records to return
 * @param {string} options.userId - Filter by user ID
 * @returns {Promise<Array>} - Array of voice notes
 */
async function getVoiceNotes(options = {}) {
	try {
		const { limit = 10, userId } = options;

		let query = supabaseAdmin.from("voice_notes").select(`
        *,
        users:user_id (id, username, display_name, avatar_url, is_verified),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count)
      `);

		if (userId) {
			query = query.eq("user_id", userId);
		}

		const { data, error } = await query
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			throw error;
		}

		if (!data || data.length === 0) {
			return [];
		}

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

		// Add actual share counts to the data
		const processedData = data.map((note) => ({
			...note,
			shares: shareCountMap[note.id] || 0,
		}));

		return processedData || [];
	} catch (error) {
		console.error("Unexpected error:", error);
		throw error;
	}
}

/**
 * Get voice notes by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of voice notes for the user
 */
async function getVoiceNotesByUser(userId, options = {}) {
	try {
		const { limit = 10 } = options;

		const { data: users, error: usersError } = await supabaseAdmin
			.from("users")
			.select("id, username, display_name, avatar_url, is_verified")
			.eq("id", userId)
			.single();

		if (usersError) {
			throw usersError;
		}

		if (!users) {
			return [];
		}

		const voiceNotes = await getVoiceNotes({ userId, limit });

		return voiceNotes;
	} catch (error) {
		console.error("Error fetching voice notes by user:", error);
		throw error;
	}
}

/**
 * Get voice note by ID
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object|null>} - Voice note object or null if not found
 */
async function getVoiceNoteById(voiceNoteId) {
	try {
		const { data: voiceNotes, error } = await supabaseAdmin
			.from("voice_notes")
			.select(
				`
        *,
        users:user_id (id, username, display_name, avatar_url, is_verified),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count)
      `
			)
			.eq("id", voiceNoteId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// No rows returned
				return null;
			}
			throw error;
		}

		// Get actual share count
		try {
			const { count: shareCount } = await supabaseAdmin
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", voiceNoteId);

			return {
				...voiceNotes,
				shares: shareCount || 0,
			};
		} catch (shareError) {
			console.warn(`Failed to get share count for ${voiceNoteId}:`, shareError);
			return {
				...voiceNotes,
				shares: 0,
			};
		}
	} catch (error) {
		console.error("Error fetching voice note by ID:", error);
		throw error;
	}
}

async function createSampleVoiceNotes() {
	try {
		// Get users first
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("id");
		if (usersError) {
			console.error("Error fetching users:", usersError);
			return;
		}

		if (users.length === 0) {
			console.log("No users found. Please create users first.");
			return;
		}

		const sampleVoiceNotes = [
			{
				title: "Morning Thoughts",
				description: "My thoughts on starting the day",
				url: "https://example.com/audio/morning.mp3",
				duration: 45,
				user_id: users[0].id,
				is_public: true,
			},
			{
				title: "Tech Update",
				description: "Latest tech news discussion",
				url: "https://example.com/audio/tech.mp3",
				duration: 120,
				user_id: users[1] ? users[1].id : users[0].id,
				is_public: true,
			},
		];

		const { data: voiceNotes, error } = await supabase
			.from("voice_notes")
			.insert(sampleVoiceNotes)
			.select();

		if (error) {
			console.error("Error creating voice notes:", error);
			return;
		}

		console.log("Created sample voice notes:");
		console.log(JSON.stringify(voiceNotes, null, 2));
	} catch (error) {
		console.error("Error creating sample voice notes:", error);
	}
}

// Export the function for use in tests and other modules
module.exports = {
	getVoiceNotes,
	getVoiceNotesByUser,
	getVoiceNoteById,
	createSampleVoiceNotes,
};

// Only run the script if this file is executed directly
if (require.main === module) {
	async function runScript() {
		try {
			const voiceNotes = await getVoiceNotes();
			console.log("Voice notes in database:");
			console.log(JSON.stringify(voiceNotes, null, 2));

			if (voiceNotes.length === 0) {
				console.log("No voice notes found. Creating sample voice notes...");
				await createSampleVoiceNotes();
			}
		} catch (error) {
			console.error("Unexpected error:", error);
		}
	}

	runScript();
}
