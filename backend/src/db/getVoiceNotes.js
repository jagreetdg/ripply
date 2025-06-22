// Database utility to get voice notes from Supabase
const supabase = require("../config/supabase");
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

		let query = supabase.from("voice_notes").select(`
        *,
        users:user_id (id, username, display_name, avatar_url, is_verified),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        shares:voice_note_shares (count)
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

		return data || [];
	} catch (error) {
		console.error("Unexpected error:", error);
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
