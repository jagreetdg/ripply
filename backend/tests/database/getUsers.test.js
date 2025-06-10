/**
 * Database getUsers Utility Tests
 * Tests all database user retrieval functionality
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");

const mockSupabase = require("../../src/config/supabase");
const getUsers = require("../../src/db/getUsers");

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
		it("should retrieve all users successfully", async () => {
			const mockUsers = [
				{
					id: "user-1",
					username: "user1",
					email: "user1@example.com",
					display_name: "User One",
					is_verified: true,
				},
				{
					id: "user-2",
					username: "user2",
					email: "user2@example.com",
					display_name: "User Two",
					is_verified: false,
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
			});

			const result = await getUsers();

			expect(result).toEqual(mockUsers);
			expect(mockSupabase.from).toHaveBeenCalledWith("users");
		});

		it("should handle database errors gracefully", async () => {
			const mockError = new Error("Database connection failed");

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: null, error: mockError }),
			});

			await expect(getUsers()).rejects.toThrow("Database connection failed");
		});

		it("should handle empty results", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			const result = await getUsers();

			expect(result).toEqual([]);
		});

		it("should select correct user fields", async () => {
			const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			await getUsers();

			expect(mockSelect).toHaveBeenCalledWith("*");
		});
	});

	describe("Error handling", () => {
		it("should handle null data response", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: null, error: null }),
			});

			const result = await getUsers();

			expect(result).toBeNull();
		});

		it("should propagate Supabase errors", async () => {
			const supabaseError = { message: "RLS policy violation", code: 42501 };

			mockSupabase.from.mockReturnValue({
				select: jest
					.fn()
					.mockResolvedValue({ data: null, error: supabaseError }),
			});

			await expect(getUsers()).rejects.toEqual(supabaseError);
		});

		it("should handle network timeout errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockRejectedValue(new Error("Network timeout")),
			});

			await expect(getUsers()).rejects.toThrow("Network timeout");
		});
	});

	describe("Data integrity", () => {
		it("should return users with all expected fields", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				display_name: "Test User",
				avatar_url: "https://example.com/avatar.jpg",
				bio: "Test bio",
				is_verified: true,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
			});

			const result = await getUsers();

			expect(result[0]).toEqual(mockUser);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("username");
			expect(result[0]).toHaveProperty("email");
			expect(result[0]).toHaveProperty("display_name");
		});

		it("should handle users with null optional fields", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				display_name: "Test User",
				avatar_url: null,
				bio: null,
				is_verified: false,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
			});

			const result = await getUsers();

			expect(result[0]).toEqual(mockUser);
			expect(result[0].avatar_url).toBeNull();
			expect(result[0].bio).toBeNull();
		});
	});

	describe("Performance considerations", () => {
		it("should call Supabase client only once", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			await getUsers();

			expect(mockSupabase.from).toHaveBeenCalledTimes(1);
		});

		it("should handle large datasets", async () => {
			const largeMockUsers = Array.from({ length: 1000 }, (_, i) => ({
				id: `user-${i}`,
				username: `user${i}`,
				email: `user${i}@example.com`,
				display_name: `User ${i}`,
				is_verified: i % 2 === 0,
			}));

			mockSupabase.from.mockReturnValue({
				select: jest
					.fn()
					.mockResolvedValue({ data: largeMockUsers, error: null }),
			});

			const result = await getUsers();

			expect(result).toHaveLength(1000);
			expect(result[0].username).toBe("user0");
			expect(result[999].username).toBe("user999");
		});
	});

	describe("Integration scenarios", () => {
		it("should work with real-like database responses", async () => {
			const realisticUsers = [
				{
					id: "550e8400-e29b-41d4-a716-446655440000",
					username: "johndoe",
					email: "john.doe@example.com",
					display_name: "John Doe",
					avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
					bio: "Software developer passionate about open source",
					is_verified: true,
					created_at: "2023-01-15T10:30:00.000Z",
					updated_at: "2023-12-01T15:45:30.000Z",
				},
				{
					id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
					username: "janedoe",
					email: "jane.doe@example.com",
					display_name: "Jane Doe",
					avatar_url: null,
					bio: null,
					is_verified: false,
					created_at: "2023-02-20T08:15:00.000Z",
					updated_at: "2023-02-20T08:15:00.000Z",
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest
					.fn()
					.mockResolvedValue({ data: realisticUsers, error: null }),
			});

			const result = await getUsers();

			expect(result).toEqual(realisticUsers);
			expect(result).toHaveLength(2);
			expect(result[0].id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
			);
		});
	});
});
