/**
 * Database getUsers Utility Tests
 * Tests all database users functionality
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase", () => {
	const createMockQuery = () => {
		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			range: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			or: jest.fn().mockReturnThis(),
			ilike: jest.fn().mockReturnThis(),
		};
		mockQuery.range.mockResolvedValue({ data: [], error: null });
		mockQuery.limit.mockResolvedValue({ data: [], error: null });
		return mockQuery;
	};

	return {
		supabase: {
			from: jest.fn(() => createMockQuery()),
		},
	};
});

const { supabase: mockSupabase } = require("../../src/config/supabase");
const { getUsers } = require("../../src/db/getUsers");

describe("Database getUsers Utility", () => {
	let testDb;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("getUsers function", () => {
		it("should retrieve users with pagination", async () => {
			const mockUsers = [
				{
					id: "user-1",
					username: "testuser1",
					display_name: "Test User 1",
					email: "test1@example.com",
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "user-2",
					username: "testuser2",
					display_name: "Test User 2",
					email: "test2@example.com",
					created_at: "2023-01-02T00:00:00Z",
				},
			];

			const mockSelect = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			const result = await getUsers({ limit: 10 });

			expect(result).toEqual(mockUsers);
			expect(mockSupabase.from).toHaveBeenCalledWith("users");
		});

		it("should handle database errors gracefully", async () => {
			const mockError = new Error("Database connection failed");

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: null, error: mockError }),
					}),
				}),
			});

			await expect(getUsers({ limit: 10 })).rejects.toThrow(
				"Database connection failed"
			);
		});

		it("should apply correct ordering", async () => {
			const mockOrder = jest.fn().mockReturnValue({
				limit: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: mockOrder,
				}),
			});

			await getUsers({ limit: 10 });

			expect(mockOrder).toHaveBeenCalledWith("created_at", {
				ascending: false,
			});
		});

		it("should apply correct pagination", async () => {
			const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: mockLimit,
					}),
				}),
			});

			await getUsers({ limit: 10 });

			expect(mockLimit).toHaveBeenCalledWith(10);
		});

		it("should handle edge case pagination values", async () => {
			const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: mockLimit,
					}),
				}),
			});

			await getUsers({ limit: 1 });

			expect(mockLimit).toHaveBeenCalledWith(1);
		});
	});

	describe("Data integrity", () => {
		it("should return users with all expected fields", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				display_name: "Test User",
				email: "test@example.com",
				avatar_url: "https://example.com/avatar.jpg",
				bio: "Test bio",
				is_verified: false,
				followers_count: 10,
				following_count: 5,
				voice_notes_count: 3,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: [mockUser], error: null }),
					}),
				}),
			});

			const result = await getUsers({ limit: 10 });

			expect(result[0]).toEqual(mockUser);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("username");
			expect(result[0]).toHaveProperty("email");
		});

		it("should handle users with null optional fields", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				display_name: null,
				email: "test@example.com",
				avatar_url: null,
				bio: null,
				is_verified: false,
				followers_count: 0,
				following_count: 0,
				voice_notes_count: 0,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: [mockUser], error: null }),
					}),
				}),
			});

			const result = await getUsers({ limit: 10 });

			expect(result[0]).toEqual(mockUser);
			expect(result[0].display_name).toBeNull();
			expect(result[0].avatar_url).toBeNull();
			expect(result[0].bio).toBeNull();
		});
	});

	describe("Performance considerations", () => {
		it("should call Supabase client only once", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue({ data: [], error: null }),
					}),
				}),
			});

			await getUsers({ limit: 10 });

			expect(mockSupabase.from).toHaveBeenCalledTimes(1);
		});

		it("should handle large result sets efficiently", async () => {
			const mockLargeDataSet = Array.from({ length: 1000 }, (_, i) => ({
				id: `user-${i}`,
				username: `user${i}`,
				display_name: `User ${i}`,
				email: `user${i}@example.com`,
				created_at: new Date().toISOString(),
			}));

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: mockLargeDataSet, error: null }),
					}),
				}),
			});

			const result = await getUsers({ limit: 1000 });

			expect(result).toHaveLength(1000);
			expect(result[0]).toHaveProperty("id");
		});
	});

	describe("Error handling", () => {
		it("should handle null data response", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue({ data: null, error: null }),
					}),
				}),
			});

			const result = await getUsers({ limit: 10 });

			expect(result).toEqual([]);
		});

		it("should propagate Supabase errors", async () => {
			const supabaseError = {
				message: "RLS policy violation",
				code: 42501,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: null, error: supabaseError }),
					}),
				}),
			});

			await expect(getUsers({ limit: 10 })).rejects.toEqual(supabaseError);
		});

		it("should handle network timeout errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest.fn().mockRejectedValue(new Error("Network timeout")),
					}),
				}),
			});

			await expect(getUsers({ limit: 10 })).rejects.toThrow("Network timeout");
		});
	});

	describe("Search functionality", () => {
		it("should support search by username and display name", async () => {
			const mockSearchResults = [
				{
					id: "user-1",
					username: "john_doe",
					display_name: "John Doe",
					email: "john@example.com",
				},
			];

			const mockOr = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest
						.fn()
						.mockResolvedValue({ data: mockSearchResults, error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					or: mockOr,
				}),
			});

			const result = await getUsers({ search: "john", limit: 10 });

			expect(result).toEqual(mockSearchResults);
			expect(mockOr).toHaveBeenCalledWith(
				"username.ilike.%john%,display_name.ilike.%john%"
			);
		});

		it("should handle empty search results", async () => {
			const mockOr = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					or: mockOr,
				}),
			});

			const result = await getUsers({ search: "nonexistent", limit: 10 });

			expect(result).toEqual([]);
		});
	});
});
