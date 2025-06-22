/**
 * User Routes Tests
 * Tests all user-related functionality including profiles, follows, search, etc.
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

// Mock the dependencies
jest.mock("../../src/config/supabase");
jest.mock("../../src/middleware/auth");

const mockSupabase = require("../../src/config/supabase");
const mockAuth = require("../../src/middleware/auth");

// Setup Express app with user routes
const app = express();
app.use(express.json());
app.use(require("../../src/routes/users"));

describe("User Routes", () => {
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
			bio: "Test bio",
			is_verified: false,
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

	describe("GET /me", () => {
		it("should return authenticated user info", async () => {
			const response = await request(app)
				.get("/me")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toEqual(mockUser);
		});

		it("should reject unauthenticated request", async () => {
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				res.status(401).json({ message: "Authentication required" });
			});

			const response = await request(app).get("/me").expect(401);

			expect(response.body).toHaveProperty(
				"message",
				"Authentication required"
			);
		});
	});

	describe("GET /search", () => {
		it("should search users by username", async () => {
			const searchResults = [
				{
					id: "user-1",
					username: "searchuser1",
					display_name: "Search User 1",
				},
				{
					id: "user-2",
					username: "searchuser2",
					display_name: "Search User 2",
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					or: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							order: jest.fn().mockReturnValue({
								neq: jest.fn().mockReturnValue({
									range: jest.fn().mockResolvedValue({
										data: searchResults,
										error: null,
										count: 2,
									}),
								}),
							}),
						}),
					}),
				}),
			});

			const response = await request(app)
				.get("/search?term=searchuser&currentUserId=user-123")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toEqual(searchResults);
		});

		it("should return empty array for empty search term", async () => {
			const response = await request(app)
				.get("/search?term=")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toEqual([]);
		});

		it("should handle pagination correctly", async () => {
			const searchResults = [
				{
					id: "user-1",
					username: "searchuser1",
					display_name: "Search User 1",
				},
			];

			const mockQuery = {
				select: jest.fn().mockReturnValue({
					or: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							order: jest.fn().mockReturnValue({
								neq: jest.fn().mockReturnValue({
									range: jest.fn().mockResolvedValue({
										data: searchResults,
										error: null,
										count: 25,
									}),
								}),
							}),
						}),
					}),
				}),
			};

			mockSupabase.from.mockReturnValue(mockQuery);

			const response = await request(app)
				.get("/search?term=searchuser&page=2&limit=10")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(
				mockQuery.select().or().order().order().neq().range
			).toHaveBeenCalledWith(10, 19);
			expect(response.body).toEqual(searchResults);
		});
	});

	describe("GET /:userId", () => {
		it("should get user profile by ID", async () => {
			const userProfile = {
				id: "user-456",
				username: "otheruser",
				display_name: "Other User",
				bio: "Other user bio",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [userProfile], error: null }),
				}),
			});

			const response = await request(app).get("/user-456").expect(200);

			expect(response.body).toEqual(userProfile);
		});

		it("should return 404 for non-existent user", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			const response = await request(app).get("/non-existent-user").expect(404);

			expect(response.body).toHaveProperty("message", "User not found");
		});
	});

	describe("PUT /:userId", () => {
		it("should update user profile", async () => {
			const updateData = {
				display_name: "Updated Name",
				bio: "Updated bio",
			};

			const updatedUser = { ...mockUser, ...updateData };

			mockSupabase.from.mockReturnValue({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						select: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: updatedUser, error: null }),
						}),
					}),
				}),
			});

			const response = await request(app)
				.put("/user-123")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body).toEqual(updatedUser);
		});

		it("should filter out sensitive fields from update", async () => {
			const updateData = {
				display_name: "Updated Name",
				id: "hacker-attempt",
				email: "hacker@example.com",
				created_at: new Date().toISOString(),
			};

			const updatedUser = {
				...mockUser,
				display_name: updateData.display_name,
			};

			const mockUpdate = jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: updatedUser, error: null }),
					}),
				}),
			});

			mockSupabase.from.mockReturnValue({
				update: mockUpdate,
			});

			const response = await request(app)
				.put("/user-123")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updateData)
				.expect(200);

			// Verify that sensitive fields were filtered out
			expect(mockUpdate).toHaveBeenCalledWith({
				display_name: "Updated Name",
				// Should not include id, email, created_at
			});
			expect(response.body).toEqual(updatedUser);
		});
	});

	describe("GET /:userId/followers", () => {
		it("should get user followers", async () => {
			const followers = [
				{
					follower_id: "follower-1",
					users: {
						id: "follower-1",
						username: "follower1",
						display_name: "Follower 1",
					},
				},
				{
					follower_id: "follower-2",
					users: {
						id: "follower-2",
						username: "follower2",
						display_name: "Follower 2",
					},
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: followers, error: null }),
				}),
			});

			const response = await request(app)
				.get("/user-123/followers")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toEqual(followers);
		});
	});

	describe("GET /:userId/following", () => {
		it("should get users that a user is following", async () => {
			const following = [
				{
					following_id: "following-1",
					users: {
						id: "following-1",
						username: "following1",
						display_name: "Following 1",
					},
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: following, error: null }),
				}),
			});

			const response = await request(app)
				.get("/user-123/following")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toEqual(following);
		});
	});

	describe("POST /:userId/follow", () => {
		it("should follow a user successfully", async () => {
			const followData = { followerId: "user-123" };
			const newFollow = {
				id: "follow-123",
				follower_id: "user-123",
				following_id: "user-456",
			};

			// Mock check for existing follow (none found)
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

			// Mock insert new follow
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: newFollow, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/user-456/follow")
				.set("Authorization", `Bearer ${authToken}`)
				.send(followData)
				.expect(201);

			expect(response.body).toEqual(newFollow);
		});

		it("should reject follow request if already following", async () => {
			const followData = { followerId: "user-123" };
			const existingFollow = {
				id: "follow-123",
				follower_id: "user-123",
				following_id: "user-456",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: existingFollow, error: null }),
						}),
					}),
				}),
			});

			const response = await request(app)
				.post("/user-456/follow")
				.set("Authorization", `Bearer ${authToken}`)
				.send(followData)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Already following this user"
			);
		});
	});

	describe("POST /:userId/unfollow", () => {
		it("should unfollow a user successfully", async () => {
			const unfollowData = { followerId: "user-123" };
			const existingFollow = {
				id: "follow-123",
				follower_id: "user-123",
				following_id: "user-456",
			};

			// Mock check for existing follow (found)
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: existingFollow, error: null }),
						}),
					}),
				}),
			});

			// Mock delete follow
			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/user-456/unfollow")
				.set("Authorization", `Bearer ${authToken}`)
				.send(unfollowData)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Unfollowed successfully"
			);
		});

		it("should return 404 if not currently following", async () => {
			const unfollowData = { followerId: "user-123" };

			mockSupabase.from.mockReturnValue({
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

			const response = await request(app)
				.post("/user-456/unfollow")
				.set("Authorization", `Bearer ${authToken}`)
				.send(unfollowData)
				.expect(404);

			expect(response.body).toHaveProperty(
				"message",
				"Not currently following this user"
			);
		});
	});

	describe("GET /:userId/voice-notes", () => {
		it("should get user voice notes with stats", async () => {
			const voiceNotes = [
				{
					id: "note-1",
					title: "Test Note 1",
					user_id: "user-123",
					likes: [{ count: 5 }],
					comments: [{ count: 2 }],
					plays: [{ count: 10 }],
					shares: [{ count: 1 }],
					tags: [{ tag_name: "music" }, { tag_name: "test" }],
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							range: jest
								.fn()
								.mockResolvedValue({ data: voiceNotes, error: null, count: 1 }),
						}),
					}),
				}),
			});

			const response = await request(app)
				.get("/user-123/voice-notes")
				.set("Authorization", `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty("data");
			expect(response.body).toHaveProperty("pagination");
			expect(response.body.data[0]).toHaveProperty("likes", 5);
			expect(response.body.data[0]).toHaveProperty("comments", 2);
			expect(response.body.data[0]).toHaveProperty("plays", 10);
			expect(response.body.data[0]).toHaveProperty("shares", 1);
			expect(response.body.data[0]).toHaveProperty("tags", ["music", "test"]);
		});
	});

	describe("GET /username/:username", () => {
		it("should get user by username", async () => {
			const userProfile = {
				id: "user-456",
				username: "searchuser",
				display_name: "Search User",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [userProfile], error: null }),
				}),
			});

			const response = await request(app)
				.get("/username/searchuser")
				.expect(200);

			expect(response.body).toEqual(userProfile);
		});

		it("should return 404 for non-existent username", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			const response = await request(app)
				.get("/username/nonexistent")
				.expect(404);

			expect(response.body).toHaveProperty("message", "User not found");
		});
	});

	describe("PATCH /:userId/verify", () => {
		it("should update user verification status", async () => {
			const verificationData = { isVerified: true };
			const verifiedUser = { ...mockUser, is_verified: true };

			// Mock user exists check
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: { id: "user-123" }, error: null }),
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
								.mockResolvedValue({ data: verifiedUser, error: null }),
						}),
					}),
				}),
			});

			const response = await request(app)
				.patch("/user-123/verify")
				.send(verificationData)
				.expect(200);

			expect(response.body).toEqual(verifiedUser);
		});

		it("should reject request without isVerified field", async () => {
			const response = await request(app)
				.patch("/user-123/verify")
				.send({})
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"isVerified field is required"
			);
		});
	});

	describe("GET /:userId/is-following/:followerId", () => {
		it("should return true if user is following", async () => {
			const followRelation = {
				id: "follow-123",
				follower_id: "follower-123",
				following_id: "user-456",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: followRelation, error: null }),
						}),
					}),
				}),
			});

			const response = await request(app)
				.get("/user-456/is-following/follower-123")
				.expect(200);

			expect(response.body).toEqual({ isFollowing: true });
		});

		it("should return false if user is not following", async () => {
			mockSupabase.from.mockReturnValue({
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

			const response = await request(app)
				.get("/user-456/is-following/follower-123")
				.expect(200);

			expect(response.body).toEqual({ isFollowing: false });
		});
	});

	describe("GET /:userId/follower-count", () => {
		it("should return follower count", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ count: 15, error: null }),
				}),
			});

			const response = await request(app)
				.get("/user-123/follower-count")
				.expect(200);

			expect(response.body).toEqual({ count: 15 });
		});
	});

	describe("GET /:userId/following-count", () => {
		it("should return following count", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ count: 8, error: null }),
				}),
			});

			const response = await request(app)
				.get("/user-123/following-count")
				.expect(200);

			expect(response.body).toEqual({ count: 8 });
		});
	});
});
