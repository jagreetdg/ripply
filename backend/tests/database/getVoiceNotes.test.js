/**
 * Database getVoiceNotes Utility Tests
 * Tests all database voice notes retrieval functionality
 */

const { TestDatabase } = require("../helpers/testDatabase");

// Mock the dependencies
jest.mock("../../src/config/supabase");

const mockSupabase = require("../../src/config/supabase");
const { getVoiceNotes } = require("../../src/db/getVoiceNotes");

describe("Database getVoiceNotes Utility", () => {
	let testDb;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await testDb.cleanup();
	});

	describe("getVoiceNotes function", () => {
		it("should retrieve voice notes with pagination", async () => {
			const mockVoiceNotes = [
				{
					id: "note-1",
					title: "Test Note 1",
					url: "https://example.com/note1.mp3",
					user_id: "user-1",
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "note-2",
					title: "Test Note 2",
					url: "https://example.com/note2.mp3",
					user_id: "user-2",
					created_at: "2023-01-02T00:00:00Z",
				},
			];

			const mockSelect = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest
						.fn()
						.mockResolvedValue({ data: mockVoiceNotes, error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: mockSelect,
			});

			const result = await getVoiceNotes({ limit: 10 });

			expect(result).toEqual(mockVoiceNotes);
			expect(mockSupabase.from).toHaveBeenCalledWith("voice_notes");
		});

		it("should handle database errors gracefully", async () => {
			const mockError = new Error("Database connection failed");

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: null, error: mockError }),
					}),
				}),
			});

			await expect(getVoiceNotes({ limit: 10 })).rejects.toThrow(
				"Database connection failed"
			);
		});

		it("should apply correct ordering", async () => {
			const mockOrder = jest.fn().mockReturnValue({
				limit: jest.fn().mockResolvedValue({ data: [], error: null }),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: mockOrder,
				}),
			});

			await getVoiceNotes({ limit: 10 });

			expect(mockOrder).toHaveBeenCalledWith("created_at", {
				ascending: false,
			});
		});

		it("should apply correct pagination", async () => {
			const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: mockLimit,
					}),
				}),
			});

			await getVoiceNotes({ limit: 10 });

			expect(mockLimit).toHaveBeenCalledWith(10);
		});

		it("should handle edge case pagination values", async () => {
			const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: mockLimit,
					}),
				}),
			});

			await getVoiceNotes({ limit: 1 });

			expect(mockLimit).toHaveBeenCalledWith(1);
		});
	});

	describe("Data integrity", () => {
		it("should return voice notes with all expected fields", async () => {
			const mockNote = {
				id: "note-123",
				title: "Test Voice Note",
				description: "Test description",
				url: "https://example.com/audio.mp3",
				duration: 120,
				user_id: "user-123",
				likes_count: 5,
				comments_count: 2,
				shares_count: 1,
				play_count: 10,
				is_public: true,
				tags: ["music", "test"],
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: [mockNote], error: null }),
					}),
				}),
			});

			const result = await getVoiceNotes({ limit: 10 });

			expect(result[0]).toEqual(mockNote);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("title");
			expect(result[0]).toHaveProperty("url");
			expect(result[0]).toHaveProperty("user_id");
		});

		it("should handle voice notes with null optional fields", async () => {
			const mockNote = {
				id: "note-123",
				title: "Test Voice Note",
				description: null,
				url: "https://example.com/audio.mp3",
				duration: null,
				user_id: "user-123",
				likes_count: 0,
				comments_count: 0,
				shares_count: 0,
				play_count: 0,
				is_public: true,
				tags: null,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: [mockNote], error: null }),
					}),
				}),
			});

			const result = await getVoiceNotes({ limit: 10 });

			expect(result[0]).toEqual(mockNote);
			expect(result[0].description).toBeNull();
			expect(result[0].duration).toBeNull();
			expect(result[0].tags).toBeNull();
		});
	});

	describe("Performance considerations", () => {
		it("should call Supabase client only once", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue({ data: [], error: null }),
					}),
				}),
			});

			await getVoiceNotes({ limit: 10 });

			expect(mockSupabase.from).toHaveBeenCalledTimes(1);
		});

		it("should handle large result sets efficiently", async () => {
			const mockLargeDataSet = Array.from({ length: 1000 }, (_, i) => ({
				id: `note-${i}`,
				title: `Voice Note ${i}`,
				url: `https://example.com/note${i}.mp3`,
				user_id: `user-${i % 10}`,
				created_at: new Date().toISOString(),
			}));

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: mockLargeDataSet, error: null }),
					}),
				}),
			});

			const result = await getVoiceNotes({ limit: 1000 });

			expect(result).toHaveLength(1000);
			expect(result[0]).toHaveProperty("id");
		});
	});

	describe("Error handling", () => {
		it("should handle null data response", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest.fn().mockResolvedValue({ data: null, error: null }),
					}),
				}),
			});

			const result = await getVoiceNotes({ limit: 10 });

			expect(result).toEqual([]);
		});

		it("should propagate Supabase errors", async () => {
			const supabaseError = {
				message: "RLS policy violation",
				code: 42501,
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: null, error: supabaseError }),
					}),
				}),
			});

			await expect(getVoiceNotes({ limit: 10 })).rejects.toEqual(supabaseError);
		});

		it("should handle network timeout errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest.fn().mockRejectedValue(new Error("Network timeout")),
					}),
				}),
			});

			await expect(getVoiceNotes({ limit: 10 })).rejects.toThrow(
				"Network timeout"
			);
		});
	});

	describe("Filtering and sorting", () => {
		it("should support user-specific queries", async () => {
			const mockUserNotes = [
				{
					id: "note-1",
					user_id: "user-123",
					title: "User's Note",
				},
			];

			const mockEq = jest.fn().mockReturnValue({
				order: jest.fn().mockReturnValue({
					limit: jest
						.fn()
						.mockResolvedValue({ data: mockUserNotes, error: null }),
				}),
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: mockEq,
				}),
			});

			const result = await getVoiceNotes({ userId: "user-123", limit: 10 });

			expect(result).toEqual(mockUserNotes);
			expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
		});

		it("should support public-only queries", async () => {
			const mockPublicNotes = [
				{
					id: "note-1",
					is_public: true,
					title: "Public Note",
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					order: jest.fn().mockReturnValue({
						limit: jest
							.fn()
							.mockResolvedValue({ data: mockPublicNotes, error: null }),
					}),
				}),
			});

			const result = await getVoiceNotes({ limit: 10 });

			expect(result).toEqual(mockPublicNotes);
		});
	});
});
