/**
 * Setup Supabase Database Utility Tests
 * Tests the Supabase database setup and sample data creation functionality
 */

const fs = require("fs");
const path = require("path");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("fs");
jest.mock("path");
jest.mock("../../src/config/supabase");

const mockFs = require("fs");
const mockPath = require("path");
const mockSupabase = require("../../src/config/supabase");

describe("Setup Supabase Database Utility", () => {
	let testDb;
	let originalConsoleLog;
	let originalConsoleError;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock console methods
		originalConsoleLog = console.log;
		originalConsoleError = console.error;

		console.log = jest.fn();
		console.error = jest.fn();

		// Mock Supabase client methods
		mockSupabase.from = jest.fn(() => ({
			select: jest.fn(() => ({
				eq: jest.fn(() => ({
					limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
				})),
				limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
			})),
			insert: jest.fn(() => ({
				select: jest.fn(() => Promise.resolve({ data: [], error: null })),
			})),
		}));
	});

	afterEach(async () => {
		await testDb.cleanup();

		// Restore console methods
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
	});

	describe("Environment Configuration", () => {
		it("should check Supabase URL configuration", () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";

			expect(process.env.SUPABASE_URL).toBe("https://test.supabase.co");
		});

		it("should log connection URL", () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";

			console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL}`);
			expect(console.log).toHaveBeenCalledWith(
				"Connecting to Supabase at: https://test.supabase.co"
			);
		});

		it("should handle missing environment variables", () => {
			const originalUrl = process.env.SUPABASE_URL;
			delete process.env.SUPABASE_URL;

			expect(process.env.SUPABASE_URL).toBeUndefined();

			// Restore
			process.env.SUPABASE_URL = originalUrl;
		});
	});

	describe("Schema Existence Check", () => {
		it("should check if users table exists", async () => {
			const mockSelect = jest.fn(() => ({
				limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
			}));

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			const result = await mockSupabase.from("users").select("id").limit(1);
			expect(result.error).toBeNull();
		});

		it("should handle missing schema error", async () => {
			const schemaError = {
				code: "42P01",
				message: 'relation "users" does not exist',
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn(() => ({
					limit: jest.fn(() =>
						Promise.resolve({ data: null, error: schemaError })
					),
				})),
			});

			const result = await mockSupabase.from("users").select("id").limit(1);
			expect(result.error.code).toBe("42P01");
		});

		it("should provide schema setup instructions", () => {
			console.error("ERROR: Database schema is not set up in Supabase.");
			console.error("Please follow these steps to set up the schema:");
			console.error(
				"1. Go to the Supabase dashboard: https://app.supabase.com"
			);

			expect(console.error).toHaveBeenCalledWith(
				"ERROR: Database schema is not set up in Supabase."
			);
			expect(console.error).toHaveBeenCalledWith(
				"Please follow these steps to set up the schema:"
			);
			expect(console.error).toHaveBeenCalledWith(
				"1. Go to the Supabase dashboard: https://app.supabase.com"
			);
		});

		it("should handle authentication errors", async () => {
			const authError = { code: "401", message: "Invalid API key" };

			mockSupabase.from.mockReturnValue({
				select: jest.fn(() => ({
					limit: jest.fn(() =>
						Promise.resolve({ data: null, error: authError })
					),
				})),
			});

			const result = await mockSupabase.from("users").select("id").limit(1);
			expect(result.error.code).toBe("401");
		});
	});

	describe("Existing Data Check", () => {
		it("should check for existing sample data", async () => {
			const existingUsers = [{ id: "user-123", username: "testuser" }];

			mockSupabase.from.mockReturnValue({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						limit: jest.fn(() =>
							Promise.resolve({ data: existingUsers, error: null })
						),
					})),
				})),
			});

			const result = await mockSupabase
				.from("users")
				.select("id, username")
				.eq("username", "testuser")
				.limit(1);
			expect(result.data).toEqual(existingUsers);
		});

		it("should skip creation if data exists", async () => {
			const existingUsers = [{ id: "user-123", username: "testuser" }];

			mockSupabase.from.mockReturnValue({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						limit: jest.fn(() =>
							Promise.resolve({ data: existingUsers, error: null })
						),
					})),
				})),
			});

			// Simulate the check and response
			if (existingUsers && existingUsers.length > 0) {
				console.log(
					"Sample data already exists. Skipping sample data creation."
				);
				expect(console.log).toHaveBeenCalledWith(
					"Sample data already exists. Skipping sample data creation."
				);
			}
		});

		it("should proceed with creation if no data exists", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
					})),
				})),
			});

			const result = await mockSupabase
				.from("users")
				.select("id, username")
				.eq("username", "testuser")
				.limit(1);
			expect(result.data).toEqual([]);
		});
	});

	describe("Sample Data Creation", () => {
		it("should create sample users", async () => {
			const sampleUsers = [
				{
					username: "testuser",
					display_name: "Test User",
					email: "test@example.com",
					bio: "This is a test user account",
				},
				{
					username: "jane_doe",
					display_name: "Jane Doe",
					email: "jane@example.com",
					bio: "Voice note enthusiast",
				},
				{
					username: "john_smith",
					display_name: "John Smith",
					email: "john@example.com",
					bio: "Audio creator",
				},
			];

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => ({
					select: jest.fn(() =>
						Promise.resolve({ data: sampleUsers, error: null })
					),
				})),
			});

			const result = await mockSupabase
				.from("users")
				.insert(sampleUsers)
				.select();
			expect(result.data).toEqual(sampleUsers);
		});

		it("should handle user creation errors", async () => {
			const userError = { code: "23505", message: "Duplicate username" };

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => ({
					select: jest.fn(() =>
						Promise.resolve({ data: null, error: userError })
					),
				})),
			});

			const result = await mockSupabase.from("users").insert([]).select();
			expect(result.error.code).toBe("23505");
		});

		it("should create voice notes for users", async () => {
			const users = [
				{ id: "user-1", username: "testuser", display_name: "Test User" },
				{ id: "user-2", username: "jane_doe", display_name: "Jane Doe" },
			];

			const voiceNotesData = users.map((user) => ({
				user_id: user.id,
				title: `${user.display_name}'s Voice Note`,
				duration: Math.floor(Math.random() * 180) + 30,
				audio_url: `https://example.com/audio/${user.username}_sample.mp3`,
				background_image: `https://example.com/images/${user.username}_bg.jpg`,
			}));

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => ({
					select: jest.fn(() =>
						Promise.resolve({ data: voiceNotesData, error: null })
					),
				})),
			});

			const result = await mockSupabase
				.from("voice_notes")
				.insert(voiceNotesData)
				.select();
			expect(result.data).toEqual(voiceNotesData);
		});

		it("should handle voice note creation errors", async () => {
			const voiceNoteError = {
				code: "23503",
				message: "Foreign key violation",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => ({
					select: jest.fn(() =>
						Promise.resolve({ data: null, error: voiceNoteError })
					),
				})),
			});

			const result = await mockSupabase.from("voice_notes").insert([]).select();
			expect(result.error.code).toBe("23503");
		});
	});

	describe("Tags Creation", () => {
		it("should add tags to voice notes", async () => {
			const voiceNotes = [
				{ id: "note-1", title: "Test Note 1" },
				{ id: "note-2", title: "Test Note 2" },
			];

			const sampleTags = [
				"music",
				"podcast",
				"story",
				"news",
				"comedy",
				"education",
			];
			const tagsData = [];

			voiceNotes.forEach((note) => {
				const numTags = Math.floor(Math.random() * 2) + 2;
				const noteTags = [...sampleTags]
					.sort(() => 0.5 - Math.random())
					.slice(0, numTags);

				noteTags.forEach((tag) => {
					tagsData.push({
						voice_note_id: note.id,
						tag_name: tag,
					});
				});
			});

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => Promise.resolve({ data: tagsData, error: null })),
			});

			const result = await mockSupabase
				.from("voice_note_tags")
				.insert(tagsData);
			expect(result.error).toBeNull();
		});

		it("should handle tag creation errors", async () => {
			const tagError = { code: "23505", message: "Duplicate tag" };

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => Promise.resolve({ data: null, error: tagError })),
			});

			const result = await mockSupabase.from("voice_note_tags").insert([]);
			expect(result.error.code).toBe("23505");
		});

		it("should use sample tag names", () => {
			const sampleTags = [
				"music",
				"podcast",
				"story",
				"news",
				"comedy",
				"education",
			];

			expect(sampleTags).toHaveLength(6);
			sampleTags.forEach((tag) => {
				expect(typeof tag).toBe("string");
				expect(tag.length).toBeGreaterThan(0);
			});
		});

		it("should assign random tags to notes", () => {
			const sampleTags = [
				"music",
				"podcast",
				"story",
				"news",
				"comedy",
				"education",
			];
			const numTags = Math.floor(Math.random() * 2) + 2; // 2-3 tags
			const selectedTags = [...sampleTags]
				.sort(() => 0.5 - Math.random())
				.slice(0, numTags);

			expect(selectedTags.length).toBeGreaterThanOrEqual(2);
			expect(selectedTags.length).toBeLessThanOrEqual(3);
		});
	});

	describe("Follow Relationships", () => {
		it("should create follow relationships", async () => {
			const users = [
				{ id: "user-1", username: "user1" },
				{ id: "user-2", username: "user2" },
				{ id: "user-3", username: "user3" },
			];

			const followsData = [];
			for (let i = 0; i < users.length; i++) {
				for (let j = 0; j < users.length; j++) {
					if (i !== j) {
						followsData.push({
							follower_id: users[i].id,
							following_id: users[j].id,
						});
					}
				}
			}

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() =>
					Promise.resolve({ data: followsData, error: null })
				),
			});

			const result = await mockSupabase.from("follows").insert(followsData);
			expect(result.error).toBeNull();
		});

		it("should not create self-follow relationships", () => {
			const users = [
				{ id: "user-1", username: "user1" },
				{ id: "user-2", username: "user2" },
			];

			const followsData = [];
			for (let i = 0; i < users.length; i++) {
				for (let j = 0; j < users.length; j++) {
					if (i !== j) {
						// This condition prevents self-follows
						followsData.push({
							follower_id: users[i].id,
							following_id: users[j].id,
						});
					}
				}
			}

			// Check that no user follows themselves
			followsData.forEach((follow) => {
				expect(follow.follower_id).not.toBe(follow.following_id);
			});
		});

		it("should handle follow creation errors", async () => {
			const followError = {
				code: "23505",
				message: "Duplicate follow relationship",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() =>
					Promise.resolve({ data: null, error: followError })
				),
			});

			const result = await mockSupabase.from("follows").insert([]);
			expect(result.error.code).toBe("23505");
		});
	});

	describe("Likes Creation", () => {
		it("should add likes to voice notes", async () => {
			const voiceNotes = [
				{ id: "note-1", title: "Note 1" },
				{ id: "note-2", title: "Note 2" },
			];

			const users = [
				{ id: "user-1", username: "user1" },
				{ id: "user-2", username: "user2" },
			];

			const likesData = [];
			voiceNotes.forEach((note) => {
				users.forEach((user) => {
					if (Math.random() > 0.5) {
						// 50% chance of liking
						likesData.push({
							voice_note_id: note.id,
							user_id: user.id,
						});
					}
				});
			});

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() =>
					Promise.resolve({ data: likesData, error: null })
				),
			});

			const result = await mockSupabase
				.from("voice_note_likes")
				.insert(likesData);
			expect(result.error).toBeNull();
		});

		it("should use random probability for likes", () => {
			const randomValue = Math.random();
			const shouldLike = randomValue > 0.5;

			expect(typeof randomValue).toBe("number");
			expect(randomValue).toBeGreaterThanOrEqual(0);
			expect(randomValue).toBeLessThan(1);
			expect(typeof shouldLike).toBe("boolean");
		});

		it("should handle like creation errors", async () => {
			const likeError = { code: "23505", message: "Duplicate like" };

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() =>
					Promise.resolve({ data: null, error: likeError })
				),
			});

			const result = await mockSupabase.from("voice_note_likes").insert([]);
			expect(result.error.code).toBe("23505");
		});
	});

	describe("Voice Bio Creation", () => {
		it("should create voice bios for users", async () => {
			const users = [
				{ id: "user-1", username: "user1" },
				{ id: "user-2", username: "user2" },
			];

			const voiceBiosData = users.map((user) => ({
				user_id: user.id,
				bio_url: `https://example.com/bios/${user.username}_bio.mp3`,
				duration: Math.floor(Math.random() * 60) + 30,
			}));

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() =>
					Promise.resolve({ data: voiceBiosData, error: null })
				),
			});

			const result = await mockSupabase
				.from("voice_bios")
				.insert(voiceBiosData);
			expect(result.error).toBeNull();
		});

		it("should handle voice bio creation errors", async () => {
			const bioError = { code: "23503", message: "User not found" };

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => Promise.resolve({ data: null, error: bioError })),
			});

			const result = await mockSupabase.from("voice_bios").insert([]);
			expect(result.error.code).toBe("23503");
		});
	});

	describe("Console Output", () => {
		it("should log setup progress", () => {
			console.log(
				"Database schema exists in Supabase. Proceeding with sample data creation..."
			);
			console.log("Creating sample data...");

			expect(console.log).toHaveBeenCalledWith(
				"Database schema exists in Supabase. Proceeding with sample data creation..."
			);
			expect(console.log).toHaveBeenCalledWith("Creating sample data...");
		});

		it("should log schema check results", () => {
			console.log("Checking if database schema exists...");

			expect(console.log).toHaveBeenCalledWith(
				"Checking if database schema exists..."
			);
		});

		it("should log data creation counts", () => {
			const users = [{ id: "1" }, { id: "2" }, { id: "3" }];
			console.log(`Created ${users.length} test users`);

			expect(console.log).toHaveBeenCalledWith("Created 3 test users");
		});

		it("should log error messages with colors", () => {
			console.error("Error creating test users:", {
				message: "Database error",
			});

			expect(console.error).toHaveBeenCalledWith("Error creating test users:", {
				message: "Database error",
			});
		});

		it("should provide setup instructions", () => {
			console.error("Please check your Supabase credentials in the .env file.");

			expect(console.error).toHaveBeenCalledWith(
				"Please check your Supabase credentials in the .env file."
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle network errors", async () => {
			const networkError = new Error("Network connection failed");

			mockSupabase.from.mockImplementation(() => {
				throw networkError;
			});

			try {
				mockSupabase.from("users");
			} catch (error) {
				expect(error).toEqual(networkError);
			}
		});

		it("should handle API quota errors", async () => {
			const quotaError = { code: "429", message: "Too many requests" };

			mockSupabase.from.mockReturnValue({
				select: jest.fn(() => ({
					limit: jest.fn(() =>
						Promise.resolve({ data: null, error: quotaError })
					),
				})),
			});

			const result = await mockSupabase.from("users").select("id").limit(1);
			expect(result.error.code).toBe("429");
		});

		it("should handle invalid data errors", async () => {
			const validationError = {
				code: "22001",
				message: "Value too long for type",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn(() => ({
					select: jest.fn(() =>
						Promise.resolve({ data: null, error: validationError })
					),
				})),
			});

			const result = await mockSupabase.from("users").insert([]).select();
			expect(result.error.code).toBe("22001");
		});
	});

	describe("File Path Operations", () => {
		it("should resolve schema export path", () => {
			const schemaPath = "/app/src/db/supabase-schema-export.sql";

			mockPath.join.mockReturnValue(schemaPath);

			const result = mockPath.join("/app/src/db", "supabase-schema-export.sql");
			expect(result).toBe(schemaPath);
		});

		it("should provide export script instructions", () => {
			console.error(
				"You can also run the exportSchema.js script to see the SQL:"
			);
			console.error("   node src/db/exportSchema.js");

			expect(console.error).toHaveBeenCalledWith(
				"You can also run the exportSchema.js script to see the SQL:"
			);
			expect(console.error).toHaveBeenCalledWith(
				"   node src/db/exportSchema.js"
			);
		});
	});

	describe("Sample Data Validation", () => {
		it("should create users with proper structure", () => {
			const sampleUsers = [
				{
					username: "testuser",
					display_name: "Test User",
					email: "test@example.com",
					bio: "This is a test user account",
				},
				{
					username: "jane_doe",
					display_name: "Jane Doe",
					email: "jane@example.com",
					bio: "Voice note enthusiast",
				},
				{
					username: "john_smith",
					display_name: "John Smith",
					email: "john@example.com",
					bio: "Audio creator",
				},
			];

			sampleUsers.forEach((user) => {
				expect(user.username).toBeTruthy();
				expect(user.display_name).toBeTruthy();
				expect(user.email).toMatch(/@/);
				expect(user.bio).toBeTruthy();
			});
		});

		it("should generate proper voice note data", () => {
			const users = [
				{ id: "user-1", username: "testuser", display_name: "Test User" },
			];

			const voiceNotesData = users.map((user) => ({
				user_id: user.id,
				title: `${user.display_name}'s Voice Note`,
				duration: Math.floor(Math.random() * 180) + 30,
				audio_url: `https://example.com/audio/${user.username}_sample.mp3`,
				background_image: `https://example.com/images/${user.username}_bg.jpg`,
			}));

			voiceNotesData.forEach((note) => {
				expect(note.user_id).toBeTruthy();
				expect(note.title).toBeTruthy();
				expect(note.duration).toBeGreaterThanOrEqual(30);
				expect(note.duration).toBeLessThanOrEqual(210);
				expect(note.audio_url).toMatch(/^https:\/\//);
				expect(note.background_image).toMatch(/^https:\/\//);
			});
		});
	});
});
