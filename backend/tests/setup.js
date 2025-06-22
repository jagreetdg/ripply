/**
 * Jest setup file for Ripply Backend Tests
 * This file runs before all tests and sets up the testing environment
 */

// Load environment variables from main .env file
require("dotenv").config();

// Set test timeout to 30 seconds for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
	...console,
	log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

// Global test utilities
global.testUtils = {
	// Generate test user data
	generateTestUser: (override = {}) => ({
		username: `testuser_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`,
		email: `test_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}@example.com`,
		password: "TestPassword123!",
		display_name: "Test User",
		...override,
	}),

	// Generate test voice note data
	generateTestVoiceNote: (userId, override = {}) => ({
		user_id: userId,
		title: `Test Voice Note ${Date.now()}`,
		duration: 120,
		audio_url: `https://example.com/audio/test_${Date.now()}.mp3`,
		background_image: `https://example.com/images/test_${Date.now()}.jpg`,
		...override,
	}),

	// Generate test auth token
	generateTestToken: (user) => {
		const jwt = require("jsonwebtoken");
		const JWT_SECRET = process.env.JWT_SECRET;
		if (!JWT_SECRET) {
			throw new Error(
				"JWT_SECRET environment variable is required for test token generation"
			);
		}
		return jwt.sign(
			{ id: user.id, email: user.email, username: user.username },
			JWT_SECRET,
			{ expiresIn: "1h" }
		);
	},

	// Clean up test data
	cleanupTestData: async (supabase) => {
		// Delete test users and related data
		const { data: testUsers } = await supabase
			.from("users")
			.select("id")
			.like("username", "testuser_%");

		if (testUsers && testUsers.length > 0) {
			const userIds = testUsers.map((user) => user.id);

			// Delete related data first (due to foreign key constraints)
			await supabase.from("voice_note_likes").delete().in("user_id", userIds);
			await supabase
				.from("voice_note_comments")
				.delete()
				.in("user_id", userIds);
			await supabase.from("voice_note_plays").delete().in("user_id", userIds);
			await supabase.from("voice_note_shares").delete().in("user_id", userIds);
			await supabase.from("voice_notes").delete().in("user_id", userIds);
			await supabase.from("follows").delete().in("follower_id", userIds);
			await supabase.from("follows").delete().in("following_id", userIds);
			await supabase.from("voice_bios").delete().in("user_id", userIds);
			await supabase.from("users").delete().in("id", userIds);
		}
	},
};

// Global beforeEach and afterEach for all tests
beforeEach(async () => {
	// Reset console mocks
	jest.clearAllMocks();
});

afterEach(async () => {
	// Cleanup can be added here if needed
});
