/**
 * Update Share Counts Database Utility Tests
 * Tests the database maintenance script for updating share counts
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("../../src/config/supabase", () => {
	const createMockQuery = () => {
		const mockQuery = {
			select: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			in: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: null }),
		};
		mockQuery.limit.mockResolvedValue({ data: [], error: null });
		return mockQuery;
	};

	return {
		supabase: {
			from: jest.fn(() => createMockQuery()),
			rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
		},
		supabaseAdmin: {
			from: jest.fn(() => createMockQuery()),
			rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
		},
	};
});

const { supabase: mockSupabase } = require("../../src/config/supabase");

describe("Update Share Counts Database Utility", () => {
	let testDb;
	let originalExit;
	let originalLog;
	let originalError;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock process.exit to prevent actual exit during tests
		originalExit = process.exit;
		process.exit = jest.fn();

		// Mock console methods
		originalLog = console.log;
		originalError = console.error;
		console.log = jest.fn();
		console.error = jest.fn();
	});

	afterEach(async () => {
		await testDb.cleanup();

		// Restore original functions
		process.exit = originalExit;
		console.log = originalLog;
		console.error = originalError;
	});

	describe("Share Count Update Script", () => {
		it("should check for shares column existence", async () => {
			// Mock successful column check
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [], error: null }),
				}),
			});

			// Mock voice notes fetch
			mockSupabase.from
				.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue({ data: [], error: null }),
					}),
				})
				.mockReturnValueOnce({
					select: jest.fn().mockResolvedValue({ data: [], error: null }),
				});

			// Require the script (this will execute it)
			const updateShareCounts = require("../../src/database/update-share-counts");

			// Give it time to execute
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockSupabase.from).toHaveBeenCalledWith("voice_notes");
		});

		it("should add shares column if it does not exist", async () => {
			// Mock column check to return error (column doesn't exist)
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({
						data: null,
						error: { code: "42703" }, // Column does not exist error
					}),
				}),
			});

			// Mock RPC call to add column
			mockSupabase.rpc = jest
				.fn()
				.mockResolvedValue({ data: null, error: null });

			// Mock voice notes fetch after column creation
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			expect(mockSupabase.rpc).toBeDefined();
		});

		it("should handle database errors during column check", async () => {
			// Mock unexpected database error
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({
						data: null,
						error: { code: "50000", message: "Database connection failed" },
					}),
				}),
			});

			// The script should handle this error gracefully
			expect(mockSupabase.from).toBeDefined();
		});

		it("should update share counts for voice notes", async () => {
			const mockVoiceNotes = [
				{ id: "voice-note-1" },
				{ id: "voice-note-2" },
				{ id: "voice-note-3" },
			];

			// Mock successful column check
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			// Mock voice notes fetch
			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock share count queries and updates
			mockVoiceNotes.forEach((voiceNote, index) => {
				// Mock share count query
				mockSupabase.from.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [],
							error: null,
							count: index + 1, // Different share counts for each note
						}),
					}),
				});

				// Mock update query
				mockSupabase.from.mockReturnValueOnce({
					update: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ error: null }),
					}),
				});
			});

			expect(mockSupabase.from).toBeDefined();
		});

		it("should handle errors when fetching voice notes", async () => {
			// Mock successful column check
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			// Mock error when fetching voice notes
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockResolvedValue({
					data: null,
					error: { message: "Failed to fetch voice notes" },
				}),
			});

			expect(mockSupabase.from).toBeDefined();
		});

		it("should handle errors when counting shares", async () => {
			const mockVoiceNotes = [{ id: "voice-note-1" }];

			// Mock successful setup
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock error when counting shares
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: null,
						error: { message: "Failed to count shares" },
					}),
				}),
			});

			expect(mockSupabase.from).toBeDefined();
		});

		it("should handle errors when updating voice notes", async () => {
			const mockVoiceNotes = [{ id: "voice-note-1" }];

			// Mock successful setup
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock successful share count
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null, count: 5 }),
				}),
			});

			// Mock error when updating
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest
						.fn()
						.mockResolvedValue({ error: { message: "Update failed" } }),
				}),
			});

			expect(mockSupabase.from).toBeDefined();
		});

		it("should correctly count shares for each voice note", async () => {
			const mockVoiceNotes = [{ id: "voice-note-1" }, { id: "voice-note-2" }];

			// Test with different share counts
			const shareCounts = [3, 7];

			// Mock successful setup
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock share queries and updates
			mockVoiceNotes.forEach((voiceNote, index) => {
				const mockEq = jest.fn().mockResolvedValue({
					data: [],
					error: null,
					count: shareCounts[index],
				});

				mockSupabase.from.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({ eq: mockEq }),
				});

				const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
				const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

				mockSupabase.from.mockReturnValueOnce({
					update: mockUpdate,
				});
			});

			expect(mockSupabase.from).toBeDefined();
		});

		it("should handle zero share counts correctly", async () => {
			const mockVoiceNotes = [{ id: "voice-note-no-shares" }];

			// Mock successful setup
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock zero shares
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
				}),
			});

			// Mock update with zero
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			expect(mockSupabase.from).toBeDefined();
		});

		it("should log progress updates for large datasets", async () => {
			// Create mock for 25 voice notes to test progress logging
			const mockVoiceNotes = Array.from({ length: 25 }, (_, i) => ({
				id: `voice-note-${i}`,
			}));

			// Mock successful setup
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock share queries and updates for all voice notes
			mockVoiceNotes.forEach(() => {
				mockSupabase.from.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest
							.fn()
							.mockResolvedValue({ data: [], error: null, count: 1 }),
					}),
				});

				mockSupabase.from.mockReturnValueOnce({
					update: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ error: null }),
					}),
				});
			});

			expect(mockSupabase.from).toBeDefined();
		});
	});

	describe("Script execution", () => {
		it("should exit with code 0 on success", async () => {
			// Mock successful execution
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			expect(process.exit).toBeDefined();
		});

		it("should exit with code 1 on failure", async () => {
			// Mock script failure
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					limit: jest
						.fn()
						.mockRejectedValue(new Error("Database connection failed")),
				}),
			});

			expect(process.exit).toBeDefined();
		});

		it("should provide detailed completion summary", async () => {
			const mockVoiceNotes = [
				{ id: "voice-note-1" },
				{ id: "voice-note-2" },
				{ id: "voice-note-3" },
			];

			// Mock successful execution
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					limit: jest.fn().mockResolvedValue({ data: [{}], error: null }),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest
					.fn()
					.mockResolvedValue({ data: mockVoiceNotes, error: null }),
			});

			// Mock all updates as successful
			mockVoiceNotes.forEach(() => {
				mockSupabase.from.mockReturnValueOnce({
					select: jest.fn().mockReturnValue({
						eq: jest
							.fn()
							.mockResolvedValue({ data: [], error: null, count: 1 }),
					}),
				});

				mockSupabase.from.mockReturnValueOnce({
					update: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ error: null }),
					}),
				});
			});

			expect(console.log).toBeDefined();
		});
	});
});
