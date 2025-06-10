/**
 * Database getFollows Utility Tests
 * Tests all database follow relationships functionality
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");

const mockSupabase = require("../../src/config/supabase");
const getFollows = require("../../src/db/getFollows");

describe("Database getFollows Utility", () => {
	let testDb;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("getFollows function", () => {
		it("should retrieve follows with user information", async () => {
			const mockFollows = [
				{
					id: "follow-1",
					follower_id: "user-1",
					following_id: "user-2",
					created_at: "2023-01-01T00:00:00Z",
					follower: {
						id: "user-1",
						username: "follower1",
						display_name: "Follower One",
						avatar_url: "https://example.com/avatar1.jpg",
					},
					following: {
						id: "user-2",
						username: "following1",
						display_name: "Following One",
						avatar_url: "https://example.com/avatar2.jpg",
					},
				},
			];

			const mockSelect = jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ data: mockFollows, error: null }),
			});

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			const result = await getFollows("user-1", "followers");

			expect(result).toEqual(mockFollows);
			expect(mockSupabase.from).toHaveBeenCalledWith("follows");
		});

		it("should handle database errors gracefully", async () => {
			const mockError = new Error("Database connection failed");

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
				}),
			});

			await expect(getFollows("user-1", "followers")).rejects.toThrow(
				"Database connection failed"
			);
		});

		it("should get followers correctly", async () => {
			const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: mockEq,
				}),
			});

			await getFollows("user-123", "followers");

			expect(mockEq).toHaveBeenCalledWith("following_id", "user-123");
		});

		it("should get following correctly", async () => {
			const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: mockEq,
				}),
			});

			await getFollows("user-123", "following");

			expect(mockEq).toHaveBeenCalledWith("follower_id", "user-123");
		});

		it("should handle invalid relationship type", async () => {
			await expect(getFollows("user-123", "invalid")).rejects.toThrow(
				'Invalid relationship type. Must be "followers" or "following"'
			);
		});

		it("should select correct fields including user info", async () => {
			const mockSelect = jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			await getFollows("user-123", "followers");

			expect(mockSelect).toHaveBeenCalledWith(`
        *,
        follower:users!follower_id(id, username, display_name, avatar_url, is_verified),
        following:users!following_id(id, username, display_name, avatar_url, is_verified)
      `);
		});
	});

	describe("Data integrity", () => {
		it("should return follows with all expected fields", async () => {
			const mockFollow = {
				id: "follow-123",
				follower_id: "user-1",
				following_id: "user-2",
				created_at: "2023-01-01T00:00:00Z",
				follower: {
					id: "user-1",
					username: "testuser1",
					display_name: "Test User 1",
					avatar_url: "https://example.com/avatar1.jpg",
					is_verified: true,
				},
				following: {
					id: "user-2",
					username: "testuser2",
					display_name: "Test User 2",
					avatar_url: "https://example.com/avatar2.jpg",
					is_verified: false,
				},
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockFollow], error: null }),
				}),
			});

			const result = await getFollows("user-2", "followers");

			expect(result[0]).toEqual(mockFollow);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("follower_id");
			expect(result[0]).toHaveProperty("following_id");
			expect(result[0]).toHaveProperty("follower");
			expect(result[0]).toHaveProperty("following");
		});

		it("should handle follows with null user info gracefully", async () => {
			const mockFollow = {
				id: "follow-123",
				follower_id: "user-1",
				following_id: "user-2",
				created_at: "2023-01-01T00:00:00Z",
				follower: null,
				following: null,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockFollow], error: null }),
				}),
			});

			const result = await getFollows("user-2", "followers");

			expect(result[0]).toEqual(mockFollow);
			expect(result[0].follower).toBeNull();
			expect(result[0].following).toBeNull();
		});
	});

	describe("Performance considerations", () => {
		it("should call Supabase client only once", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			await getFollows("user-123", "followers");

			expect(mockSupabase.from).toHaveBeenCalledTimes(1);
		});

		it("should handle large follow lists efficiently", async () => {
			const largeMockFollows = Array.from({ length: 1000 }, (_, i) => ({
				id: `follow-${i}`,
				follower_id: `user-${i}`,
				following_id: "user-target",
				created_at: `2023-01-${String((i % 30) + 1).padStart(
					2,
					"0"
				)}T00:00:00Z`,
				follower: {
					id: `user-${i}`,
					username: `user${i}`,
					display_name: `User ${i}`,
					avatar_url: `https://example.com/avatar${i}.jpg`,
					is_verified: i % 10 === 0,
				},
				following: {
					id: "user-target",
					username: "target",
					display_name: "Target User",
					avatar_url: "https://example.com/target.jpg",
					is_verified: true,
				},
			}));

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ data: largeMockFollows, error: null }),
				}),
			});

			const result = await getFollows("user-target", "followers");

			expect(result).toHaveLength(1000);
			expect(result[0].follower.username).toBe("user0");
			expect(result[999].follower.username).toBe("user999");
		});
	});

	describe("Error handling", () => {
		it("should handle null data response", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: null, error: null }),
				}),
			});

			const result = await getFollows("user-123", "followers");

			expect(result).toBeNull();
		});

		it("should propagate Supabase errors", async () => {
			const supabaseError = { message: "RLS policy violation", code: 42501 };

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: null, error: supabaseError }),
				}),
			});

			await expect(getFollows("user-123", "followers")).rejects.toEqual(
				supabaseError
			);
		});

		it("should handle network timeout errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockRejectedValue(new Error("Network timeout")),
				}),
			});

			await expect(getFollows("user-123", "followers")).rejects.toThrow(
				"Network timeout"
			);
		});

		it("should handle missing user ID", async () => {
			await expect(getFollows(null, "followers")).rejects.toThrow(
				"User ID is required"
			);
		});

		it("should handle empty user ID", async () => {
			await expect(getFollows("", "followers")).rejects.toThrow(
				"User ID is required"
			);
		});
	});

	describe("Relationship types", () => {
		it("should handle both followers and following queries", async () => {
			const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: mockEq,
				}),
			});

			// Test followers
			await getFollows("user-123", "followers");
			expect(mockEq).toHaveBeenCalledWith("following_id", "user-123");

			mockEq.mockClear();

			// Test following
			await getFollows("user-123", "following");
			expect(mockEq).toHaveBeenCalledWith("follower_id", "user-123");
		});

		it("should be case sensitive for relationship type", async () => {
			await expect(getFollows("user-123", "Followers")).rejects.toThrow(
				'Invalid relationship type. Must be "followers" or "following"'
			);

			await expect(getFollows("user-123", "FOLLOWING")).rejects.toThrow(
				'Invalid relationship type. Must be "followers" or "following"'
			);
		});
	});

	describe("Integration scenarios", () => {
		it("should work with realistic follow data", async () => {
			const realisticFollows = [
				{
					id: "550e8400-e29b-41d4-a716-446655440000",
					follower_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
					following_id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
					created_at: "2023-01-15T10:30:00.000Z",
					follower: {
						id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
						username: "johndoe",
						display_name: "John Doe",
						avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
						is_verified: true,
					},
					following: {
						id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
						username: "janedoe",
						display_name: "Jane Doe",
						avatar_url: null,
						is_verified: false,
					},
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ data: realisticFollows, error: null }),
				}),
			});

			const result = await getFollows(
				"6ba7b811-9dad-11d1-80b4-00c04fd430c8",
				"followers"
			);

			expect(result).toEqual(realisticFollows);
			expect(result).toHaveLength(1);
			expect(result[0].id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
			);
			expect(result[0].follower.username).toBe("johndoe");
			expect(result[0].following.username).toBe("janedoe");
		});
	});
});
