/**
 * Authentication Middleware Tests
 * Tests JWT token verification and user authentication
 */

const jwt = require("jsonwebtoken");
const {
	authenticateToken,
	requireVerified,
	requireAdmin,
} = require("../../src/middleware/auth");
const authMiddleware = require("../../src/middleware/auth");
const { TestDatabase } = require("../helpers/testDatabase");

// Ensure JWT_SECRET is available for tests
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is required for tests");
}

// Mock the dependencies
jest.mock("../../src/config/supabase");
const mockSupabase = require("../../src/config/supabase");

describe("Authentication Middleware", () => {
	let mockReq, mockRes, mockNext;

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			headers: {},
			cookies: {},
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};

		mockNext = jest.fn();
	});

	describe("authenticateToken", () => {
		it("should authenticate valid token from Authorization header", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				display_name: "Test User",
			};

			const token = jwt.sign(
				{ id: mockUser.id, email: mockUser.email, username: mockUser.username },
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			mockReq.headers.authorization = `Bearer ${token}`;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockReq.user).toEqual(mockUser);
			expect(mockNext).toHaveBeenCalled();
			expect(mockRes.status).not.toHaveBeenCalled();
		});

		it("should authenticate valid token from cookie", async () => {
			const mockUser = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				display_name: "Test User",
			};

			const token = jwt.sign(
				{ id: mockUser.id, email: mockUser.email, username: mockUser.username },
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			mockReq.cookies.auth_token = token;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUser, error: null }),
					}),
				}),
			});

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockReq.user).toEqual(mockUser);
			expect(mockNext).toHaveBeenCalled();
			expect(mockRes.status).not.toHaveBeenCalled();
		});

		it("should reject request without token", async () => {
			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Authentication required",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should reject invalid token", async () => {
			mockReq.headers.authorization = "Bearer invalid-token";

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid token" });
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should reject expired token", async () => {
			const expiredToken = jwt.sign(
				{ id: "user-123", email: "test@example.com", username: "testuser" },
				JWT_SECRET,
				{ expiresIn: "-1h" } // Expired 1 hour ago
			);

			mockReq.headers.authorization = `Bearer ${expiredToken}`;

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({ message: "Token expired" });
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should reject token for non-existent user", async () => {
			const token = jwt.sign(
				{
					id: "non-existent-user",
					email: "test@example.com",
					username: "testuser",
				},
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			mockReq.headers.authorization = `Bearer ${token}`;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid token" });
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should handle database errors", async () => {
			const token = jwt.sign(
				{ id: "user-123", email: "test@example.com", username: "testuser" },
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			mockReq.headers.authorization = `Bearer ${token}`;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(500);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Server error",
				error: "Database error",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should remove password from user object", async () => {
			const mockUserWithPassword = {
				id: "user-123",
				username: "testuser",
				email: "test@example.com",
				display_name: "Test User",
				password: "hashed-password", // This should be removed
			};

			const token = jwt.sign(
				{
					id: mockUserWithPassword.id,
					email: mockUserWithPassword.email,
					username: mockUserWithPassword.username,
				},
				JWT_SECRET,
				{ expiresIn: "1h" }
			);

			mockReq.headers.authorization = `Bearer ${token}`;

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: mockUserWithPassword, error: null }),
					}),
				}),
			});

			await authenticateToken(mockReq, mockRes, mockNext);

			expect(mockReq.user).not.toHaveProperty("password");
			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe("requireVerified", () => {
		it("should allow verified user to proceed", () => {
			mockReq.user = {
				id: "user-123",
				is_verified: true,
			};

			requireVerified(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockRes.status).not.toHaveBeenCalled();
		});

		it("should reject unverified user", () => {
			mockReq.user = {
				id: "user-123",
				is_verified: false,
			};

			requireVerified(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(403);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Account verification required",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should reject request without authenticated user", () => {
			requireVerified(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Authentication required",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("requireAdmin", () => {
		beforeEach(() => {
			mockReq.user = {
				id: "user-123",
				username: "testuser",
			};
		});

		it("should allow admin user to proceed", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: { role: "admin" },
								error: null,
							}),
						}),
					}),
				}),
			});

			await requireAdmin(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockRes.status).not.toHaveBeenCalled();
		});

		it("should reject non-admin user", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockResolvedValue({
								data: null,
								error: { code: "PGRST116" },
							}),
						}),
					}),
				}),
			});

			await requireAdmin(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(403);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Admin access required",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should reject request without authenticated user", async () => {
			mockReq.user = null;

			await requireAdmin(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(401);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Authentication required",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should handle database errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							single: jest.fn().mockRejectedValue(new Error("Database error")),
						}),
					}),
				}),
			});

			await requireAdmin(mockReq, mockRes, mockNext);

			expect(mockRes.status).toHaveBeenCalledWith(500);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Server error",
				error: "Database error",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});
	});
});
