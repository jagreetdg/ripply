/**
 * Test Database Helper Utilities
 * Provides common database operations for testing
 */

const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

// Initialize test Supabase client
const supabaseUrl =
	process.env.SUPABASE_URL || "https://kxuczrnakuybcgpnxclb.supabase.co";
const supabaseKey =
	process.env.SUPABASE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWN6cm5ha3V5YmNncG54Y2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMTc3ODIsImV4cCI6MjA0NjU5Mzc4Mn0.D7tKw-Ae8-vOC_PLFF9GVyQ0nP7b4jV--XEmbN5mP_A";

const testSupabase = createClient(supabaseUrl, supabaseKey, {
	auth: { persistSession: false },
});

class TestDatabase {
	constructor() {
		this.createdUsers = [];
		this.createdVoiceNotes = [];
		this.createdEntities = {
			users: [],
			voice_notes: [],
			voice_bios: [],
			follows: [],
			voice_note_likes: [],
			voice_note_comments: [],
			voice_note_plays: [],
			voice_note_shares: [],
		};
	}

	// Create a test user
	async createTestUser(userData = {}) {
		const defaultUser = {
			id: uuidv4(),
			username: `testuser_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`,
			email: `test_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}@example.com`,
			display_name: "Test User",
			bio: "Test bio",
			is_verified: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...userData,
		};

		const { data, error } = await testSupabase
			.from("users")
			.insert([defaultUser])
			.select()
			.single();

		if (error) throw error;

		this.createdEntities.users.push(data.id);
		return data;
	}

	// Create a test voice note
	async createTestVoiceNote(userId, voiceNoteData = {}) {
		const defaultVoiceNote = {
			id: uuidv4(),
			user_id: userId,
			title: `Test Voice Note ${Date.now()}`,
			duration: 120,
			audio_url: `https://example.com/audio/test_${Date.now()}.mp3`,
			background_image: `https://example.com/images/test_${Date.now()}.jpg`,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...voiceNoteData,
		};

		const { data, error } = await testSupabase
			.from("voice_notes")
			.insert([defaultVoiceNote])
			.select()
			.single();

		if (error) throw error;

		this.createdEntities.voice_notes.push(data.id);
		return data;
	}

	// Create a test voice bio
	async createTestVoiceBio(userId, voiceBioData = {}) {
		const defaultVoiceBio = {
			id: uuidv4(),
			user_id: userId,
			audio_url: `https://example.com/audio/bio_${Date.now()}.mp3`,
			duration: 30,
			transcript: "Test voice bio transcript",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			...voiceBioData,
		};

		const { data, error } = await testSupabase
			.from("voice_bios")
			.insert([defaultVoiceBio])
			.select()
			.single();

		if (error) throw error;

		this.createdEntities.voice_bios.push(data.id);
		return data;
	}

	// Create a follow relationship
	async createTestFollow(followerId, followingId) {
		const followData = {
			id: uuidv4(),
			follower_id: followerId,
			following_id: followingId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await testSupabase
			.from("follows")
			.insert([followData])
			.select()
			.single();

		if (error) throw error;

		this.createdEntities.follows.push(data.id);
		return data;
	}

	// Create a voice note like
	async createTestLike(voiceNoteId, userId) {
		const likeData = {
			id: uuidv4(),
			voice_note_id: voiceNoteId,
			user_id: userId,
			created_at: new Date().toISOString(),
		};

		const { data, error } = await testSupabase
			.from("voice_note_likes")
			.insert([likeData])
			.select()
			.single();

		if (error) throw error;

		this.createdEntities.voice_note_likes.push(data.id);
		return data;
	}

	// Create a voice note comment
	async createTestComment(voiceNoteId, userId, content = "Test comment") {
		const commentData = {
			id: uuidv4(),
			voice_note_id: voiceNoteId,
			user_id: userId,
			content,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await testSupabase
			.from("voice_note_comments")
			.insert([commentData])
			.select()
			.single();

		if (error) throw error;

		this.createdEntities.voice_note_comments.push(data.id);
		return data;
	}

	// Create a voice note share
	async createTestShare(voiceNoteId, userId) {
		const shareData = {
			id: uuidv4(),
			voice_note_id: voiceNoteId,
			user_id: userId,
			shared_at: new Date().toISOString(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		try {
			const { data, error } = await testSupabase
				.from("voice_note_shares")
				.insert([shareData])
				.select()
				.single();

			if (error) throw error;

			this.createdEntities.voice_note_shares.push(data.id);
			return data;
		} catch (error) {
			if (error.code === "42P01") {
				// Table doesn't exist, skip
				return null;
			}
			throw error;
		}
	}

	// Clean up all created test data
	async cleanup() {
		try {
			// Delete in reverse order to handle foreign key constraints
			for (const table of [
				"voice_note_shares",
				"voice_note_plays",
				"voice_note_comments",
				"voice_note_likes",
				"voice_bios",
				"follows",
				"voice_notes",
				"users",
			]) {
				if (
					this.createdEntities[table] &&
					this.createdEntities[table].length > 0
				) {
					await testSupabase
						.from(table)
						.delete()
						.in("id", this.createdEntities[table]);
				}
			}
		} catch (error) {
			console.warn("Cleanup error (may be expected):", error.message);
		}

		// Reset tracking arrays
		for (const key in this.createdEntities) {
			this.createdEntities[key] = [];
		}
	}
}

module.exports = {
	TestDatabase,
	testSupabase,
};
