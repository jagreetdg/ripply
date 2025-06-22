/**
 * Voice Notes Routes Tests
 * Tests all voice note functionality including CRUD, feed, search, likes, comments, shares
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { TestDatabase } = require("../helpers/testDatabase");

// Ensure JWT_SECRET is available for tests
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required for tests");
}

// Mock the dependencies - MUST be before any requires that use them
jest.mock("../../src/config/supabase", () => {
	// Create a comprehensive mock that provides all the necessary method chains
	const createMockQuery = (data = null, error = null, count = 0) => {
		const mockQuery = {
			select: jest.fn(),
			insert: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			eq: jest.fn(),
			in: jest.fn(),
			ilike: jest.fn(),
			order: jest.fn(),
			range: jest.fn(),
			limit: jest.fn(),
			single: jest.fn(),
		};

		// Each method returns the same mock object to allow chaining
		mockQuery.select.mockReturnValue(mockQuery);
		mockQuery.insert.mockReturnValue(mockQuery);
		mockQuery.update.mockReturnValue(mockQuery);
		mockQuery.delete.mockReturnValue(mockQuery);
		mockQuery.eq.mockReturnValue(mockQuery);
		mockQuery.in.mockReturnValue(mockQuery);
		mockQuery.ilike.mockReturnValue(mockQuery);
		mockQuery.order.mockReturnValue(mockQuery);
		mockQuery.range.mockReturnValue(mockQuery);
		mockQuery.limit.mockReturnValue(mockQuery);

		// Terminal methods resolve with data
		mockQuery.single.mockResolvedValue({ data, error });
		mockQuery.range.mockResolvedValue({ data: data || [], error, count });
		mockQuery.limit.mockResolvedValue({ data: data || [], error });

		return mockQuery;
	};

	return {
		from: jest.fn().mockImplementation(() => createMockQuery()),
	};
});

jest.mock("../../src/middleware/auth");

const mockSupabase = require("../../src/config/supabase");
const mockAuth = require("../../src/middleware/auth");

// Setup Express app with voice notes routes
const app = express();
app.use(express.json());
app.use(require("../../src/routes/voiceNotes"));

describe("Voice Notes Routes", () => {
	let testDb;
	let mockUser;
	let authToken;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		mockUser = {
			id: "user-123",
			username: "testuser",
			email: "test@example.com",
			display_name: "Test User",
		};

		authToken = jwt.sign(
			{ id: mockUser.id, email: mockUser.email, username: mockUser.username },
			JWT_SECRET,
			{ expiresIn: "1h" }
		);

		// Mock authentication middleware
		mockAuth.authenticateToken.mockImplementation((req, res, next) => {
			req.user = mockUser;
			next();
		});
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("GET /test-deployment", () => {
		it("should return deployment info", async () => {
			const response = await request(app).get("/test-deployment").expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Refactored voice notes API deployed successfully"
			);
			expect(response.body).toHaveProperty("version");
			expect(response.body).toHaveProperty("timestamp");
		});
	});

	describe("GET /search", () => {
		it("should search voice notes by title", async () => {
			const searchResults = [
				{
					id: "note-1",
					title: "Test Voice Note",
					user_id: "user-456",
					likes: [{ count: 5 }],
					comments: [{ count: 2 }],
					plays: [{ count: 10 }],
					shares: [{ count: 1 }],
					tags: [{ tag_name: "music" }],
				},
			];

			// Configure mock to return search results
			const mockQuery = mockSupabase.from();
			mockQuery.range.mockResolvedValue({
				data: searchResults,
				error: null,
				count: 1,
			});

			const response = await request(app).get("/search?q=test").expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0]).toHaveProperty("title", "Test Voice Note");
		});

		it("should return empty results for empty query", async () => {
			const response = await request(app).get("/search?q=").expect(200);

			expect(response.body).toEqual({
				data: [],
				pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
			});
		});
	});

	describe("GET /feed/:userId", () => {
		it("should return user feed with balanced algorithm", async () => {
			const userId = "user-123";
			const feedData = [
				{
					id: "note-1",
					title: "Feed Post 1",
					user_id: "user-456",
					is_shared: false,
					likes: [{ count: 5 }],
					comments: [{ count: 2 }],
					plays: [{ count: 10 }],
					shares: [{ count: 1 }],
				},
			];

			// Configure mock for feed operations
			const mockQuery = mockSupabase.from();
			mockQuery.range.mockResolvedValue({
				data: feedData,
				error: null,
				count: 1,
			});

			const response = await request(app)
				.get(`/feed/${userId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("pagination");
			expect(response.body).toHaveProperty("meta");
		});
	});

	describe("POST /", () => {
		it("should create a new voice note", async () => {
			const newVoiceNote = {
				title: "New Voice Note",
				duration: 120,
				audio_url: "https://example.com/audio.mp3",
				background_image: "https://example.com/image.jpg",
				tags: ["music", "test"],
			};

			const createdNote = {
				id: "note-123",
				user_id: "user-123",
				...newVoiceNote,
			};

			// Configure mock for voice note creation
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({ data: createdNote, error: null });

			const response = await request(app)
				.post("/")
				.set("Authorization", `Bearer ${authToken}`)
				.send(newVoiceNote)
				.expect(201);

			expect(response.body).toHaveProperty("id", "note-123");
			expect(response.body).toHaveProperty("title", "New Voice Note");
		});

		it("should reject voice note creation without required fields", async () => {
			const incompleteNote = {
				title: "Incomplete Note",
				// Missing duration and audio_url
			};

			const response = await request(app)
				.post("/")
				.set("Authorization", `Bearer ${authToken}`)
				.send(incompleteNote)
				.expect(400);

			expect(response.body).toHaveProperty("message");
		});
	});

	describe("GET /:id", () => {
		it("should get voice note by ID", async () => {
			const voiceNote = {
				id: "note-123",
				title: "Test Voice Note",
				user_id: "user-456",
				users: {
					id: "user-456",
					username: "user456",
					display_name: "User 456",
				},
				likes: [{ count: 5 }],
				comments: [{ count: 2 }],
				plays: [{ count: 10 }],
				shares: [{ count: 1 }],
				tags: [{ tag_name: "music" }],
			};

			// Configure mock for getting voice note by ID
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({ data: voiceNote, error: null });

			const response = await request(app).get("/note-123").expect(200);

			expect(response.body).toHaveProperty("id", "note-123");
			expect(response.body).toHaveProperty("likes", 5);
			expect(response.body).toHaveProperty("tags", ["music"]);
		});

		it("should return 404 for non-existent voice note", async () => {
			// Configure mock for non-existent voice note
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: null,
				error: { code: "PGRST116" },
			});

			const response = await request(app).get("/non-existent").expect(404);

			expect(response.body).toHaveProperty("message", "Voice note not found");
		});
	});

	describe("PUT /:id", () => {
		it("should update voice note", async () => {
			const updateData = {
				title: "Updated Title",
				background_image: "https://example.com/new-image.jpg",
				tags: ["music", "updated"],
			};

			const updatedNote = {
				id: "note-123",
				user_id: "user-123",
				...updateData,
			};

			// Configure mock for update operations
			// First call: ownership check
			const ownershipQuery = mockSupabase.from();
			ownershipQuery.single.mockResolvedValueOnce({
				data: { user_id: "user-123" },
				error: null,
			});

			// Second call: actual update
			const updateQuery = mockSupabase.from();
			updateQuery.single.mockResolvedValueOnce({
				data: updatedNote,
				error: null,
			});

			const response = await request(app)
				.put("/note-123")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body).toHaveProperty("title", "Updated Title");
		});

		it("should reject update by non-owner", async () => {
			const updateData = { title: "Hacker Update" };

			// Configure mock for ownership check (different user)
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: { user_id: "different-user" },
				error: null,
			});

			const response = await request(app)
				.put("/note-123")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updateData)
				.expect(403);

			expect(response.body).toHaveProperty(
				"message",
				"Not authorized to update this voice note"
			);
		});
	});

	describe("DELETE /:id", () => {
		it("should delete voice note", async () => {
			// Configure mock for delete operations
			// First call: ownership check
			const ownershipQuery = mockSupabase.from();
			ownershipQuery.single.mockResolvedValueOnce({
				data: { user_id: "user-123" },
				error: null,
			});

			// Second call: actual delete
			const deleteQuery = mockSupabase.from();
			deleteQuery.delete.mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			});

			const response = await request(app)
				.delete("/note-123")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Voice note deleted successfully"
			);
		});

		it("should reject delete by non-owner", async () => {
			// Configure mock for ownership check (different user)
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: { user_id: "different-user" },
				error: null,
			});

			const response = await request(app)
				.delete("/note-123")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(403);

			expect(response.body).toHaveProperty(
				"message",
				"Not authorized to delete this voice note"
			);
		});
	});

	describe("POST /:id/like", () => {
		it("should like a voice note", async () => {
			const likeData = { userId: "user-123" };
			const newLike = {
				id: "like-123",
				voice_note_id: "note-456",
				user_id: "user-123",
			};

			// Configure mock for like operations
			// First call: check if user already liked (not found)
			const checkQuery = mockSupabase.from();
			checkQuery.single.mockResolvedValueOnce({
				data: null,
				error: { code: "PGRST116" },
			});

			// Second call: create new like
			const likeQuery = mockSupabase.from();
			likeQuery.single.mockResolvedValueOnce({ data: newLike, error: null });

			const response = await request(app)
				.post("/note-456/like")
				.set("Authorization", `Bearer ${authToken}`)
				.send(likeData)
				.expect(201);

			expect(response.body).toEqual(newLike);
		});

		it("should reject duplicate like", async () => {
			const likeData = { userId: "user-123" };
			const existingLike = {
				id: "like-123",
				voice_note_id: "note-456",
				user_id: "user-123",
			};

			// Configure mock for duplicate like check
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({ data: existingLike, error: null });

			const response = await request(app)
				.post("/note-456/like")
				.set("Authorization", `Bearer ${authToken}`)
				.send(likeData)
				.expect(200);

			expect(response.body).toEqual(existingLike);
		});
	});

	describe("POST /:id/unlike", () => {
		it("should unlike a voice note", async () => {
			const unlikeData = { userId: "user-123" };

			// Configure mock for unlike operation
			const mockQuery = mockSupabase.from();
			// The delete method needs to return an object with eq method
			mockQuery.delete.mockReturnValue({
				eq: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			const response = await request(app)
				.post("/note-456/unlike")
				.set("Authorization", `Bearer ${authToken}`)
				.send(unlikeData)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Voice note unliked successfully"
			);
		});
	});

	describe("POST /:id/comments", () => {
		it("should add comment to voice note", async () => {
			const commentData = { content: "Great voice note!" };
			const newComment = {
				id: "comment-123",
				voice_note_id: "note-456",
				user_id: "user-123",
				content: "Great voice note!",
				user: {
					id: "user-123",
					username: "testuser",
					display_name: "Test User",
				},
				users: {
					id: "user-123",
					username: "testuser",
					display_name: "Test User",
				},
			};

			// Configure mock for comment creation
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({ data: newComment, error: null });

			const response = await request(app)
				.post("/note-456/comments")
				.set("Authorization", `Bearer ${authToken}`)
				.send(commentData)
				.expect(201);

			expect(response.body).toEqual(newComment);
		});

		it("should reject comment without content", async () => {
			const commentData = {};

			const response = await request(app)
				.post("/note-456/comments")
				.set("Authorization", `Bearer ${authToken}`)
				.send(commentData)
				.expect(400);

			expect(response.body).toHaveProperty("message");
		});
	});

	describe("GET /:id/comments", () => {
		it("should get voice note comments", async () => {
			const comments = [
				{
					id: "comment-1",
					content: "Great voice note!",
					users: {
						id: "user-456",
						username: "user456",
						display_name: "User 456",
					},
				},
			];

			// Configure mock for getting comments
			const mockQuery = mockSupabase.from();
			mockQuery.range.mockResolvedValue({
				data: comments,
				error: null,
				count: 1,
			});

			const response = await request(app).get("/note-456/comments").expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveLength(1);
		});
	});

	describe("POST /:id/play", () => {
		it("should record voice note play", async () => {
			const playData = { userId: "user-123" };

			// Configure mock for play recording
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: { id: "play-123", voice_note_id: "note-456" },
				error: null,
			});

			const response = await request(app)
				.post("/note-456/play")
				.set("Authorization", `Bearer ${authToken}`)
				.send(playData)
				.expect(201);

			expect(response.body).toEqual({
				id: "play-123",
				voice_note_id: "note-456",
			});
		});

		it("should record anonymous play", async () => {
			// Configure mock for anonymous play recording
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: { id: "play-124", voice_note_id: "note-456" },
				error: null,
			});

			const response = await request(app).post("/note-456/play").expect(201);

			expect(response.body).toEqual({
				id: "play-124",
				voice_note_id: "note-456",
			});
		});
	});

	describe("POST /:voiceNoteId/share", () => {
		it("should share a voice note", async () => {
			const shareData = { userId: "user-123" };
			const newShare = {
				id: "share-123",
				voice_note_id: "note-456",
				user_id: "user-123",
			};

			// Configure mock for share operations
			// First call: check if user already shared (not found)
			const checkQuery = mockSupabase.from();
			checkQuery.single.mockResolvedValueOnce({
				data: null,
				error: { code: "PGRST116" },
			});

			// Second call: create new share
			const shareQuery = mockSupabase.from();
			shareQuery.single.mockResolvedValueOnce({ data: newShare, error: null });

			const response = await request(app)
				.post("/note-456/share")
				.set("Authorization", `Bearer ${authToken}`)
				.send(shareData)
				.expect(201);

			expect(response.body).toEqual(newShare);
		});

		it("should handle sharing when table does not exist", async () => {
			const shareData = { userId: "user-123" };

			// Configure mock for table not found error
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: null,
				error: { code: "42P01" },
			});

			const response = await request(app)
				.post("/note-456/share")
				.set("Authorization", `Bearer ${authToken}`)
				.send(shareData)
				.expect(400);

			expect(response.body.message).toContain("feature not fully configured");
		});
	});

	describe("GET /tags/:tagName", () => {
		it("should get voice notes by tag", async () => {
			const taggedNotes = [
				{
					tag_name: "music",
					voice_notes: {
						id: "note-1",
						title: "Music Note",
						user_id: "user-456",
						users: {
							id: "user-456",
							username: "user456",
							display_name: "User 456",
						},
						likes: [{ count: 5 }],
						comments: [{ count: 2 }],
						plays: [{ count: 10 }],
					},
				},
			];

			// Configure mock for tag-based retrieval
			const mockQuery = mockSupabase.from();
			mockQuery.range.mockResolvedValue({
				data: taggedNotes,
				error: null,
				count: 1,
			});

			const response = await request(app).get("/tags/music").expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveLength(1);
		});
	});

	describe("Error Handling", () => {
		it("should handle database errors gracefully", async () => {
			// Configure mock for database error
			const mockQuery = mockSupabase.from();
			mockQuery.single.mockResolvedValue({
				data: null,
				error: { message: "Database connection failed" },
			});

			const response = await request(app).get("/note-error").expect(500);

			expect(response.body).toHaveProperty("message", "Server error");
		});

		it("should handle authentication errors", async () => {
			// Override auth mock to simulate auth failure
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				return res.status(401).json({ message: "Invalid token" });
			});

			const response = await request(app)
				.post("/note-456/like")
				.set("Authorization", "Bearer invalid-token")
				.expect(401);

			expect(response.body).toHaveProperty("message", "Invalid token");
		});
	});
});
