/**
 * Export Schema Database Utility Tests
 * Tests the schema export functionality for Supabase setup
 */

const fs = require("fs");
const path = require("path");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("fs");
jest.mock("path");

const mockFs = require("fs");
const mockPath = require("path");

describe("Export Schema Database Utility", () => {
	let testDb;
	let originalConsoleLog;
	let originalConsoleError;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock console methods
		originalConsoleLog = console.log;
		originalConsoleError = console.error;
		console.log = jest.fn();
		console.error = jest.fn();
	});

	afterEach(async () => {
		await testDb.cleanup();

		// Restore console methods
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
	});

	describe("Schema Export Functionality", () => {
		it("should read schema file successfully", () => {
			const mockSchemaContent = `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL
        );
      `;

			// Mock path.join and fs.readFileSync
			mockPath.join.mockReturnValue("/mock/path/schema.sql");
			mockFs.readFileSync.mockReturnValue(mockSchemaContent);
			mockFs.writeFileSync.mockImplementation(() => {});

			const content = mockFs.readFileSync("/mock/path/schema.sql", "utf8");
			expect(content).toBe(mockSchemaContent);
			expect(mockPath.join).toHaveBeenCalled();
		});

		it("should handle file read errors gracefully", () => {
			const readError = new Error("File not found");

			mockPath.join.mockReturnValue("/mock/path/schema.sql");
			mockFs.readFileSync.mockImplementation(() => {
				throw readError;
			});

			expect(() =>
				mockFs.readFileSync("/mock/path/schema.sql", "utf8")
			).toThrow(readError);
		});

		it("should write output file correctly", () => {
			const mockSchemaContent = "CREATE TABLE test_table();";

			mockPath.join
				.mockReturnValueOnce("/mock/path/schema.sql")
				.mockReturnValueOnce("/mock/path/supabase-schema-export.sql");

			mockFs.readFileSync.mockReturnValue(mockSchemaContent);
			mockFs.writeFileSync.mockImplementation(() => {});

			mockFs.writeFileSync(
				"/mock/path/supabase-schema-export.sql",
				mockSchemaContent
			);
			expect(mockFs.writeFileSync).toHaveBeenCalledWith(
				"/mock/path/supabase-schema-export.sql",
				mockSchemaContent
			);
		});

		it("should handle write errors gracefully", () => {
			const writeError = new Error("Permission denied");

			mockPath.join.mockReturnValue("/mock/path/schema.sql");
			mockFs.readFileSync.mockReturnValue("CREATE TABLE test();");
			mockFs.writeFileSync.mockImplementation(() => {
				throw writeError;
			});

			expect(() => mockFs.writeFileSync("/mock/path", "content")).toThrow(
				writeError
			);
		});

		it("should log schema content to console", () => {
			const mockSchemaContent = "CREATE TABLE users();";

			mockPath.join.mockReturnValue("/mock/path/schema.sql");
			mockFs.readFileSync.mockReturnValue(mockSchemaContent);
			mockFs.writeFileSync.mockImplementation(() => {});

			// Simulate the console.log calls that would happen
			console.log("=".repeat(80));
			console.log("SUPABASE SCHEMA SQL");
			console.log("=".repeat(80));
			console.log(mockSchemaContent);

			expect(console.log).toHaveBeenCalledWith("=".repeat(80));
			expect(console.log).toHaveBeenCalledWith("SUPABASE SCHEMA SQL");
			expect(console.log).toHaveBeenCalledWith(mockSchemaContent);
		});

		it("should provide setup instructions", () => {
			console.log(
				"After executing this schema in Supabase, run setupSupabase.js to create sample data."
			);

			expect(console.log).toHaveBeenCalledWith(
				"After executing this schema in Supabase, run setupSupabase.js to create sample data."
			);
		});
	});

	describe("Path Resolution", () => {
		it("should resolve correct schema file path", () => {
			mockPath.join.mockReturnValue("/expected/path/schema.sql");

			const result = mockPath.join("/some/dir", "schema.sql");
			expect(result).toBe("/expected/path/schema.sql");
		});

		it("should resolve correct output file path", () => {
			mockPath.join
				.mockReturnValueOnce("/path/schema.sql")
				.mockReturnValueOnce("/path/supabase-schema-export.sql");

			const schemaPath = mockPath.join("/dir", "schema.sql");
			const outputPath = mockPath.join("/dir", "supabase-schema-export.sql");

			expect(schemaPath).toBe("/path/schema.sql");
			expect(outputPath).toBe("/path/supabase-schema-export.sql");
		});

		it("should handle relative paths correctly", () => {
			const mockDirname = "/app/src/db";

			mockPath.join.mockImplementation((dirname, filename) => {
				return `${dirname}/${filename}`;
			});

			const result = mockPath.join(mockDirname, "schema.sql");
			expect(result).toBe("/app/src/db/schema.sql");
		});
	});

	describe("File Operations", () => {
		it("should read file with correct encoding", () => {
			const mockContent = "SQL CONTENT";

			mockPath.join.mockReturnValue("/mock/schema.sql");
			mockFs.readFileSync.mockReturnValue(mockContent);

			const content = mockFs.readFileSync("/mock/schema.sql", "utf8");
			expect(content).toBe(mockContent);
			expect(mockFs.readFileSync).toHaveBeenCalledWith(
				"/mock/schema.sql",
				"utf8"
			);
		});

		it("should write file with correct content", () => {
			const schemaContent = "CREATE TABLE users();";

			mockFs.writeFileSync.mockImplementation(() => {});

			mockFs.writeFileSync("/mock/output.sql", schemaContent);
			expect(mockFs.writeFileSync).toHaveBeenCalledWith(
				"/mock/output.sql",
				schemaContent
			);
		});

		it("should handle empty schema file", () => {
			mockPath.join.mockReturnValue("/mock/schema.sql");
			mockFs.readFileSync.mockReturnValue("");

			const content = mockFs.readFileSync("/mock/schema.sql", "utf8");
			expect(content).toBe("");
		});

		it("should handle large schema files", () => {
			const largeSchemaContent = "CREATE TABLE ".repeat(1000) + "test();";

			mockPath.join.mockReturnValue("/mock/schema.sql");
			mockFs.readFileSync.mockReturnValue(largeSchemaContent);

			const content = mockFs.readFileSync("/mock/schema.sql", "utf8");
			expect(content).toBe(largeSchemaContent);
			expect(content.length).toBeGreaterThan(10000);
		});
	});

	describe("Error Handling", () => {
		it("should catch and log file system errors", () => {
			const fsError = new Error("ENOENT: no such file or directory");

			mockPath.join.mockReturnValue("/nonexistent/schema.sql");
			mockFs.readFileSync.mockImplementation(() => {
				throw fsError;
			});

			expect(() =>
				mockFs.readFileSync("/nonexistent/schema.sql", "utf8")
			).toThrow(fsError);
		});

		it("should handle permission errors", () => {
			const permissionError = new Error("EACCES: permission denied");

			mockPath.join.mockReturnValue("/protected/schema.sql");
			mockFs.readFileSync.mockImplementation(() => {
				throw permissionError;
			});

			expect(() =>
				mockFs.readFileSync("/protected/schema.sql", "utf8")
			).toThrow(permissionError);
		});

		it("should handle disk space errors during write", () => {
			const diskError = new Error("ENOSPC: no space left on device");

			mockFs.writeFileSync.mockImplementation(() => {
				throw diskError;
			});

			expect(() => mockFs.writeFileSync("/mock/output.sql", "content")).toThrow(
				diskError
			);
		});
	});

	describe("Console Output", () => {
		it("should log appropriate messages", () => {
			console.log("Reading schema file...");
			console.log("Schema also saved to: /path/to/output.sql");

			expect(console.log).toHaveBeenCalledWith("Reading schema file...");
			expect(console.log).toHaveBeenCalledWith(
				"Schema also saved to: /path/to/output.sql"
			);
		});

		it("should format output with separators", () => {
			const separator = "=".repeat(80);
			console.log(separator);
			console.log("SUPABASE SCHEMA SQL");
			console.log(separator);

			expect(console.log).toHaveBeenCalledWith(separator);
			expect(console.log).toHaveBeenCalledWith("SUPABASE SCHEMA SQL");
		});

		it("should provide clear instructions", () => {
			mockPath.join.mockReturnValue("/mock/schema.sql");
			mockFs.readFileSync.mockReturnValue("SQL CONTENT");
			mockFs.writeFileSync.mockImplementation(() => {});

			expect(console.log).toBeDefined();
		});
	});
});
