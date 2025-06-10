/**
 * Password Reset Routes Tests
 * Tests all password reset and account recovery functionality
 */

const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");
jest.mock("../../src/middleware/rateLimiter");

const mockSupabase = require("../../src/config/supabase");
const mockRateLimiter = require("../../src/middleware/rateLimiter");

// Setup Express app with password reset routes
const app = express();
app.use(express.json());
app.use(require("../../src/routes/passwordReset"));

describe("Password Reset Routes", () => {
	let testDb;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock rate limiter to pass through
		mockRateLimiter.mockImplementation(() => (req, res, next) => next());
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("POST /request-reset", () => {
		it("should request password reset successfully for existing user", async () => {
			const email = "test@example.com";
			const mockUser = {
				id: "user-123",
				email: email,
			};

			// Mock user exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			// Mock password reset token storage
			mockSupabase.from.mockReturnValueOnce({
				upsert: jest.fn().mockResolvedValue({ error: null }),
			});

			const response = await request(app)
				.post("/request-reset")
				.send({ email })
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toContain(
				"you will receive a password reset link"
			);
		});

		it("should return success message even for non-existent email (security)", async () => {
			const email = "nonexistent@example.com";

			// Mock user doesn't exist
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			const response = await request(app)
				.post("/request-reset")
				.send({ email })
				.expect(200);

			expect(response.body).toHaveProperty("message");
			expect(response.body.message).toContain(
				"you will receive a password reset link"
			);
		});

		it("should reject request without email", async () => {
			const response = await request(app)
				.post("/request-reset")
				.send({})
				.expect(400);

			expect(response.body).toHaveProperty("message", "Email is required");
		});

		it("should reject request with invalid email format", async () => {
			const response = await request(app)
				.post("/request-reset")
				.send({ email: "invalid-email" })
				.expect(400);

			expect(response.body).toHaveProperty("message", "Invalid email format");
		});

		it("should handle database errors gracefully", async () => {
			const email = "test@example.com";

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockRejectedValue(new Error("Database error")),
				}),
			});

			const response = await request(app)
				.post("/request-reset")
				.send({ email })
				.expect(500);

			expect(response.body).toHaveProperty("message", "Server error");
		});

		it("should handle token storage errors", async () => {
			const email = "test@example.com";
			const mockUser = {
				id: "user-123",
				email: email,
			};

			// Mock user exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			// Mock token storage error
			mockSupabase.from.mockReturnValueOnce({
				upsert: jest
					.fn()
					.mockResolvedValue({ error: { message: "Storage error" } }),
			});

			const response = await request(app)
				.post("/request-reset")
				.send({ email })
				.expect(500);

			expect(response.body).toHaveProperty("message", "Server error");
		});
	});

	describe("POST /reset-password", () => {
		it("should reset password with valid token", async () => {
			const resetData = {
				token: "valid-reset-token",
				newPassword: "NewPassword123!",
			};

			const mockResetRecord = {
				user_id: "user-123",
				token: resetData.token,
				expires_at: new Date(Date.now() + 3600000).toISOString(), // Valid for 1 hour
			};

			// Mock valid reset token
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockResetRecord, error: null }),
					}),
				}),
			});

			// Mock password update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			// Mock token deletion
			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			const response = await request(app)
				.post("/reset-password")
				.send(resetData)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Password reset successfully"
			);
		});

		it("should reject password reset without token", async () => {
			const response = await request(app)
				.post("/reset-password")
				.send({ newPassword: "NewPassword123!" })
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Token and new password are required"
			);
		});

		it("should reject password reset without new password", async () => {
			const response = await request(app)
				.post("/reset-password")
				.send({ token: "some-token" })
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Token and new password are required"
			);
		});

		it("should reject weak password", async () => {
			const response = await request(app)
				.post("/reset-password")
				.send({
					token: "some-token",
					newPassword: "123", // Too weak
				})
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Password must be at least 8 characters long"
			);
		});

		it("should reject invalid reset token", async () => {
			const resetData = {
				token: "invalid-token",
				newPassword: "NewPassword123!",
			};

			// Mock invalid token
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			const response = await request(app)
				.post("/reset-password")
				.send(resetData)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Invalid or expired reset token"
			);
		});

		it("should reject expired reset token", async () => {
			const resetData = {
				token: "expired-token",
				newPassword: "NewPassword123!",
			};

			const mockExpiredRecord = {
				user_id: "user-123",
				token: resetData.token,
				expires_at: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
			};

			// Mock expired token
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockExpiredRecord, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.post("/reset-password")
				.send(resetData)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Invalid or expired reset token"
			);
		});
	});

	describe("GET /verify-reset-token/:token", () => {
		it("should verify valid reset token", async () => {
			const token = "valid-token";
			const mockResetRecord = {
				user_id: "user-123",
				token: token,
				expires_at: new Date(Date.now() + 3600000).toISOString(),
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockResetRecord, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.get(`/verify-reset-token/${token}`)
				.expect(200);

			expect(response.body).toEqual({ valid: true });
		});

		it("should reject invalid reset token", async () => {
			const token = "invalid-token";

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			const response = await request(app)
				.get(`/verify-reset-token/${token}`)
				.expect(200);

			expect(response.body).toEqual({ valid: false });
		});

		it("should reject expired reset token", async () => {
			const token = "expired-token";
			const mockExpiredRecord = {
				user_id: "user-123",
				token: token,
				expires_at: new Date(Date.now() - 3600000).toISOString(),
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockExpiredRecord, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.get(`/verify-reset-token/${token}`)
				.expect(200);

			expect(response.body).toEqual({ valid: false });
		});
	});

	describe("Rate Limiting", () => {
		it("should apply rate limiting to request-reset endpoint", async () => {
			// Mock rate limiter to reject
			mockRateLimiter.mockImplementation(() => (req, res, next) => {
				res.status(429).json({
					message: "Too many password reset requests, please try again later",
				});
			});

			const app = express();
			app.use(express.json());
			app.use(require("../../src/routes/passwordReset"));

			const response = await request(app)
				.post("/request-reset")
				.send({ email: "test@example.com" })
				.expect(429);

			expect(response.body.message).toContain(
				"Too many password reset requests"
			);
		});
	});

	describe("Security Features", () => {
		it("should generate secure reset tokens", async () => {
			const email = "test@example.com";
			const mockUser = { id: "user-123", email };

			let capturedToken;

			// Mock user exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			// Mock token storage and capture the token
			mockSupabase.from.mockReturnValueOnce({
				upsert: jest.fn().mockImplementation((data) => {
					capturedToken = data.token;
					return Promise.resolve({ error: null });
				}),
			});

			await request(app).post("/request-reset").send({ email }).expect(200);

			// Verify token is generated and has proper length (64 hex chars)
			expect(capturedToken).toBeDefined();
			expect(capturedToken).toMatch(/^[a-f0-9]{64}$/);
		});

		it("should set proper token expiration (1 hour)", async () => {
			const email = "test@example.com";
			const mockUser = { id: "user-123", email };

			let capturedExpiry;
			const testStartTime = Date.now();

			// Mock user exists
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			// Mock token storage and capture the expiry
			mockSupabase.from.mockReturnValueOnce({
				upsert: jest.fn().mockImplementation((data) => {
					capturedExpiry = new Date(data.expires_at).getTime();
					return Promise.resolve({ error: null });
				}),
			});

			await request(app).post("/request-reset").send({ email }).expect(200);

			// Verify expiry is approximately 1 hour from now (within 1 minute tolerance)
			const expectedExpiry = testStartTime + 60 * 60 * 1000; // 1 hour
			const timeDiff = Math.abs(capturedExpiry - expectedExpiry);
			expect(timeDiff).toBeLessThan(60 * 1000); // Within 1 minute
		});
	});
});
