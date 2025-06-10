/**
 * Voice Notes Routes Tests
 * Tests all voice note functionality including CRUD, feed, search, likes, comments, shares
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");
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

		const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
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
				"Balanced feed algorithm deployed successfully"
			);
			expect(response.body).toHaveProperty("version");
			expect(response.body).toHaveProperty("timestamp");
		});
	});

	describe("GET /debug-feed/:userId", () => {
		it("should return debug feed data", async () => {
			const userId = "user-123";
			const followingData = [
				{ following_id: "user-456" },
				{ following_id: "user-789" },
			];

			const originalPosts = [
				{
					id: "note-1",
					title: "Original Post 1",
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
				},
			];

			const sharedData = [
				{
					id: "share-1",
					voice_note_id: "note-2",
					user_id: "user-456",
					shared_at: new Date().toISOString(),
				},
			];

			const sharedVoiceNotes = [
				{
					id: "note-2",
					title: "Shared Post 1",
					user_id: "user-789",
					users: {
						id: "user-789",
						username: "user789",
						display_name: "User 789",
					},
					likes: [{ count: 3 }],
					comments: [{ count: 1 }],
					plays: [{ count: 8 }],
					shares: [{ count: 2 }],
				},
			];

			// Mock following query
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest
							.fn()
							.mockResolvedValue({ data: followingData, error: null }),
					}),
				}),
			});

			// Mock original posts query
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					in: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: originalPosts, error: null }),
						}),
					}),
				}),
			});

			// Mock shared posts query
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					in: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: sharedData, error: null }),
						}),
					}),
				}),
			});

			// Mock shared voice notes query
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					in: jest
						.fn()
						.mockResolvedValue({ data: sharedVoiceNotes, error: null }),
				}),
			});

			// Mock sharer info queries
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: {
								id: "user-456",
								username: "user456",
								display_name: "User 456",
							},
							error: null,
						}),
					}),
				}),
			});

			const response = await request(app)
				.get(`/debug-feed/${userId}`)
				.expect(200);

			expect(response.body).toHaveProperty("userId", userId);
			expect(response.body).toHaveProperty("followingCount", 2);
			expect(response.body).toHaveProperty("originalPosts");
			expect(response.body).toHaveProperty("sharedPosts");
			expect(response.body).toHaveProperty("combined");
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

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					ilike: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							range: jest
								.fn()
								.mockResolvedValue({
									data: searchResults,
									error: null,
									count: 1,
								}),
						}),
					}),
				}),
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
				pagination: { page: 1, limit: 20, total: 0 },
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

			// Mock complex feed query
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					in: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							range: jest
								.fn()
								.mockResolvedValue({ data: feedData, error: null, count: 1 }),
						}),
					}),
				}),
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

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: createdNote, error: null }),
					}),
				}),
			});

			// Mock tag insertion
			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockResolvedValue({ error: null }),
			});

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

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: voiceNote, error: null }),
					}),
				}),
			});

			const response = await request(app).get("/note-123").expect(200);

			expect(response.body).toHaveProperty("id", "note-123");
			expect(response.body).toHaveProperty("likes", 5);
			expect(response.body).toHaveProperty("tags", ["music"]);
		});

		it("should return 404 for non-existent voice note", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
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

			// Mock ownership check
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { user_id: "user-123" },
							error: null,
						}),
					}),
				}),
			});

			// Mock update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						select: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: updatedNote, error: null }),
						}),
					}),
				}),
			});

			// Mock tag deletion and insertion
			mockSupabase.from.mockReturnValue({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
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

			// Mock ownership check - different user
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { user_id: "different-user" },
							error: null,
						}),
					}),
				}),
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
			// Mock ownership check
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { user_id: "user-123" },
							error: null,
						}),
					}),
				}),
			});

			// Mock delete
			mockSupabase.from.mockReturnValue({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
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
			// Mock ownership check - different user
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { user_id: "different-user" },
							error: null,
						}),
					}),
				}),
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

			// Mock check for existing like (none found)
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
						}),
					}),
				}),
			});

			// Mock insert like
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({ data: newLike, error: null }),
					}),
				}),
			});

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

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: existingLike, error: null }),
						}),
					}),
				}),
			});

			const response = await request(app)
				.post("/note-456/like")
				.set("Authorization", `Bearer ${authToken}`)
				.send(likeData)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Voice note already liked"
			);
		});
	});

	describe("DELETE /:id/like", () => {
		it("should unlike a voice note", async () => {
			const unlikeData = { userId: "user-123" };

			mockSupabase.from.mockReturnValue({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ error: null }),
					}),
				}),
			});

			const response = await request(app)
				.delete("/note-456/like")
				.set("Authorization", `Bearer ${authToken}`)
				.send(unlikeData)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Voice note unliked successfully"
			);
		});
	});

	describe("POST /:id/comment", () => {
		it("should add comment to voice note", async () => {
			const commentData = {
				userId: "user-123",
				content: "Great voice note!",
			};

			const newComment = {
				id: "comment-123",
				voice_note_id: "note-456",
				user_id: "user-123",
				content: "Great voice note!",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: newComment, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/note-456/comment")
				.set("Authorization", `Bearer ${authToken}`)
				.send(commentData)
				.expect(201);

			expect(response.body).toEqual(newComment);
		});

		it("should reject comment without content", async () => {
			const commentData = { userId: "user-123" };

			const response = await request(app)
				.post("/note-456/comment")
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
					user_id: "user-456",
					users: {
						id: "user-456",
						username: "user456",
						display_name: "User 456",
					},
					created_at: new Date().toISOString(),
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							range: jest
								.fn()
								.mockResolvedValue({ data: comments, error: null, count: 1 }),
						}),
					}),
				}),
			});

			const response = await request(app).get("/note-456/comments").expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0]).toHaveProperty(
				"content",
				"Great voice note!"
			);
		});
	});

	describe("POST /:id/play", () => {
		it("should record voice note play", async () => {
			const playData = { userId: "user-123" };
			const newPlay = {
				id: "play-123",
				voice_note_id: "note-456",
				user_id: "user-123",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({ data: newPlay, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/note-456/play")
				.send(playData)
				.expect(201);

			expect(response.body).toEqual(newPlay);
		});

		it("should record anonymous play", async () => {
			const newPlay = {
				id: "play-123",
				voice_note_id: "note-456",
				user_id: null,
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({ data: newPlay, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/note-456/play")
				.send({})
				.expect(201);

			expect(response.body).toEqual(newPlay);
		});
	});

	describe("POST /:id/share", () => {
		it("should share a voice note", async () => {
			const shareData = { userId: "user-123" };
			const newShare = {
				id: "share-123",
				voice_note_id: "note-456",
				user_id: "user-123",
			};

			// Mock check for existing share (none found)
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
						}),
					}),
				}),
			});

			// Mock insert share
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: newShare, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/note-456/share")
				.set("Authorization", `Bearer ${authToken}`)
				.send(shareData)
				.expect(201);

			expect(response.body).toEqual(newShare);
		});

		it("should handle sharing when table does not exist", async () => {
			const shareData = { userId: "user-123" };

			// Mock table not found error
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: null, error: { code: "42P01" } }),
						}),
					}),
				}),
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
					id: "note-1",
					title: "Music Note",
					tags: [{ tag_name: "music" }],
					likes: [{ count: 5 }],
					comments: [{ count: 2 }],
					plays: [{ count: 10 }],
					shares: [{ count: 1 }],
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							range: jest
								.fn()
								.mockResolvedValue({
									data: taggedNotes,
									error: null,
									count: 1,
								}),
						}),
					}),
				}),
			});

			const response = await request(app).get("/tags/music").expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0]).toHaveProperty("title", "Music Note");
		});
	});

	describe("Error Handling", () => {
		it("should handle database errors gracefully", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({
							data: null,
							error: { message: "Database error" },
						}),
				}),
			});

			const response = await request(app).get("/note-123").expect(500);

			expect(response.body).toHaveProperty("message", "Server error");
		});

		it("should handle authentication errors", async () => {
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				res.status(401).json({ message: "Authentication required" });
			});

			const response = await request(app)
				.post("/")
				.send({ title: "Test Note" })
				.expect(401);

			expect(response.body).toHaveProperty(
				"message",
				"Authentication required"
			);
		});
	});
});
