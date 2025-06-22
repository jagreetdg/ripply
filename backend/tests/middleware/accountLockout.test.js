/**
 * Account Lockout Middleware Tests
 * Tests rate limiting and account lockout functionality
 */

const {
	isAccountLocked,
	recordFailedAttempt,
	resetFailedAttempts,
	getFailedAttempts,
} = require("../../src/middleware/accountLockout");

// Mock the dependencies
jest.mock("../../src/config/supabase");
const mockSupabase = require("../../src/config/supabase");

describe("Account Lockout Middleware", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("isAccountLocked", () => {
		it("should return false for email with no failed attempts", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(false);
		});

		it("should return false for account with failed attempts below threshold", async () => {
			const attemptData = {
				email: "test@example.com",
				failed_attempts: 3,
				last_failed_attempt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: attemptData, error: null }),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(false);
		});

		it("should return true for account with 5+ failed attempts within lockout period", async () => {
			const attemptData = {
				email: "test@example.com",
				failed_attempts: 5,
				last_failed_attempt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: attemptData, error: null }),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(true);
		});

		it("should return false for account with 5+ failed attempts outside lockout period", async () => {
			const attemptData = {
				email: "test@example.com",
				failed_attempts: 5,
				last_failed_attempt: new Date(
					Date.now() - 2 * 60 * 60 * 1000
				).toISOString(), // 2 hours ago
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: attemptData, error: null }),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(false);
		});

		it("should handle database errors gracefully", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(false); // Default to not locked on error
		});
	});

	describe("recordFailedAttempt", () => {
		it("should create new record for first failed attempt", async () => {
			const email = "test@example.com";

			// Mock no existing record
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			// Mock insert new record
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockResolvedValue({ error: null }),
			});

			const result = await recordFailedAttempt(email);
			expect(result).toBe(false); // Not locked after first attempt
		});

		it("should increment existing record", async () => {
			const email = "test@example.com";
			const existingRecord = {
				id: "record-123",
				email,
				failed_attempts: 2,
				last_failed_attempt: new Date(
					Date.now() - 10 * 60 * 1000
				).toISOString(), // 10 minutes ago
			};

			// Mock existing record
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: existingRecord, error: null }),
					}),
				}),
			});

			// Mock update record
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			const result = await recordFailedAttempt(email);
			expect(result).toBe(false); // Not locked after 3rd attempt
		});

		it("should return true when account becomes locked (5th attempt)", async () => {
			const email = "test@example.com";
			const existingRecord = {
				id: "record-123",
				email,
				failed_attempts: 4,
				last_failed_attempt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 minute ago
			};

			// Mock existing record
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: existingRecord, error: null }),
					}),
				}),
			});

			// Mock update record
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			const result = await recordFailedAttempt(email);
			expect(result).toBe(true); // Locked after 5th attempt
		});

		it("should reset counter if last attempt was outside window", async () => {
			const email = "test@example.com";
			const existingRecord = {
				id: "record-123",
				email,
				failed_attempts: 3,
				last_failed_attempt: new Date(
					Date.now() - 2 * 60 * 60 * 1000
				).toISOString(), // 2 hours ago
			};

			// Mock existing record
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: existingRecord, error: null }),
					}),
				}),
			});

			// Mock update record (should reset to 1)
			const mockUpdate = jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			});
			mockSupabase.from.mockReturnValueOnce({
				update: mockUpdate,
			});

			const result = await recordFailedAttempt(email);

			// Verify that failed_attempts was set to 1 (reset)
			expect(mockUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					failed_attempts: 1,
				})
			);
			expect(result).toBe(false);
		});

		it("should handle database errors gracefully", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			const result = await recordFailedAttempt("test@example.com");
			expect(result).toBe(false); // Default to not locked on error
		});
	});

	describe("resetFailedAttempts", () => {
		it("should reset failed attempts for existing record", async () => {
			const email = "test@example.com";

			// Mock existing record
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: { id: "record-123", email },
							error: null,
						}),
					}),
				}),
			});

			// Mock update record - capture the update function
			const mockUpdate = jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			});
			mockSupabase.from.mockReturnValueOnce({
				update: mockUpdate,
			});

			await resetFailedAttempts(email);

			expect(mockUpdate).toHaveBeenCalledWith({
				failed_attempts: 0,
				last_failed_attempt: null,
			});
		});

		it("should do nothing if no record exists", async () => {
			const email = "test@example.com";

			// Mock no existing record
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			await resetFailedAttempts(email);

			// Should not call update if no record exists
			expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only the select call
		});

		it("should handle database errors gracefully", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			// Should not throw
			await expect(
				resetFailedAttempts("test@example.com")
			).resolves.toBeUndefined();
		});
	});

	describe("getFailedAttempts", () => {
		it("should return failed attempts count for existing record", async () => {
			const email = "test@example.com";
			const attemptData = {
				email,
				failed_attempts: 3,
				last_failed_attempt: new Date().toISOString(),
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: attemptData, error: null }),
					}),
				}),
			});

			const result = await getFailedAttempts(email);
			expect(result).toBe(3);
		});

		it("should return 0 for non-existing record", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
					}),
				}),
			});

			const result = await getFailedAttempts("test@example.com");
			expect(result).toBe(0);
		});

		it("should handle database errors gracefully", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockRejectedValue(new Error("Database error")),
					}),
				}),
			});

			const result = await getFailedAttempts("test@example.com");
			expect(result).toBe(0); // Default to 0 on error
		});
	});

	describe("Lockout Parameters", () => {
		it("should use correct lockout thresholds", async () => {
			// Test the lockout threshold (should be 5 attempts)
			const attemptData = {
				email: "test@example.com",
				failed_attempts: 4,
				last_failed_attempt: new Date().toISOString(),
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: attemptData, error: null }),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(false); // 4 attempts should not lock

			// Test with 5 attempts
			attemptData.failed_attempts = 5;
			const result2 = await isAccountLocked("test@example.com");
			expect(result2).toBe(true); // 5 attempts should lock
		});

		it("should use correct lockout duration (1 hour)", async () => {
			const attemptData = {
				email: "test@example.com",
				failed_attempts: 5,
				last_failed_attempt: new Date(
					Date.now() - 61 * 60 * 1000
				).toISOString(), // 61 minutes ago
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest
							.fn()
							.mockResolvedValue({ data: attemptData, error: null }),
					}),
				}),
			});

			const result = await isAccountLocked("test@example.com");
			expect(result).toBe(false); // Should be unlocked after 1 hour
		});
	});
});
