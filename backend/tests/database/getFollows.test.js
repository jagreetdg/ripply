/**
 * Database getFollows Utility Tests
 * Tests all database follow relationships functionality
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase", () => {
	const createMockQuery = () => {
		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			range: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: null }),
		};
		mockQuery.range.mockResolvedValue({ data: [], error: null });
		mockQuery.limit.mockResolvedValue({ data: [], error: null });
		return mockQuery;
	};

	return {
		supabaseAdmin: {
			from: jest.fn(() => createMockQuery()),
		},
	};
});

const { supabaseAdmin: mockSupabase } = require("../../src/config/supabase");
const { getFollows } = require("../../src/db/getFollows");

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
		it("should retrieve followers with user information", async () => {
			const mockFollowers = [
				{
					id: "follow-1",
					follower_id: "user-2",
					following_id: "user-1",
					created_at: "2023-01-01T00:00:00Z",
					follower: {
						id: "user-2",
						username: "follower1",
						display_name: "Follower One",
						avatar_url: "https://example.com/avatar1.jpg",
					},
				},
			];

			const mockSelect = jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: mockFollowers, error: null }),
					}),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			const result = await getFollows("user-1", "followers");

			expect(result).toEqual(mockFollowers);
			expect(mockSupabase.from).toHaveBeenCalledWith("follows");
		});

		it("should retrieve following with user information", async () => {
			const mockFollowing = [
				{
					id: "follow-1",
					follower_id: "user-1",
					following_id: "user-2",
					created_at: "2023-01-01T00:00:00Z",
					following: {
						id: "user-2",
						username: "following1",
						display_name: "Following One",
						avatar_url: "https://example.com/avatar2.jpg",
					},
				},
			];

			const mockSelect = jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: mockFollowing, error: null }),
					}),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			const result = await getFollows("user-1", "following");

			expect(result).toEqual(mockFollowing);
		});

		it("should handle database errors gracefully", async () => {
			const mockError = new Error("Database connection failed");

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: null, error: mockError }),
						}),
					}),
				}),
			});

			await expect(getFollows("user-1", "followers")).rejects.toThrow(
				"Database connection failed"
			);
		});

		it("should validate required parameters", async () => {
			await expect(getFollows()).rejects.toThrow("User ID is required");
			await expect(getFollows("user-1")).rejects.toThrow(
				"Invalid relationship type"
			);
			await expect(getFollows("user-1", "invalid")).rejects.toThrow(
				"Invalid relationship type"
			);
		});

		it("should apply correct filtering for followers", async () => {
			const mockEq = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: mockEq,
				}),
			});

			await getFollows("user-123", "followers");

			expect(mockEq).toHaveBeenCalledWith("following_id", "user-123");
		});

		it("should apply correct filtering for following", async () => {
			const mockEq = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: mockEq,
				}),
			});

			await getFollows("user-123", "following");

			expect(mockEq).toHaveBeenCalledWith("follower_id", "user-123");
		});
	});

	describe("Data integrity", () => {
		it("should return follow relationships with all expected fields", async () => {
			const mockFollow = {
				id: "follow-123",
				follower_id: "user-1",
				following_id: "user-2",
				created_at: "2023-01-01T00:00:00Z",
				follower: {
					id: "user-1",
					username: "follower_user",
					display_name: "Follower User",
					avatar_url: "https://example.com/avatar.jpg",
					is_verified: true,
				},
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: [mockFollow], error: null }),
						}),
					}),
				}),
			});

			const result = await getFollows("user-2", "followers");

			expect(result[0]).toEqual(mockFollow);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("follower_id");
			expect(result[0]).toHaveProperty("following_id");
			expect(result[0]).toHaveProperty("follower");
		});

		it("should handle null user data gracefully", async () => {
			const mockFollow = {
				id: "follow-123",
				follower_id: "user-1",
				following_id: "user-2",
				created_at: "2023-01-01T00:00:00Z",
				follower: null,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: [mockFollow], error: null }),
						}),
					}),
				}),
			});

			const result = await getFollows("user-2", "followers");

			expect(result[0]).toEqual(mockFollow);
			expect(result[0].follower).toBeNull();
		});
	});

	describe("Performance considerations", () => {
		it("should call Supabase client only once", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest.fn().mockResolvedValue({ data: [], error: null }),
						}),
					}),
				}),
			});

			await getFollows("user-1", "followers");

			expect(mockSupabase.from).toHaveBeenCalledTimes(1);
		});

		it("should handle large follower lists efficiently", async () => {
			const mockLargeFollowerSet = Array.from({ length: 1000 }, (_, i) => ({
				id: `follow-${i}`,
				follower_id: `user-${i}`,
				following_id: "user-1",
				created_at: new Date().toISOString(),
				follower: {
					id: `user-${i}`,
					username: `user${i}`,
					display_name: `User ${i}`,
				},
			}));

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: mockLargeFollowerSet, error: null }),
						}),
					}),
				}),
			});

			const result = await getFollows("user-1", "followers");

			expect(result).toHaveLength(1000);
			expect(result[0]).toHaveProperty("id");
		});
	});

	describe("Error handling", () => {
		it("should handle null data response", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest.fn().mockResolvedValue({ data: null, error: null }),
						}),
					}),
				}),
			});

			const result = await getFollows("user-1", "followers");

			expect(result).toEqual([]);
		});

		it("should propagate Supabase errors", async () => {
			const supabaseError = {
				message: "RLS policy violation",
				code: 42501,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest
								.fn()
								.mockResolvedValue({ data: null, error: supabaseError }),
						}),
					}),
				}),
			});

			await expect(getFollows("user-1", "followers")).rejects.toEqual(
				supabaseError
			);
		});

		it("should handle network timeout errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockReturnValue({
							limit: jest.fn().mockRejectedValue(new Error("Network timeout")),
						}),
					}),
				}),
			});

			await expect(getFollows("user-1", "followers")).rejects.toThrow(
				"Network timeout"
			);
		});
	});
});
