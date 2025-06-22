/**
 * User Model Tests
 * Tests all user model functionality and business logic
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("../../src/config/supabase");

const mockSupabase = require("../../src/config/supabase");
const User = require("../../src/models/user");

describe("User Model", () => {
	let testDb;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("User Model Tests", () => {
		it("should exist and be testable", () => {
			expect(true).toBe(true);
		});

		it("should mock Supabase correctly", () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({ data: null, error: null }),
					}),
				}),
			});

			expect(mockSupabase.from).toBeDefined();
		});
	});

	describe("User.findById", () => {
		it("should find user by ID successfully", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				display_name: "Test User",
				avatar_url: "https://example.com/avatar.jpg",
				bio: "Test bio",
				is_verified: true,
				created_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			const result = await User.findById("user-123");

			expect(result).toEqual(mockUser);
			expect(mockSupabase.from).toHaveBeenCalledWith("users");
		});

		it("should return null for non-existent user", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			const result = await User.findById("non-existent");

			expect(result).toBeNull();
		});

		it("should throw error for database issues", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			await expect(User.findById("user-123")).rejects.toThrow("Database error");
		});

		it("should validate user ID parameter", async () => {
			await expect(User.findById()).rejects.toThrow("User ID is required");
			await expect(User.findById("")).rejects.toThrow("User ID is required");
			await expect(User.findById(null)).rejects.toThrow("User ID is required");
		});
	});

	describe("User.findByEmail", () => {
		it("should find user by email successfully", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				username: "testuser",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			const result = await User.findByEmail("test@example.com");

			expect(result).toEqual(mockUser);
			expect(mockSupabase.from).toHaveBeenCalledWith("users");
		});

		it("should handle case-insensitive email search", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			await User.findByEmail("TEST@EXAMPLE.COM");

			const mockEq = mockSupabase.from().select().eq;
			expect(mockEq).toHaveBeenCalledWith("email", "test@example.com");
		});

		it("should validate email parameter", async () => {
			await expect(User.findByEmail()).rejects.toThrow("Email is required");
			await expect(User.findByEmail("")).rejects.toThrow("Email is required");
			await expect(User.findByEmail("invalid-email")).rejects.toThrow(
				"Invalid email format"
			);
		});
	});

	describe("User.findByUsername", () => {
		it("should find user by username successfully", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			const result = await User.findByUsername("testuser");

			expect(result).toEqual(mockUser);
		});

		it("should handle case-insensitive username search", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			await User.findByUsername("TESTUSER");

			const mockEq = mockSupabase.from().select().eq;
			expect(mockEq).toHaveBeenCalledWith("username", "testuser");
		});

		it("should validate username parameter", async () => {
			await expect(User.findByUsername()).rejects.toThrow(
				"Username is required"
			);
			await expect(User.findByUsername("")).rejects.toThrow(
				"Username is required"
			);
		});
	});

	describe("User.create", () => {
		it("should create new user successfully", async () => {
			const newUserData = {
				username: "newuser",
				email: "new@example.com",
				display_name: "New User",
				avatar_url: "https://example.com/avatar.jpg",
			};

			const createdUser = {
				id: "new-user-123",
				...newUserData,
				created_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest
						.fn()
						.mockResolvedValue({ data: [createdUser], error: null }),
				}),
			});

			const result = await User.create(newUserData);

			expect(result).toEqual(createdUser);
			expect(mockSupabase.from).toHaveBeenCalledWith("users");
		});

		it("should validate required fields", async () => {
			await expect(User.create({})).rejects.toThrow(
				"Username and email are required"
			);
			await expect(User.create({ username: "test" })).rejects.toThrow(
				"Username and email are required"
			);
			await expect(User.create({ email: "test@example.com" })).rejects.toThrow(
				"Username and email are required"
			);
		});

		it("should validate email format", async () => {
			const invalidUserData = {
				username: "testuser",
				email: "invalid-email",
			};

			await expect(User.create(invalidUserData)).rejects.toThrow(
				"Invalid email format"
			);
		});

		it("should validate username format", async () => {
			const invalidUserData = {
				username: "invalid user!",
				email: "test@example.com",
			};

			await expect(User.create(invalidUserData)).rejects.toThrow(
				"Username can only contain letters, numbers, and underscores"
			);
		});

		it("should handle duplicate username error", async () => {
			const userData = {
				username: "existinguser",
				email: "new@example.com",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: null,
						error: { code: "23505", message: "duplicate key value" },
					}),
				}),
			});

			await expect(User.create(userData)).rejects.toThrow(
				"Username or email already exists"
			);
		});

		it("should handle duplicate email error", async () => {
			const userData = {
				username: "newuser",
				email: "existing@example.com",
			};

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: null,
						error: { code: "23505", message: "duplicate key value" },
					}),
				}),
			});

			await expect(User.create(userData)).rejects.toThrow(
				"Username or email already exists"
			);
		});
	});

	describe("User.update", () => {
		it("should update user successfully", async () => {
			const updateData = {
				display_name: "Updated Name",
				bio: "Updated bio",
				avatar_url: "https://example.com/new-avatar.jpg",
			};

			const updatedUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				...updateData,
				updated_at: "2023-01-02T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						select: jest
							.fn()
							.mockResolvedValue({ data: [updatedUser], error: null }),
					}),
				}),
			});

			const result = await User.update("user-123", updateData);

			expect(result).toEqual(updatedUser);
		});

		it("should validate user ID", async () => {
			await expect(User.update()).rejects.toThrow("User ID is required");
			await expect(User.update("")).rejects.toThrow("User ID is required");
		});

		it("should validate update data", async () => {
			await expect(User.update("user-123")).rejects.toThrow(
				"Update data is required"
			);
			await expect(User.update("user-123", {})).rejects.toThrow(
				"Update data is required"
			);
		});

		it("should prevent updating restricted fields", async () => {
			const restrictedData = {
				id: "new-id",
				username: "newusername",
				email: "new@example.com",
				created_at: "2023-01-01T00:00:00Z",
			};

			await expect(User.update("user-123", restrictedData)).rejects.toThrow(
				"Cannot update restricted fields"
			);
		});

		it("should validate email format if provided", async () => {
			const invalidData = {
				display_name: "New Name",
				email: "invalid-email",
			};

			await expect(User.update("user-123", invalidData)).rejects.toThrow(
				"Invalid email format"
			);
		});

		it("should handle user not found", async () => {
			mockSupabase.from.mockReturnValue({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						select: jest.fn().mockResolvedValue({ data: [], error: null }),
					}),
				}),
			});

			await expect(
				User.update("non-existent", { display_name: "New Name" })
			).rejects.toThrow("User not found");
		});
	});

	describe("User.delete", () => {
		it("should delete user successfully", async () => {
			mockSupabase.from.mockReturnValue({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			const result = await User.delete("user-123");

			expect(result).toBe(true);
			expect(mockSupabase.from).toHaveBeenCalledWith("users");
		});

		it("should validate user ID", async () => {
			await expect(User.delete()).rejects.toThrow("User ID is required");
			await expect(User.delete("")).rejects.toThrow("User ID is required");
		});

		it("should handle deletion errors", async () => {
			mockSupabase.from.mockReturnValue({
				delete: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ error: { message: "Deletion failed" } }),
				}),
			});

			await expect(User.delete("user-123")).rejects.toThrow("Deletion failed");
		});
	});

	describe("User.search", () => {
		it("should search users by query", async () => {
			const mockUsers = [
				{ id: "user-1", username: "testuser1", display_name: "Test User 1" },
				{ id: "user-2", username: "testuser2", display_name: "Test User 2" },
			];

			const mockLimit = jest
				.fn()
				.mockResolvedValue({ data: mockUsers, error: null });
			const mockOr = jest.fn().mockReturnValue({ limit: mockLimit });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					or: mockOr,
				}),
			});

			const result = await User.search("test");

			expect(result).toEqual(mockUsers);
			expect(mockOr).toHaveBeenCalledWith(
				"username.ilike.%test%,display_name.ilike.%test%"
			);
		});

		it("should handle empty search query", async () => {
			await expect(User.search()).rejects.toThrow("Search query is required");
			await expect(User.search("")).rejects.toThrow("Search query is required");
		});

		it("should limit search results", async () => {
			const mockUsers = Array.from({ length: 5 }, (_, i) => ({
				id: `user-${i}`,
				username: `user${i}`,
			}));

			const mockLimit = jest
				.fn()
				.mockResolvedValue({ data: mockUsers, error: null });
			const mockOr = jest.fn().mockReturnValue({ limit: mockLimit });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					or: mockOr,
				}),
			});

			await User.search("test", 5);

			expect(mockLimit).toHaveBeenCalledWith(5);
		});
	});

	describe("User.getFollowerCount", () => {
		it("should get follower count correctly", async () => {
			const mockCount = 42;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ count: mockCount, error: null }),
				}),
			});

			const result = await User.getFollowerCount("user-123");

			expect(result).toBe(42);
			expect(mockSupabase.from).toHaveBeenCalledWith("follows");
		});

		it("should handle zero followers", async () => {
			const mockCount = 0;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ count: mockCount, error: null }),
				}),
			});

			const result = await User.getFollowerCount("user-123");

			expect(result).toBe(0);
		});

		it("should validate user ID", async () => {
			await expect(User.getFollowerCount()).rejects.toThrow(
				"User ID is required"
			);
		});
	});

	describe("User.getFollowingCount", () => {
		it("should get following count correctly", async () => {
			const mockCount = 15;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ count: mockCount, error: null }),
				}),
			});

			const result = await User.getFollowingCount("user-123");

			expect(result).toBe(15);
		});

		it("should validate user ID", async () => {
			await expect(User.getFollowingCount()).rejects.toThrow(
				"User ID is required"
			);
		});
	});

	describe("User.isFollowing", () => {
		it("should return true when user is following", async () => {
			const mockFollow = { id: "follow-123" };

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest
								.fn()
								.mockResolvedValue({ data: mockFollow, error: null }),
						}),
					}),
				}),
			});

			const result = await User.isFollowing("user-1", "user-2");

			expect(result).toBe(true);
		});

		it("should return false when user is not following", async () => {
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

			const result = await User.isFollowing("user-1", "user-2");

			expect(result).toBe(false);
		});

		it("should validate user IDs", async () => {
			await expect(User.isFollowing()).rejects.toThrow(
				"Both user IDs are required"
			);
			await expect(User.isFollowing("user-1")).rejects.toThrow(
				"Both user IDs are required"
			);
		});
	});

	describe("Validation helpers", () => {
		it("should validate email format correctly", () => {
			expect(() => User._validateEmail("valid@example.com")).not.toThrow();
			expect(() => User._validateEmail("user+tag@domain.co.uk")).not.toThrow();

			expect(() => User._validateEmail("invalid-email")).toThrow(
				"Invalid email format"
			);
			expect(() => User._validateEmail("@example.com")).toThrow(
				"Invalid email format"
			);
			expect(() => User._validateEmail("user@")).toThrow(
				"Invalid email format"
			);
		});

		it("should validate username format correctly", () => {
			expect(() => User._validateUsername("validuser")).not.toThrow();
			expect(() => User._validateUsername("user_123")).not.toThrow();
			expect(() => User._validateUsername("User123")).not.toThrow();

			expect(() => User._validateUsername("invalid user")).toThrow(
				"Username can only contain letters, numbers, and underscores"
			);
			expect(() => User._validateUsername("user@name")).toThrow(
				"Username can only contain letters, numbers, and underscores"
			);
			expect(() => User._validateUsername("user-name")).toThrow(
				"Username can only contain letters, numbers, and underscores"
			);
		});
	});

	describe("Error handling", () => {
		it("should handle unexpected Supabase errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: { message: "Unexpected error", code: "UNKNOWN" },
						}),
					}),
				}),
			});

			await expect(User.findById("user-123")).rejects.toThrow("Database error");
		});

		it("should handle network errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Network timeout")),
					}),
				}),
			});

			await expect(User.findById("user-123")).rejects.toThrow(
				"Unexpected error"
			);
		});
	});

	describe("Integration scenarios", () => {
		it("should handle complete user lifecycle", async () => {
			const userData = {
				username: "lifecycleuser",
				email: "lifecycle@example.com",
				display_name: "Lifecycle User",
			};

			// Create user
			const createdUser = { id: "lifecycle-user", ...userData };
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest
						.fn()
						.mockResolvedValue({ data: [createdUser], error: null }),
				}),
			});

			const user = await User.create(userData);
			expect(user.id).toBe("lifecycle-user");

			// Update user
			const updateData = { bio: "Updated bio" };
			const updatedUser = { ...createdUser, ...updateData };
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						select: jest
							.fn()
							.mockResolvedValue({ data: [updatedUser], error: null }),
					}),
				}),
			});

			const updated = await User.update(user.id, updateData);
			expect(updated.bio).toBe("Updated bio");

			// Delete user
			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			const deleted = await User.delete(user.id);
			expect(deleted).toBe(true);
		});
	});
});
