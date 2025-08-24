/**
 * Passport Configuration Tests
 * Tests Passport.js setup, strategies, and authentication flow
 */

const { setupTestEnvironment } = require("../helpers/testEnv");
setupTestEnvironment();

const User = require("../../src/models/user");

// Mock dependencies directly in jest.mock calls to avoid hoisting issues
jest.mock("passport", () => ({
	use: jest.fn(),
	serializeUser: jest.fn(),
	deserializeUser: jest.fn(),
}));

jest.mock("passport-google-oauth20", () => ({
	Strategy: jest.fn(),
}));

jest.mock("passport-apple", () => jest.fn());

// Mock supabase
jest.mock("../../src/config/supabase", () => ({
	supabase: {
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: null }),
		})),
		insert: jest.fn(() => ({
			select: jest.fn(() => ({
				single: jest.fn(() =>
					Promise.resolve({ data: { id: "test-id" }, error: null })
				),
			})),
		})),
		update: jest.fn(() => ({
			eq: jest.fn(() => Promise.resolve({ error: null })),
		})),
	}),
}));

describe("Passport Configuration", () => {
	let consoleSpy;
	let passport;
	let GoogleStrategy;
	let mockSupabase;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		// Reset environment variables
		delete process.env.GOOGLE_CLIENT_ID;
		delete process.env.GOOGLE_CLIENT_SECRET;
		delete process.env.APPLE_CLIENT_ID;
		delete process.env.APPLE_TEAM_ID;
		delete process.env.APPLE_KEY_ID;
		delete process.env.APPLE_PRIVATE_KEY;
		delete process.env.BACKEND_URL;
		delete process.env.NODE_ENV;

		// Mock console methods
		consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
		jest.spyOn(console, "log").mockImplementation(() => {});

		// Get references to mocked modules
		passport = require("passport");
		GoogleStrategy = require("passport-google-oauth20").Strategy;
		const { supabase: mockSupabase } = require("../../src/config/supabase");
	});

	afterEach(() => {
		consoleSpy.mockRestore();
		jest.restoreAllMocks();
	});

	describe("Strategy Configuration", () => {
		it("should configure Google strategy when credentials are provided", () => {
			process.env.GOOGLE_CLIENT_ID = "test-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

			const passportConfig = require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					clientID: "test-client-id",
					clientSecret: "test-client-secret",
					callbackURL: "http://localhost:3000/api/auth/google/callback",
					scope: ["profile", "email"],
				}),
				expect.any(Function)
			);

			expect(passport.use).toHaveBeenCalled();
		});

		it("should not configure Google strategy when credentials are missing", () => {
			const passportConfig = require("../../src/config/passport");

			expect(GoogleStrategy).not.toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Google authentication not configured - missing environment variables"
			);
		});

		it("should set up serialization and deserialization", () => {
			const passportConfig = require("../../src/config/passport");

			expect(passport.serializeUser).toHaveBeenCalledWith(expect.any(Function));
			expect(passport.deserializeUser).toHaveBeenCalledWith(
				expect.any(Function)
			);
		});
	});

	describe("Callback URL Generation", () => {
		it("should use production URL in production environment", () => {
			process.env.NODE_ENV = "production";
			process.env.GOOGLE_CLIENT_ID = "test-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					callbackURL:
						"https://ripply-backend.onrender.com/api/auth/google/callback",
				}),
				expect.any(Function)
			);
		});

		it("should use development URL in development environment", () => {
			process.env.NODE_ENV = "development";
			process.env.GOOGLE_CLIENT_ID = "test-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					callbackURL: "http://localhost:3000/api/auth/google/callback",
				}),
				expect.any(Function)
			);
		});

		it("should use custom backend URL when provided", () => {
			process.env.BACKEND_URL = "https://custom-api.example.com";
			process.env.GOOGLE_CLIENT_ID = "test-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

			require("../../src/config/passport");

			expect(GoogleStrategy).toHaveBeenCalledWith(
				expect.objectContaining({
					callbackURL:
						"https://custom-api.example.com/api/auth/google/callback",
				}),
				expect.any(Function)
			);
		});
	});

	describe("Module Export", () => {
		it("should export passport instance", () => {
			const passportConfig = require("../../src/config/passport");
			expect(passportConfig).toBe(passport);
		});
	});

	describe("Error Handling", () => {
		it("should handle missing Google credentials gracefully", () => {
			// Ensure no Google credentials are set
			delete process.env.GOOGLE_CLIENT_ID;
			delete process.env.GOOGLE_CLIENT_SECRET;

			const passportConfig = require("../../src/config/passport");

			expect(GoogleStrategy).not.toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith(
				"Google authentication not configured - missing environment variables"
			);
		});

		it("should not throw when initializing without credentials", () => {
			expect(() => {
				require("../../src/config/passport");
			}).not.toThrow();
		});
	});

	describe("Function Configuration", () => {
		it("should register serialization function that extracts user ID", () => {
			const passportConfig = require("../../src/config/passport");

			expect(passport.serializeUser).toHaveBeenCalledWith(expect.any(Function));

			// Test the serialization function
			const serializeCall = passport.serializeUser.mock.calls[0];
			const serializeFunction = serializeCall[0];

			const mockDone = jest.fn();
			const testUser = { id: "test-user-id", email: "test@example.com" };

			serializeFunction(testUser, mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, "test-user-id");
		});

		it("should register deserialization function", async () => {
			const passportConfig = require("../../src/config/passport");

			expect(passport.deserializeUser).toHaveBeenCalledWith(
				expect.any(Function)
			);

			// Test the deserialization function
			const deserializeCall = passport.deserializeUser.mock.calls[0];
			const deserializeFunction = deserializeCall[0];

			const mockDone = jest.fn();
			const testUserId = "test-user-id";

			// Mock supabase response for deserialize
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(() =>
							Promise.resolve({
								data: {
									id: testUserId,
									email: "test@example.com",
									password: "secret",
								},
								error: null,
							})
						),
					})),
				})),
			});

			await deserializeFunction(testUserId, mockDone);

			expect(mockDone).toHaveBeenCalledWith(null, {
				id: testUserId,
				email: "test@example.com",
				// password should be removed
			});
		});
	});
});
