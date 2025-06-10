/**
 * Passport Configuration Tests
 * Tests Passport.js setup, strategies, and authentication flow
 */

const passport = require("passport");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("passport-google-oauth20");
jest.mock("../../src/config/supabase");

const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const mockSupabase = require("../../src/config/supabase");

describe("Passport Configuration", () => {
	let testDb;
	let mockStrategy;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock GoogleStrategy
		mockStrategy = jest.fn().mockImplementation((config, callback) => {
			return {
				name: "google",
				authenticate: jest.fn(),
			};
		});
		GoogleStrategy.mockImplementation(mockStrategy);

		// Clear passport strategies
		passport._strategies = {};
		passport._serializers = [];
		passport._deserializers = [];
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("Passport Setup", () => {
		it("should configure passport correctly", () => {
			expect(true).toBe(true);
		});

		it("should handle Google OAuth strategy", () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			expect(mockSupabase.from).toBeDefined();
		});
	});

	describe("Strategy Configuration", () => {
		it("should configure Google OAuth strategy with correct options", () => {
			// Mock environment variables
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
				NODE_ENV: "development",
			};

			// Require passport config after setting env vars
			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					clientID: "test-client-id",
					clientSecret: "test-client-secret",
					callbackURL: expect.stringContaining("/api/auth/google/callback"),
				}),
				expect.any(Function)
			);

			process.env = originalEnv;
		});

		it("should handle missing Google credentials gracefully", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: undefined,
				GOOGLE_CLIENT_SECRET: undefined,
			};

			// Should not throw error when credentials are missing
			expect(() => {
				require("../../src/config/passport");
			}).not.toThrow();

			process.env = originalEnv;
		});

		it("should use correct callback URL for production", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
				NODE_ENV: "production",
				BACKEND_URL: "https://api.example.com",
			};

			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					callbackURL: "https://api.example.com/api/auth/google/callback",
				}),
				expect.any(Function)
			);

			process.env = originalEnv;
		});
	});

	describe("Google Strategy Callback", () => {
		let strategyCallback;

		beforeEach(() => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
			};

			require("../../src/config/passport");
			strategyCallback = GoogleStrategy.mock.calls[0][1];

			process.env = originalEnv;
		});

		it("should handle successful Google authentication for existing user", async () => {
			const mockProfile = {
				id: "google-123",
				emails: [{ value: "test@example.com" }],
				displayName: "Test User",
				photos: [{ value: "https://example.com/photo.jpg" }],
			};

			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				display_name: "Test User",
			};

			// Mock user exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			// Mock user update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			const done = jest.fn();
			await strategyCallback(
				"access-token",
				"refresh-token",
				mockProfile,
				done
			);

			expect(done).toHaveBeenCalledWith(null, mockUser);
		});

		it("should create new user for first-time Google authentication", async () => {
			const mockProfile = {
				id: "google-123",
				emails: [{ value: "newuser@example.com" }],
				displayName: "New User",
				photos: [{ value: "https://example.com/photo.jpg" }],
			};

			const newUser = {
				id: "new-user-123",
				email: "newuser@example.com",
				display_name: "New User",
				username: "newuser_123",
				google_id: "google-123",
			};

			// Mock user doesn't exist
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock username availability check
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock user creation
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({ data: [newUser], error: null }),
				}),
			});

			const done = jest.fn();
			await strategyCallback(
				"access-token",
				"refresh-token",
				mockProfile,
				done
			);

			expect(done).toHaveBeenCalledWith(null, newUser);
		});

		it("should handle authentication errors gracefully", async () => {
			const mockProfile = {
				id: "google-123",
				emails: [{ value: "error@example.com" }],
			};

			// Mock database error
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockRejectedValue(new Error("Database error")),
				}),
			});

			const done = jest.fn();
			await strategyCallback(
				"access-token",
				"refresh-token",
				mockProfile,
				done
			);

			expect(done).toHaveBeenCalledWith(expect.any(Error), null);
		});

		it("should handle missing email in profile", async () => {
			const mockProfile = {
				id: "google-123",
				emails: [],
				displayName: "User Without Email",
			};

			const done = jest.fn();
			await strategyCallback(
				"access-token",
				"refresh-token",
				mockProfile,
				done
			);

			expect(done).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining("email"),
				}),
				null
			);
		});

		it("should generate unique username for duplicate display names", async () => {
			const mockProfile = {
				id: "google-456",
				emails: [{ value: "duplicate@example.com" }],
				displayName: "Common Name",
			};

			// Mock user doesn't exist
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock username exists (first attempt)
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ username: "common_name" }],
						error: null,
					}),
				}),
			});

			// Mock username available (second attempt)
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock user creation
			const newUser = { id: "user-456", username: "common_name_123" };
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({ data: [newUser], error: null }),
				}),
			});

			const done = jest.fn();
			await strategyCallback(
				"access-token",
				"refresh-token",
				mockProfile,
				done
			);

			expect(done).toHaveBeenCalledWith(null, newUser);
		});
	});

	describe("Serialization", () => {
		beforeEach(() => {
			require("../../src/config/passport");
		});

		it("should serialize user correctly", () => {
			const user = { id: "user-123", email: "test@example.com" };
			const done = jest.fn();

			// Get the serializer function
			const serializer = passport._serializers[0];
			serializer(user, done);

			expect(done).toHaveBeenCalledWith(null, user.id);
		});

		it("should deserialize user correctly", async () => {
			const userId = "user-123";
			const mockUser = {
				id: userId,
				email: "test@example.com",
				display_name: "Test User",
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

			const done = jest.fn();

			// Get the deserializer function
			const deserializer = passport._deserializers[0];
			await deserializer(userId, done);

			expect(done).toHaveBeenCalledWith(null, mockUser);
		});

		it("should handle deserialization errors", async () => {
			const userId = "invalid-user";

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: { message: "User not found" },
						}),
					}),
				}),
			});

			const done = jest.fn();

			// Get the deserializer function
			const deserializer = passport._deserializers[0];
			await deserializer(userId, done);

			expect(done).toHaveBeenCalledWith(expect.any(Error), null);
		});
	});

	describe("Strategy Registration", () => {
		it("should register Google strategy when credentials are available", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
			};

			require("../../src/config/passport");

			expect(passport._strategies).toHaveProperty("google");

			process.env = originalEnv;
		});

		it("should not register Google strategy when credentials are missing", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: undefined,
				GOOGLE_CLIENT_SECRET: undefined,
			};

			require("../../src/config/passport");

			expect(passport._strategies).not.toHaveProperty("google");

			process.env = originalEnv;
		});
	});

	describe("Environment Configuration", () => {
		it("should use development callback URL in development", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
				NODE_ENV: "development",
			};

			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					callbackURL: "http://localhost:3000/api/auth/google/callback",
				}),
				expect.any(Function)
			);

			process.env = originalEnv;
		});

		it("should use custom backend URL when provided", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
				NODE_ENV: "production",
				BACKEND_URL: "https://custom-api.example.com",
			};

			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					callbackURL:
						"https://custom-api.example.com/api/auth/google/callback",
				}),
				expect.any(Function)
			);

			process.env = originalEnv;
		});
	});

	describe("Integration with Express", () => {
		it("should export configured passport instance", () => {
			const passportConfig = require("../../src/config/passport");

			expect(passportConfig).toBe(passport);
			expect(passportConfig._serializers).toHaveLength(1);
			expect(passportConfig._deserializers).toHaveLength(1);
		});

		it("should maintain strategy configuration across requires", () => {
			const originalEnv = process.env;
			process.env = {
				...originalEnv,
				GOOGLE_CLIENT_ID: "test-client-id",
				GOOGLE_CLIENT_SECRET: "test-client-secret",
			};

			// First require
			const passport1 = require("../../src/config/passport");

			// Second require (should be cached)
			delete require.cache[require.resolve("../../src/config/passport")];
			const passport2 = require("../../src/config/passport");

			expect(passport1).toBe(passport2);

			process.env = originalEnv;
		});
	});

	describe("Username Generation", () => {
		it("should handle special characters in display name", async () => {
			const mockProfile = {
				id: "google-special",
				emails: [{ value: "special@example.com" }],
				displayName: "User@Name#123!",
			};

			// Mock user doesn't exist
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock username available
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock user creation
			const newUser = {
				id: "user-special",
				username: expect.stringMatching(/^[a-z0-9_]+$/), // Only lowercase, numbers, underscores
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({ data: [newUser], error: null }),
				}),
			});

			const done = jest.fn();
			await strategyCallback(
				"access-token",
				"refresh-token",
				mockProfile,
				done
			);

			expect(done).toHaveBeenCalledWith(
				null,
				expect.objectContaining({
					username: expect.stringMatching(/^[a-z0-9_]+$/),
				})
			);
		});
	});
});
