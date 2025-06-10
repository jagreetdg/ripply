/**
 * Email Verification Routes Tests
 * Tests all email verification functionality
 */

const request = require("supertest");
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");
jest.mock("../../src/middleware/auth");

const mockSupabase = require("../../src/config/supabase");
const mockAuth = require("../../src/middleware/auth");

// Setup Express app with verification routes
const app = express();
app.use(express.json());
app.use(require("../../src/routes/verification"));

describe("Email Verification Routes", () => {
	let testDb;
	let mockUser;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		mockUser = {
			id: "user-123",
			email: "test@example.com",
			username: "testuser",
			is_verified: false,
		};

		// Mock authenticateToken middleware to pass through with user
		mockAuth.authenticateToken.mockImplementation((req, res, next) => {
			req.user = mockUser;
			next();
		});
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("POST /request-verification", () => {
		it("should request verification successfully for unverified user", async () => {
			// Mock verification token storage
			mockSupabase.from.mockReturnValue({
				upsert: jest.fn().mockResolvedValue({ error: null }),
			});

			const response = await request(app)
				.post("/request-verification")
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Verification email sent"
			);
			expect(response.body).toHaveProperty("debug");
			expect(response.body.debug).toHaveProperty("verificationToken");
			expect(response.body.debug).toHaveProperty("verificationUrl");
		});

		it("should reject verification request for already verified user", async () => {
			// Mock verified user
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				req.user = { ...mockUser, is_verified: true };
				next();
			});

			const response = await request(app)
				.post("/request-verification")
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"User is already verified"
			);
		});

		it("should reject verification request without authentication", async () => {
			// Mock authentication failure
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				res.status(401).json({ message: "Authentication required" });
			});

			const response = await request(app)
				.post("/request-verification")
				.expect(401);

			expect(response.body).toHaveProperty(
				"message",
				"Authentication required"
			);
		});

		it("should handle database errors gracefully", async () => {
			// Mock database error
			mockSupabase.from.mockReturnValue({
				upsert: jest
					.fn()
					.mockResolvedValue({ error: { message: "Database error" } }),
			});

			const response = await request(app)
				.post("/request-verification")
				.expect(500);

			expect(response.body).toHaveProperty("message", "Server error");
		});

		it("should generate secure verification token", async () => {
			let capturedToken;

			// Mock token storage and capture the token
			mockSupabase.from.mockReturnValue({
				upsert: jest.fn().mockImplementation((data) => {
					capturedToken = data.token;
					return Promise.resolve({ error: null });
				}),
			});

			await request(app).post("/request-verification").expect(200);

			// Verify token is generated and has proper length (64 hex chars)
			expect(capturedToken).toBeDefined();
			expect(capturedToken).toMatch(/^[a-f0-9]{64}$/);
		});

		it("should set proper token expiration (24 hours)", async () => {
			let capturedExpiry;
			const testStartTime = Date.now();

			// Mock token storage and capture the expiry
			mockSupabase.from.mockReturnValue({
				upsert: jest.fn().mockImplementation((data) => {
					capturedExpiry = new Date(data.expires_at).getTime();
					return Promise.resolve({ error: null });
				}),
			});

			await request(app).post("/request-verification").expect(200);

			// Verify expiry is approximately 24 hours from now (within 1 minute tolerance)
			const expectedExpiry = testStartTime + 24 * 60 * 60 * 1000; // 24 hours
			const timeDiff = Math.abs(capturedExpiry - expectedExpiry);
			expect(timeDiff).toBeLessThan(60 * 1000); // Within 1 minute
		});
	});

	describe("GET /verify-email", () => {
		it("should verify email with valid token", async () => {
			const token = "valid-verification-token";
			const mockVerificationRecord = {
				user_id: mockUser.id,
				token: token,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid for 24 hours
			};

			// Mock valid verification token
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockVerificationRecord, error: null }),
					}),
				}),
			});

			// Mock user verification update
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
				.get(`/verify-email?token=${token}`)
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Email verified successfully"
			);
			expect(response.body).toHaveProperty("verified", true);
		});

		it("should reject verification without token", async () => {
			const response = await request(app).get("/verify-email").expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Verification token is required"
			);
		});

		it("should reject invalid verification token", async () => {
			const token = "invalid-token";

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
				.get(`/verify-email?token=${token}`)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Invalid or expired verification token"
			);
		});

		it("should reject expired verification token", async () => {
			const token = "expired-token";
			const mockExpiredRecord = {
				user_id: mockUser.id,
				token: token,
				expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired 24 hours ago
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
				.get(`/verify-email?token=${token}`)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Invalid or expired verification token"
			);
		});

		it("should handle user update errors", async () => {
			const token = "valid-token";
			const mockVerificationRecord = {
				user_id: mockUser.id,
				token: token,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			};

			// Mock valid verification token
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockVerificationRecord, error: null }),
					}),
				}),
			});

			// Mock user update error
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ error: { message: "Update error" } }),
				}),
			});

			const response = await request(app)
				.get(`/verify-email?token=${token}`)
				.expect(500);

			expect(response.body).toHaveProperty("message", "Server error");
		});
	});

	describe("GET /verify-token/:token", () => {
		it("should verify valid verification token", async () => {
			const token = "valid-token";
			const mockVerificationRecord = {
				user_id: mockUser.id,
				token: token,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockVerificationRecord, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.get(`/verify-token/${token}`)
				.expect(200);

			expect(response.body).toEqual({ valid: true });
		});

		it("should reject invalid verification token", async () => {
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
				.get(`/verify-token/${token}`)
				.expect(200);

			expect(response.body).toEqual({ valid: false });
		});

		it("should reject expired verification token", async () => {
			const token = "expired-token";
			const mockExpiredRecord = {
				user_id: mockUser.id,
				token: token,
				expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
				.get(`/verify-token/${token}`)
				.expect(200);

			expect(response.body).toEqual({ valid: false });
		});
	});

	describe("POST /resend-verification", () => {
		it("should resend verification for unverified user", async () => {
			// Mock verification token storage
			mockSupabase.from.mockReturnValue({
				upsert: jest.fn().mockResolvedValue({ error: null }),
			});

			const response = await request(app)
				.post("/resend-verification")
				.expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Verification email sent"
			);
		});

		it("should reject resend for already verified user", async () => {
			// Mock verified user
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				req.user = { ...mockUser, is_verified: true };
				next();
			});

			const response = await request(app)
				.post("/resend-verification")
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"User is already verified"
			);
		});
	});

	describe("Authentication Integration", () => {
		it("should require authentication for request-verification", async () => {
			// Mock authentication failure
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				res.status(401).json({ message: "Authentication required" });
			});

			const response = await request(app)
				.post("/request-verification")
				.expect(401);

			expect(response.body).toHaveProperty(
				"message",
				"Authentication required"
			);
		});

		it("should require authentication for resend-verification", async () => {
			// Mock authentication failure
			mockAuth.authenticateToken.mockImplementation((req, res, next) => {
				res.status(401).json({ message: "Authentication required" });
			});

			const response = await request(app)
				.post("/resend-verification")
				.expect(401);

			expect(response.body).toHaveProperty(
				"message",
				"Authentication required"
			);
		});
	});

	describe("Security Features", () => {
		it("should only allow one valid token per user at a time", async () => {
			let tokenStorageCallCount = 0;

			// Mock token storage to track calls
			mockSupabase.from.mockReturnValue({
				upsert: jest.fn().mockImplementation((data) => {
					tokenStorageCallCount++;
					return Promise.resolve({ error: null });
				}),
			});

			// Request verification twice
			await request(app).post("/request-verification").expect(200);
			await request(app).post("/request-verification").expect(200);

			// Should have called upsert twice (replacing the old token)
			expect(tokenStorageCallCount).toBe(2);
		});

		it("should delete token after successful verification", async () => {
			const token = "valid-token";
			const mockVerificationRecord = {
				user_id: mockUser.id,
				token: token,
				expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			};

			let deleteCallCount = 0;

			// Mock valid verification token
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockVerificationRecord, error: null }),
					}),
				}),
			});

			// Mock user verification update
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			// Mock token deletion
			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockImplementation(() => {
					deleteCallCount++;
					return {
						eq: jest.fn().mockResolvedValue({ error: null }),
					};
				}),
			});

			await request(app).get(`/verify-email?token=${token}`).expect(200);

			expect(deleteCallCount).toBe(1);
		});
	});
});
