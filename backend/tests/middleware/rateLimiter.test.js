/**
 * Rate Limiter Middleware Tests
 * Tests all rate limiting functionality
 */

const rateLimiter = require("../../src/middleware/rateLimiter");

describe("Rate Limiter Middleware", () => {
	let mockReq, mockRes, mockNext;

	beforeEach(() => {
		jest.clearAllMocks();

		mockReq = {
			headers: {},
			connection: { remoteAddress: "127.0.0.1" },
		};

		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			setHeader: jest.fn(),
		};

		mockNext = jest.fn();

		// Clear the in-memory rate limit store
		const rateLimiterModule = require("../../src/middleware/rateLimiter");
		// Reset the internal rate limit store if it's exposed
	});

	describe("Basic Rate Limiting", () => {
		it("should allow requests within the limit", async () => {
			const limiter = rateLimiter(5, 60000); // 5 requests per minute

			// Make 3 requests (within limit)
			for (let i = 0; i < 3; i++) {
				limiter(mockReq, mockRes, mockNext);
			}

			expect(mockNext).toHaveBeenCalledTimes(3);
			expect(mockRes.status).not.toHaveBeenCalled();
			expect(mockRes.json).not.toHaveBeenCalled();
		});

		it("should block requests exceeding the limit", async () => {
			const limiter = rateLimiter(3, 60000); // 3 requests per minute

			// Make 3 requests (at limit)
			for (let i = 0; i < 3; i++) {
				limiter(mockReq, mockRes, mockNext);
			}

			// 4th request should be blocked
			limiter(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledTimes(3);
			expect(mockRes.status).toHaveBeenCalledWith(429);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Too many attempts, please try again later",
				retryAfter: expect.any(Number),
			});
		});

		it("should use custom error message", async () => {
			const customMessage = "Custom rate limit exceeded";
			const limiter = rateLimiter(1, 60000, customMessage);

			// First request should pass
			limiter(mockReq, mockRes, mockNext);
			expect(mockNext).toHaveBeenCalledTimes(1);

			// Second request should be blocked with custom message
			limiter(mockReq, mockRes, mockNext);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: customMessage,
				retryAfter: expect.any(Number),
			});
		});
	});

	describe("IP Address Handling", () => {
		it("should handle different IP addresses separately", async () => {
			const limiter = rateLimiter(2, 60000);

			// First IP
			mockReq.connection.remoteAddress = "192.168.1.1";
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockRes.status).toHaveBeenCalledWith(429);
			mockRes.status.mockClear();
			mockRes.json.mockClear();

			// Second IP should have its own limit
			mockReq.connection.remoteAddress = "192.168.1.2";
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext);

			expect(mockRes.status).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledTimes(4); // 2 from first IP + 2 from second IP
		});

		it("should handle X-Forwarded-For header for proxied requests", async () => {
			const limiter = rateLimiter(1, 60000);

			mockReq.headers["x-forwarded-for"] = "203.0.113.1";
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockNext).toHaveBeenCalledTimes(1);
			expect(mockRes.status).toHaveBeenCalledWith(429);
		});

		it("should prioritize X-Forwarded-For over connection.remoteAddress", async () => {
			const limiter = rateLimiter(1, 60000);

			mockReq.headers["x-forwarded-for"] = "203.0.113.1";
			mockReq.connection.remoteAddress = "192.168.1.1";

			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockNext).toHaveBeenCalledTimes(1);
			expect(mockRes.status).toHaveBeenCalledWith(429);

			// Clear status for next test
			mockRes.status.mockClear();
			mockRes.json.mockClear();
			mockNext.mockClear();

			// Request from direct IP should still be allowed
			mockReq.headers["x-forwarded-for"] = undefined;
			limiter(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledTimes(1);
			expect(mockRes.status).not.toHaveBeenCalled();
		});
	});

	describe("Time Window Behavior", () => {
		it("should reset count after time window expires", async () => {
			const limiter = rateLimiter(2, 100); // 2 requests per 100ms

			// Use up the limit
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockNext).toHaveBeenCalledTimes(2);
			expect(mockRes.status).toHaveBeenCalledWith(429);

			// Wait for window to reset
			await new Promise((resolve) => setTimeout(resolve, 150));

			mockNext.mockClear();
			mockRes.status.mockClear();

			// Should be allowed again
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledTimes(2);
			expect(mockRes.status).not.toHaveBeenCalled();
		});

		it("should maintain count within time window", async () => {
			const limiter = rateLimiter(3, 1000); // 3 requests per second

			// Make 2 requests
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledTimes(2);

			// Wait less than the window
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Should still be counted towards the same window
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockNext).toHaveBeenCalledTimes(3);
			expect(mockRes.status).toHaveBeenCalledWith(429);
		});
	});

	describe("Response Headers", () => {
		it("should set correct rate limit headers", async () => {
			const limiter = rateLimiter(5, 60000);

			limiter(mockReq, mockRes, mockNext);

			expect(mockRes.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 5);
			expect(mockRes.setHeader).toHaveBeenCalledWith(
				"X-RateLimit-Remaining",
				4
			);
			expect(mockRes.setHeader).toHaveBeenCalledWith(
				"X-RateLimit-Reset",
				expect.any(Number)
			);
		});

		it("should update remaining count with each request", async () => {
			const limiter = rateLimiter(3, 60000);

			// First request
			limiter(mockReq, mockRes, mockNext);
			expect(mockRes.setHeader).toHaveBeenCalledWith(
				"X-RateLimit-Remaining",
				2
			);

			mockRes.setHeader.mockClear();

			// Second request
			limiter(mockReq, mockRes, mockNext);
			expect(mockRes.setHeader).toHaveBeenCalledWith(
				"X-RateLimit-Remaining",
				1
			);

			mockRes.setHeader.mockClear();

			// Third request
			limiter(mockReq, mockRes, mockNext);
			expect(mockRes.setHeader).toHaveBeenCalledWith(
				"X-RateLimit-Remaining",
				0
			);
		});

		it("should include retryAfter in blocked response", async () => {
			const limiter = rateLimiter(1, 60000);

			// Use up the limit
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Too many attempts, please try again later",
				retryAfter: expect.any(Number),
			});

			const callArgs = mockRes.json.mock.calls[0][0];
			expect(callArgs.retryAfter).toBeGreaterThan(0);
			expect(callArgs.retryAfter).toBeLessThanOrEqual(60); // Should be in seconds
		});
	});

	describe("Configuration Options", () => {
		it("should use default values when not specified", async () => {
			const limiter = rateLimiter(); // No parameters

			// Should use defaults (5 attempts, 15 minutes, default message)
			for (let i = 0; i < 5; i++) {
				limiter(mockReq, mockRes, mockNext);
			}

			expect(mockNext).toHaveBeenCalledTimes(5);

			// 6th request should be blocked
			limiter(mockReq, mockRes, mockNext);
			expect(mockRes.status).toHaveBeenCalledWith(429);
			expect(mockRes.json).toHaveBeenCalledWith({
				message: "Too many attempts, please try again later",
				retryAfter: expect.any(Number),
			});
		});

		it("should handle edge case with zero attempts", async () => {
			const limiter = rateLimiter(0, 60000);

			limiter(mockReq, mockRes, mockNext);

			expect(mockNext).not.toHaveBeenCalled();
			expect(mockRes.status).toHaveBeenCalledWith(429);
		});

		it("should handle very short time windows", async () => {
			const limiter = rateLimiter(2, 1); // 1ms window

			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext);
			limiter(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockNext).toHaveBeenCalledTimes(2);
			expect(mockRes.status).toHaveBeenCalledWith(429);
		});
	});

	describe("Memory Management", () => {
		it("should clean up expired entries", async () => {
			const limiter = rateLimiter(1, 50); // Very short window

			// Different IPs to create multiple entries
			const ips = ["1.1.1.1", "2.2.2.2", "3.3.3.3"];

			for (const ip of ips) {
				mockReq.connection.remoteAddress = ip;
				limiter(mockReq, mockRes, mockNext);
			}

			expect(mockNext).toHaveBeenCalledTimes(3);

			// Wait for entries to expire
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Making new requests should work (entries should be cleaned up)
			for (const ip of ips) {
				mockReq.connection.remoteAddress = ip;
				limiter(mockReq, mockRes, mockNext);
			}

			expect(mockNext).toHaveBeenCalledTimes(6); // 3 + 3
		});
	});

	describe("Error Handling", () => {
		it("should handle missing IP address gracefully", async () => {
			const limiter = rateLimiter(5, 60000);

			mockReq.headers = {};
			mockReq.connection = {};

			// Should not throw error
			expect(() => {
				limiter(mockReq, mockRes, mockNext);
			}).not.toThrow();

			expect(mockNext).toHaveBeenCalledTimes(1);
		});

		it("should handle malformed headers gracefully", async () => {
			const limiter = rateLimiter(5, 60000);

			mockReq.headers["x-forwarded-for"] = null;

			expect(() => {
				limiter(mockReq, mockRes, mockNext);
			}).not.toThrow();

			expect(mockNext).toHaveBeenCalledTimes(1);
		});
	});

	describe("Multiple Instances", () => {
		it("should maintain separate state for different limiter instances", async () => {
			const limiter1 = rateLimiter(2, 60000);
			const limiter2 = rateLimiter(3, 60000);

			// Use up limiter1's limit
			limiter1(mockReq, mockRes, mockNext);
			limiter1(mockReq, mockRes, mockNext);
			limiter1(mockReq, mockRes, mockNext); // Should be blocked

			expect(mockNext).toHaveBeenCalledTimes(2);
			expect(mockRes.status).toHaveBeenCalledWith(429);

			mockNext.mockClear();
			mockRes.status.mockClear();

			// limiter2 should have its own limit
			limiter2(mockReq, mockRes, mockNext);
			limiter2(mockReq, mockRes, mockNext);
			limiter2(mockReq, mockRes, mockNext);

			expect(mockNext).toHaveBeenCalledTimes(3);
			expect(mockRes.status).not.toHaveBeenCalled();
		});
	});
});
