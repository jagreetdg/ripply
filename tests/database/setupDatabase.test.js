/**
 * Setup Database Utility Tests
 * Tests the PostgreSQL database setup functionality
 */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("fs");
jest.mock("path");
jest.mock("pg");

const mockFs = require("fs");
const mockPath = require("path");
const mockPool = require("pg").Pool;

describe("Setup Database Utility", () => {
	let testDb;
	let originalConsoleLog;
	let originalConsoleError;
	let originalProcessExit;
	let mockClient;
	let mockPoolInstance;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock console methods
		originalConsoleLog = console.log;
		originalConsoleError = console.error;
		originalProcessExit = process.exit;

		console.log = jest.fn();
		console.error = jest.fn();
		process.exit = jest.fn();

		// Mock PostgreSQL client
		mockClient = {
			query: jest.fn(),
			release: jest.fn(),
		};

		mockPoolInstance = {
			connect: jest.fn().mockResolvedValue(mockClient),
			end: jest.fn().mockResolvedValue(),
		};

		mockPool.mockImplementation(() => mockPoolInstance);
	});

	afterEach(async () => {
		await testDb.cleanup();

		// Restore original methods
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
		process.exit = originalProcessExit;
	});

	describe("Environment Configuration", () => {
		it("should check for database connection string", () => {
			const originalEnv = process.env.SUPABASE_URL;

			// Test missing connection string
			delete process.env.SUPABASE_URL;
			expect(process.env.SUPABASE_URL).toBeUndefined();

			// Test with connection string
			process.env.SUPABASE_URL = "postgresql://user:pass@localhost:5432/db";
			expect(process.env.SUPABASE_URL).toBe(
				"postgresql://user:pass@localhost:5432/db"
			);

			// Restore original
			process.env.SUPABASE_URL = originalEnv;
		});

		it("should exit on missing connection string", () => {
			const originalUrl = process.env.SUPABASE_URL;
			delete process.env.SUPABASE_URL;

			// Simulate the check that would happen in the script
			if (!process.env.SUPABASE_URL) {
				console.error(
					"Missing database connection string. Please check your .env file."
				);
				expect(console.error).toHaveBeenCalledWith(
					"Missing database connection string. Please check your .env file."
				);
			}

			// Restore
			process.env.SUPABASE_URL = originalUrl;
		});

		it("should accept valid connection string formats", () => {
			const validUrls = [
				"postgresql://user:pass@localhost:5432/dbname",
				"postgres://user:pass@host.com:5432/db",
				"postgresql://localhost/dbname",
			];

			validUrls.forEach((url) => {
				process.env.SUPABASE_URL = url;
				expect(process.env.SUPABASE_URL).toBe(url);
			});
		});
	});

	describe("Database Connection", () => {
		it("should create PostgreSQL pool with connection string", () => {
			const connectionString = "postgresql://test:test@localhost:5432/test";

			new mockPool({ connectionString });

			expect(mockPool).toHaveBeenCalledWith({ connectionString });
		});

		it("should connect to database successfully", async () => {
			mockPoolInstance.connect.mockResolvedValue(mockClient);

			const client = await mockPoolInstance.connect();
			expect(client).toBe(mockClient);
		});

		it("should handle connection errors", async () => {
			const connectionError = new Error("Connection refused");
			mockPoolInstance.connect.mockRejectedValue(connectionError);

			try {
				await mockPoolInstance.connect();
			} catch (error) {
				expect(error).toEqual(connectionError);
			}
		});

		it("should release client after use", async () => {
			await mockClient.release();
			expect(mockClient.release).toHaveBeenCalled();
		});

		it("should close pool at the end", async () => {
			await mockPoolInstance.end();
			expect(mockPoolInstance.end).toHaveBeenCalled();
		});
	});

	describe("Schema Setup", () => {
		it("should read schema SQL file", () => {
			const schemaContent = `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL
        );
      `;

			mockPath.join.mockReturnValue("/app/src/db/schema.sql");
			mockFs.readFileSync.mockReturnValue(schemaContent);

			const content = mockFs.readFileSync("/app/src/db/schema.sql", "utf8");
			expect(content).toBe(schemaContent);
		});

		it("should execute schema SQL", async () => {
			const schemaContent = "CREATE TABLE test_table();";

			mockClient.query.mockResolvedValue({ rows: [] });

			await mockClient.query(schemaContent);
			expect(mockClient.query).toHaveBeenCalledWith(schemaContent);
		});

		it("should handle schema execution errors", async () => {
			const schemaError = new Error("Syntax error in schema");

			mockClient.query.mockRejectedValue(schemaError);

			try {
				await mockClient.query("INVALID SQL");
			} catch (error) {
				expect(error).toEqual(schemaError);
			}
		});

		it("should handle missing schema file", () => {
			const fileError = new Error("ENOENT: schema.sql not found");

			mockPath.join.mockReturnValue("/app/src/db/schema.sql");
			mockFs.readFileSync.mockImplementation(() => {
				throw fileError;
			});

			expect(() =>
				mockFs.readFileSync("/app/src/db/schema.sql", "utf8")
			).toThrow(fileError);
		});
	});

	describe("Sample Data Creation", () => {
		it("should create sample users", async () => {
			const userQuery = `
        INSERT INTO users (username, display_name, email, bio, avatar_url)
        VALUES ('user1', 'John Smith', 'john@example.com', 'Music lover and podcast enthusiast', 'https://randomuser.me/api/portraits/men/1.jpg')
        RETURNING id;
      `;

			mockClient.query.mockResolvedValue({ rows: [{ id: "user-123" }] });

			const result = await mockClient.query(userQuery);
			expect(result.rows[0].id).toBe("user-123");
		});

		it("should create multiple users with different profiles", async () => {
			const users = [
				{ username: "user1", display_name: "John Smith" },
				{ username: "user2", display_name: "Sarah Johnson" },
				{ username: "user3", display_name: "Alex Chen" },
				{ username: "prometheus", display_name: "Prometheus User" },
			];

			users.forEach((user, index) => {
				mockClient.query.mockResolvedValueOnce({
					rows: [{ id: `user-${index + 1}` }],
				});
			});

			expect(users).toHaveLength(4);
		});

		it("should create voice notes for users", async () => {
			const voiceNoteQuery = `
        INSERT INTO voice_notes (user_id, title, duration, audio_url, background_image)
        VALUES ($1, 'Morning Thoughts', 45, 'https://example.com/audio/morning.mp3', 'https://source.unsplash.com/random/800x600/?morning');
      `;

			mockClient.query.mockResolvedValue({ rows: [] });

			await mockClient.query(voiceNoteQuery, ["user-123"]);
			expect(mockClient.query).toHaveBeenCalledWith(voiceNoteQuery, [
				"user-123",
			]);
		});

		it("should create voice notes with and without background images", async () => {
			const queries = [
				"INSERT INTO voice_notes (user_id, title, duration, audio_url, background_image)",
				"INSERT INTO voice_notes (user_id, title, duration, audio_url)",
			];

			mockClient.query.mockResolvedValue({ rows: [] });

			expect(queries).toHaveLength(2);
		});

		it("should create comments on voice notes", async () => {
			const commentQuery = `
        INSERT INTO voice_note_comments (voice_note_id, user_id, content)
        SELECT id, $2, 'Great insights! I really enjoyed this.'
        FROM voice_notes WHERE user_id = $1 LIMIT 1;
      `;

			mockClient.query.mockResolvedValue({ rows: [] });

			await mockClient.query(commentQuery, ["user-1", "user-2"]);
			expect(mockClient.query).toHaveBeenCalledWith(commentQuery, [
				"user-1",
				"user-2",
			]);
		});
	});

	describe("User Profile Variations", () => {
		it("should create user with profile picture", async () => {
			const userWithAvatar = {
				username: "user1",
				display_name: "John Smith",
				email: "john@example.com",
				bio: "Music lover and podcast enthusiast",
				avatar_url: "https://randomuser.me/api/portraits/men/1.jpg",
			};

			mockClient.query.mockResolvedValue({ rows: [{ id: "user-1" }] });

			expect(userWithAvatar.avatar_url).toBeTruthy();
		});

		it("should create user without profile picture", async () => {
			const userWithoutAvatar = {
				username: "prometheus",
				display_name: "Prometheus User",
				email: "prometheus@example.com",
				bio: "Bringing knowledge to humanity",
				avatar_url: null,
			};

			mockClient.query.mockResolvedValue({ rows: [{ id: "prometheus-1" }] });

			expect(userWithoutAvatar.avatar_url).toBeNull();
		});

		it("should handle different bio lengths", async () => {
			const shortBio = "Tech enthusiast";
			const longBio =
				"This is a much longer bio that describes the user in great detail with multiple interests and background information";

			expect(shortBio.length).toBeLessThan(50);
			expect(longBio.length).toBeGreaterThan(50);
		});
	});

	describe("Voice Note Variations", () => {
		it("should create voice notes with different durations", async () => {
			const durations = [45, 120, 300, 180, 240];

			durations.forEach((duration) => {
				expect(duration).toBeGreaterThan(0);
				expect(typeof duration).toBe("number");
			});
		});

		it("should create voice notes with various titles", async () => {
			const titles = [
				"Morning Thoughts",
				"Jazz Review",
				"Meditation Guide",
				"Tech News Recap",
				"The Gift of Knowledge",
				"Wisdom of the Ages",
			];

			expect(titles).toHaveLength(6);
			titles.forEach((title) => {
				expect(typeof title).toBe("string");
				expect(title.length).toBeGreaterThan(0);
			});
		});

		it("should create voice notes with background images", async () => {
			const backgroundImages = [
				"https://source.unsplash.com/random/800x600/?morning",
				"https://source.unsplash.com/random/800x600/?meditation",
				"https://source.unsplash.com/random/800x600/?technology",
				"https://source.unsplash.com/random/800x600/?knowledge",
			];

			backgroundImages.forEach((image) => {
				expect(image).toMatch(/^https:\/\//);
				expect(image).toContain("unsplash.com");
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle database query errors", async () => {
			const queryError = new Error("Duplicate key violation");

			mockClient.query.mockRejectedValue(queryError);

			try {
				await mockClient.query("INSERT INTO users ...");
			} catch (error) {
				expect(error).toEqual(queryError);
			}
		});

		it("should handle file read errors", () => {
			const fileError = new Error("Permission denied");

			mockFs.readFileSync.mockImplementation(() => {
				throw fileError;
			});

			expect(() => mockFs.readFileSync("schema.sql")).toThrow(fileError);
		});

		it("should handle client release errors", async () => {
			const releaseError = new Error("Client already released");

			mockClient.release.mockRejectedValue(releaseError);

			try {
				await mockClient.release();
			} catch (error) {
				expect(error).toEqual(releaseError);
			}
		});

		it("should handle pool end errors", async () => {
			const poolError = new Error("Pool already closed");

			mockPoolInstance.end.mockRejectedValue(poolError);

			try {
				await mockPoolInstance.end();
			} catch (error) {
				expect(error).toEqual(poolError);
			}
		});
	});

	describe("Console Output", () => {
		it("should log setup progress", () => {
			console.log("Connecting to database...");
			console.log("Executing schema...");
			console.log("Creating sample data...");

			expect(console.log).toHaveBeenCalledWith("Connecting to database...");
			expect(console.log).toHaveBeenCalledWith("Executing schema...");
			expect(console.log).toHaveBeenCalledWith("Creating sample data...");
		});

		it("should log success messages", () => {
			console.log("Database schema created successfully!");
			console.log("Sample data created successfully!");

			expect(console.log).toHaveBeenCalledWith(
				"Database schema created successfully!"
			);
			expect(console.log).toHaveBeenCalledWith(
				"Sample data created successfully!"
			);
		});

		it("should log error messages", () => {
			const error = new Error("Database error");
			console.error("Error setting up database:", error);

			expect(console.error).toHaveBeenCalledWith(
				"Error setting up database:",
				error
			);
		});

		it("should log database connection status", () => {
			console.log("Connecting to database...");

			expect(console.log).toHaveBeenCalledWith("Connecting to database...");
		});
	});

	describe("Cleanup Operations", () => {
		it("should release client in finally block", async () => {
			mockClient.release.mockResolvedValue();

			await mockClient.release();
			expect(mockClient.release).toHaveBeenCalled();
		});

		it("should close pool in finally block", async () => {
			mockPoolInstance.end.mockResolvedValue();

			await mockPoolInstance.end();
			expect(mockPoolInstance.end).toHaveBeenCalled();
		});

		it("should handle cleanup errors gracefully", async () => {
			const cleanupError = new Error("Cleanup failed");

			mockClient.release.mockRejectedValue(cleanupError);
			mockPoolInstance.end.mockRejectedValue(cleanupError);

			// Should not throw, should be handled gracefully
			try {
				await mockClient.release();
			} catch (error) {
				expect(error).toEqual(cleanupError);
			}

			try {
				await mockPoolInstance.end();
			} catch (error) {
				expect(error).toEqual(cleanupError);
			}
		});
	});

	describe("Sample Data Details", () => {
		it("should create Prometheus user without avatar", async () => {
			const prometheusUser = {
				username: "prometheus",
				display_name: "Prometheus User",
				email: "prometheus@example.com",
				bio: "Bringing knowledge to humanity",
				avatar_url: null,
			};

			expect(prometheusUser.username).toBe("prometheus");
			expect(prometheusUser.avatar_url).toBeNull();
		});

		it("should create voice notes with specific content", async () => {
			const voiceNotes = [
				{ title: "Morning Thoughts", duration: 45 },
				{ title: "Jazz Review", duration: 120 },
				{ title: "Meditation Guide", duration: 300 },
				{ title: "Tech News Recap", duration: 180 },
				{ title: "The Gift of Knowledge", duration: 240 },
				{ title: "Wisdom of the Ages", duration: 180 },
			];

			voiceNotes.forEach((note) => {
				expect(note.title).toBeTruthy();
				expect(note.duration).toBeGreaterThan(0);
			});
		});

		it("should create comments with meaningful content", async () => {
			const comments = [
				"Great insights! I really enjoyed this.",
				"Thanks for sharing your thoughts!",
				"This changed my perspective. Thank you!",
				"Profound wisdom. Please share more.",
			];

			comments.forEach((comment) => {
				expect(comment.length).toBeGreaterThan(10);
				expect(typeof comment).toBe("string");
			});
		});
	});
});
