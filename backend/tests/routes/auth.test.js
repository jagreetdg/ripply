/**
 * Authentication Routes Tests
 * Tests all authentication functionality including registration, login, token verification
 */

const request = require("supertest");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");
jest.mock("../../src/middleware/accountLockout");
jest.mock("../../src/config/passport", () => ({
	_strategies: {},
}));

const mockSupabase = require("../../src/config/supabase");
const mockAccountLockout = require("../../src/middleware/accountLockout");

// Setup Express app with auth routes
const app = express();
app.use(express.json());
app.use(require("../../src/routes/auth"));

describe("Authentication Routes", () => {
	let testDb;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock default account lockout responses
		mockAccountLockout.isAccountLocked.mockResolvedValue(false);
		mockAccountLockout.recordFailedAttempt.mockResolvedValue(false);
		mockAccountLockout.resetFailedAttempts.mockResolvedValue(undefined);
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("POST /register", () => {
		it("should register a new user successfully", async () => {
			const newUser = {
				username: "testuser123",
				email: "test@example.com",
				password: "TestPassword123!",
				displayName: "Test User",
				timestamp: Date.now(),
			};

			// Mock Supabase responses
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { id: "user-123", ...newUser },
							error: null,
						}),
					}),
				}),
			});

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(201);

			expect(response.body).toHaveProperty(
				"message",
				"User registered successfully"
			);
			expect(response.body).toHaveProperty("user");
			expect(response.body).toHaveProperty("token");
			expect(response.body.user).not.toHaveProperty("password");
		});

		it("should reject registration with invalid email", async () => {
			const newUser = {
				username: "testuser123",
				email: "invalid-email",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(400);

			expect(response.body).toHaveProperty("message", "Invalid email format");
			expect(response.body).toHaveProperty("field", "email");
		});

		it("should reject registration with weak password", async () => {
			const newUser = {
				username: "testuser123",
				email: "test@example.com",
				password: "123",
				timestamp: Date.now(),
			};

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Password must be at least 8 characters long"
			);
			expect(response.body).toHaveProperty("field", "password");
		});

		it("should reject registration with invalid username", async () => {
			const newUser = {
				username: "ab", // Too short
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(400);

			expect(response.body.message).toContain(
				"Username must be 3-30 characters"
			);
			expect(response.body).toHaveProperty("field", "username");
		});

		it("should reject registration with existing username", async () => {
			const newUser = {
				username: "existinguser",
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			// Mock existing username
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({
							data: [{ id: "existing-user" }],
							error: null,
						}),
				}),
			});

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Username already exists"
			);
			expect(response.body).toHaveProperty("field", "username");
		});

		it("should reject registration with existing email", async () => {
			const newUser = {
				username: "testuser123",
				email: "existing@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			// Mock username check (no existing) then email check (existing)
			mockSupabase.from
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ data: [], error: null }), // No existing username
					}),
				})
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest
							.fn()
							.mockResolvedValue({
								data: [{ id: "existing-user" }],
								error: null,
							}), // Existing email
					}),
				});

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(400);

			expect(response.body).toHaveProperty("message", "Email already exists");
			expect(response.body).toHaveProperty("field", "email");
		});

		it("should reject registration with expired timestamp", async () => {
			const newUser = {
				username: "testuser123",
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
			};

			const response = await request(app)
				.post("/register")
				.send(newUser)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Request expired, please try again"
			);
		});
	});

	describe("POST /login", () => {
		it("should login successfully with valid credentials", async () => {
			const loginData = {
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			const hashedPassword = await bcrypt.hash(loginData.password, 10);
			const mockUser = {
				id: "user-123",
				email: loginData.email,
				username: "testuser",
				password: hashedPassword,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(200);

			expect(response.body).toHaveProperty("message", "Login successful");
			expect(response.body).toHaveProperty("user");
			expect(response.body).toHaveProperty("token");
			expect(response.body.user).not.toHaveProperty("password");
		});

		it("should reject login with invalid email format", async () => {
			const loginData = {
				email: "invalid-email",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(400);

			expect(response.body).toHaveProperty("message", "Invalid email format");
			expect(response.body).toHaveProperty("field", "email");
		});

		it("should reject login with non-existent email", async () => {
			const loginData = {
				email: "nonexistent@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(401);

			expect(response.body).toHaveProperty("message", "Invalid credentials");
			expect(mockAccountLockout.recordFailedAttempt).toHaveBeenCalledWith(
				loginData.email
			);
		});

		it("should reject login with wrong password", async () => {
			const loginData = {
				email: "test@example.com",
				password: "WrongPassword123!",
				timestamp: Date.now(),
			};

			const correctHashedPassword = await bcrypt.hash(
				"CorrectPassword123!",
				10
			);
			const mockUser = {
				id: "user-123",
				email: loginData.email,
				username: "testuser",
				password: correctHashedPassword,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(401);

			expect(response.body).toHaveProperty("message", "Invalid credentials");
			expect(mockAccountLockout.recordFailedAttempt).toHaveBeenCalledWith(
				loginData.email
			);
		});

		it("should reject login when account is locked", async () => {
			const loginData = {
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
			};

			mockAccountLockout.isAccountLocked.mockResolvedValue(true);

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(429);

			expect(response.body.message).toContain("Account temporarily locked");
		});

		it("should reject login with expired timestamp", async () => {
			const loginData = {
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
			};

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"Request expired, please try again"
			);
		});

		it("should handle rememberMe option correctly", async () => {
			const loginData = {
				email: "test@example.com",
				password: "TestPassword123!",
				timestamp: Date.now(),
				rememberMe: true,
			};

			const hashedPassword = await bcrypt.hash(loginData.password, 10);
			const mockUser = {
				id: "user-123",
				email: loginData.email,
				username: "testuser",
				password: hashedPassword,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [mockUser], error: null }),
				}),
			});

			const response = await request(app)
				.post("/login")
				.send(loginData)
				.expect(200);

			expect(response.body).toHaveProperty("token");

			// Verify the token has extended expiration
			const JWT_SECRET =
				process.env.JWT_SECRET ||
				require("crypto").randomBytes(64).toString("hex");
			const decoded = jwt.verify(response.body.token, JWT_SECRET);
			const tokenExp = decoded.exp * 1000; // Convert to milliseconds
			const now = Date.now();
			const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

			expect(tokenExp - now).toBeGreaterThan(thirtyDaysInMs - 60000); // Within 1 minute of 30 days
		});
	});

	describe("GET /verify-token", () => {
		it("should verify valid token successfully", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				username: "testuser",
				display_name: "Test User",
			};

			const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
			const token = jwt.sign(
				{ id: mockUser.id, email: mockUser.email, username: mockUser.username },
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			const response = await request(app)
				.get("/verify-token")
				.set("Authorization", `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty("message", "Token verified");
			expect(response.body).toHaveProperty("user");
			expect(response.body.user).not.toHaveProperty("password");
		});

		it("should reject request without token", async () => {
			const response = await request(app).get("/verify-token").expect(401);

			expect(response.body).toHaveProperty("message", "No token provided");
		});

		it("should reject invalid token", async () => {
			const response = await request(app)
				.get("/verify-token")
				.set("Authorization", "Bearer invalid-token")
				.expect(401);

			expect(response.body).toHaveProperty("message", "Invalid token");
		});

		it("should reject expired token", async () => {
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				username: "testuser",
			};

			const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
			const expiredToken = jwt.sign(
				{ id: mockUser.id, email: mockUser.email, username: mockUser.username },
				JWT_SECRET,
				{ expiresIn: "-1h" } // Expired 1 hour ago
			);

			const response = await request(app)
				.get("/verify-token")
				.set("Authorization", `Bearer ${expiredToken}`)
				.expect(401);

			expect(response.body).toHaveProperty("message", "Invalid token");
		});

		it("should reject token for non-existent user", async () => {
			const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
			const token = jwt.sign(
				{
					id: "non-existent-user",
					email: "test@example.com",
					username: "testuser",
				},
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

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
				.get("/verify-token")
				.set("Authorization", `Bearer ${token}`)
				.expect(401);

			expect(response.body).toHaveProperty("message", "Invalid token");
		});
	});

	describe("POST /logout", () => {
		it("should logout successfully", async () => {
			const response = await request(app).post("/logout").expect(200);

			expect(response.body).toHaveProperty(
				"message",
				"Logged out successfully"
			);
		});
	});

	describe("GET /check-username/:username", () => {
		it("should return available for non-existing username", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			const response = await request(app)
				.get("/check-username/newuser")
				.expect(200);

			expect(response.body).toEqual({
				exists: false,
				available: true,
			});
		});

		it("should return unavailable for existing username", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ data: [{ id: "user-123" }], error: null }),
				}),
			});

			const response = await request(app)
				.get("/check-username/existinguser")
				.expect(200);

			expect(response.body).toEqual({
				exists: true,
				available: false,
			});
		});
	});

	describe("GET /check-email/:email", () => {
		it("should return available for non-existing email", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			const response = await request(app)
				.get("/check-email/new@example.com")
				.expect(200);

			expect(response.body).toEqual({
				exists: false,
				available: true,
			});
		});

		it("should return unavailable for existing email", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ data: [{ id: "user-123" }], error: null }),
				}),
			});

			const response = await request(app)
				.get("/check-email/existing@example.com")
				.expect(200);

			expect(response.body).toEqual({
				exists: true,
				available: false,
			});
		});
	});
});
