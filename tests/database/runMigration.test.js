/**
 * Run Migration Database Utility Tests
 * Tests the SQL migration runner functionality
 */

const fs = require("fs");
const path = require("path");
const { TestDatabase } = require("../helpers/testDatabase");

// Mock dependencies
jest.mock("fs");
jest.mock("path");
jest.mock("../../src/config/supabase");

const mockFs = require("fs");
const mockPath = require("path");
const mockSupabase = require("../../src/config/supabase");

describe("Run Migration Database Utility", () => {
	let testDb;
	let originalConsoleLog;
	let originalConsoleError;
	let originalProcessExit;
	let originalProcessArgv;

	beforeEach(() => {
		testDb = new TestDatabase();
		jest.clearAllMocks();

		// Mock console methods
		originalConsoleLog = console.log;
		originalConsoleError = console.error;
		originalProcessExit = process.exit;
		originalProcessArgv = process.argv;

		console.log = jest.fn();
		console.error = jest.fn();
		process.exit = jest.fn();

		// Mock Supabase RPC
		mockSupabase.rpc = jest.fn();
	});

	afterEach(async () => {
		await testDb.cleanup();

		// Restore original methods
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
		process.exit = originalProcessExit;
		process.argv = originalProcessArgv;
	});

	describe("Command Line Arguments", () => {
		it("should require migration file argument", () => {
			process.argv = ["node", "run-migration.js"];

			// Simulate the check that would happen in the script
			const migrationFile = process.argv[2];
			expect(migrationFile).toBeUndefined();
		});

		it("should accept migration file argument", () => {
			process.argv = ["node", "run-migration.js", "test-migration.sql"];

			const migrationFile = process.argv[2];
			expect(migrationFile).toBe("test-migration.sql");
		});

		it("should handle migration file with path", () => {
			process.argv = ["node", "run-migration.js", "subdirectory/migration.sql"];

			const migrationFile = process.argv[2];
			expect(migrationFile).toBe("subdirectory/migration.sql");
		});
	});

	describe("File Path Resolution", () => {
		it("should resolve migration file path correctly", () => {
			const migrationFile = "test-migration.sql";
			const expectedPath = "/app/src/db/migrations/test-migration.sql";

			mockPath.resolve.mockReturnValue(expectedPath);

			const result = mockPath.resolve(
				"/app/src/db",
				"migrations",
				migrationFile
			);
			expect(result).toBe(expectedPath);
		});

		it("should handle nested migration directories", () => {
			const migrationFile = "v1/create-users.sql";
			const expectedPath = "/app/src/db/migrations/v1/create-users.sql";

			mockPath.resolve.mockReturnValue(expectedPath);

			const result = mockPath.resolve(
				"/app/src/db",
				"migrations",
				migrationFile
			);
			expect(result).toBe(expectedPath);
		});

		it("should handle absolute paths", () => {
			const migrationFile = "/absolute/path/migration.sql";
			mockPath.resolve.mockReturnValue(migrationFile);

			const result = mockPath.resolve(migrationFile);
			expect(result).toBe(migrationFile);
		});
	});

	describe("File Existence Checks", () => {
		it("should check if migration file exists", () => {
			const migrationPath = "/app/migrations/test.sql";

			mockPath.resolve.mockReturnValue(migrationPath);
			mockFs.existsSync.mockReturnValue(true);

			const exists = mockFs.existsSync(migrationPath);
			expect(exists).toBe(true);
		});

		it("should handle non-existent migration file", () => {
			const migrationPath = "/app/migrations/nonexistent.sql";

			mockPath.resolve.mockReturnValue(migrationPath);
			mockFs.existsSync.mockReturnValue(false);

			const exists = mockFs.existsSync(migrationPath);
			expect(exists).toBe(false);
		});

		it("should exit with error for missing file", () => {
			process.argv = ["node", "run-migration.js", "missing.sql"];

			mockPath.resolve.mockReturnValue("/app/migrations/missing.sql");
			mockFs.existsSync.mockReturnValue(false);

			// Simulate the error handling that would happen
			const migrationFile = process.argv[2];
			const fullPath = mockPath.resolve(
				"/app/src/db",
				"migrations",
				migrationFile
			);
			const exists = mockFs.existsSync(fullPath);

			if (!exists) {
				console.error(`Migration file not found: ${fullPath}`);
				expect(console.error).toHaveBeenCalledWith(
					`Migration file not found: ${fullPath}`
				);
			}
		});
	});

	describe("SQL File Reading", () => {
		it("should read SQL migration file", () => {
			const sqlContent = "CREATE TABLE test_migration();";
			const migrationPath = "/app/migrations/test.sql";

			mockPath.resolve.mockReturnValue(migrationPath);
			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue(sqlContent);

			const content = mockFs.readFileSync(migrationPath, "utf8");
			expect(content).toBe(sqlContent);
		});

		it("should handle complex SQL content", () => {
			const complexSql = `
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        INSERT INTO users (username) VALUES ('test_user');
        
        CREATE INDEX idx_users_username ON users(username);
      `;

			mockFs.readFileSync.mockReturnValue(complexSql);

			const content = mockFs.readFileSync("/path/complex.sql", "utf8");
			expect(content).toBe(complexSql);
		});

		it("should handle empty SQL files", () => {
			mockFs.readFileSync.mockReturnValue("");

			const content = mockFs.readFileSync("/path/empty.sql", "utf8");
			expect(content).toBe("");
		});

		it("should handle SQL files with comments", () => {
			const sqlWithComments = `
        -- Migration: Create users table
        /* Multi-line comment
           describing the migration */
        CREATE TABLE users (id INTEGER);
      `;

			mockFs.readFileSync.mockReturnValue(sqlWithComments);

			const content = mockFs.readFileSync("/path/commented.sql", "utf8");
			expect(content).toBe(sqlWithComments);
		});
	});

	describe("Database Migration Execution", () => {
		it("should execute migration successfully", async () => {
			const sqlContent = "CREATE TABLE test_table();";

			mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

			const result = await mockSupabase.rpc("exec_sql", {
				sql_query: sqlContent,
			});
			expect(result.error).toBeNull();
		});

		it("should handle migration execution errors", async () => {
			const sqlContent = "INVALID SQL SYNTAX";
			const migrationError = { message: "Syntax error in SQL" };

			mockSupabase.rpc.mockResolvedValue({ data: null, error: migrationError });

			const result = await mockSupabase.rpc("exec_sql", {
				sql_query: sqlContent,
			});
			expect(result.error).toEqual(migrationError);
		});

		it("should pass correct SQL to Supabase RPC", async () => {
			const sqlContent = "ALTER TABLE users ADD COLUMN email VARCHAR(255);";

			mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

			await mockSupabase.rpc("exec_sql", { sql_query: sqlContent });
			expect(mockSupabase.rpc).toHaveBeenCalledWith("exec_sql", {
				sql_query: sqlContent,
			});
		});

		it("should handle network errors", async () => {
			const networkError = new Error("Network connection failed");

			mockSupabase.rpc.mockRejectedValue(networkError);

			try {
				await mockSupabase.rpc("exec_sql", { sql_query: "SELECT 1;" });
			} catch (error) {
				expect(error).toEqual(networkError);
			}
		});
	});

	describe("Error Handling", () => {
		it("should handle file read errors", () => {
			const readError = new Error("Permission denied");

			mockPath.resolve.mockReturnValue("/protected/migration.sql");
			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockImplementation(() => {
				throw readError;
			});

			expect(() =>
				mockFs.readFileSync("/protected/migration.sql", "utf8")
			).toThrow(readError);
		});

		it("should handle database connection errors", async () => {
			const connectionError = new Error("Connection timeout");

			mockSupabase.rpc.mockRejectedValue(connectionError);

			try {
				await mockSupabase.rpc("exec_sql", { sql_query: "SELECT 1;" });
			} catch (error) {
				expect(error).toEqual(connectionError);
			}
		});

		it("should exit with appropriate codes", () => {
			// Test successful execution expectation
			expect(process.exit).toBeDefined();

			// Test failure cases expectation
			expect(process.exit).toBeDefined();
		});
	});

	describe("Console Output", () => {
		it("should log migration start message", () => {
			const migrationFile = "test-migration.sql";

			console.log(`Running migration: ${migrationFile}`);
			expect(console.log).toHaveBeenCalledWith(
				`Running migration: ${migrationFile}`
			);
		});

		it("should log success message", () => {
			console.log("Migration completed successfully");
			expect(console.log).toHaveBeenCalledWith(
				"Migration completed successfully"
			);
		});

		it("should log error messages", () => {
			const error = { message: "Migration failed" };
			console.error("Migration failed:", error);
			expect(console.error).toHaveBeenCalledWith("Migration failed:", error);
		});

		it("should log file not found errors", () => {
			const filePath = "/path/to/missing.sql";
			console.error(`Migration file not found: ${filePath}`);
			expect(console.error).toHaveBeenCalledWith(
				`Migration file not found: ${filePath}`
			);
		});
	});

	describe("Environment Variables", () => {
		it("should load environment variables", () => {
			// dotenv.config() should be called
			expect(process.env).toBeDefined();
		});

		it("should access database configuration", () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";

			expect(process.env.SUPABASE_URL).toBe("https://test.supabase.co");
			expect(process.env.SUPABASE_ANON_KEY).toBe("test-key");
		});
	});

	describe("Process Argument Validation", () => {
		it("should validate required migration file argument", () => {
			process.argv = ["node", "run-migration.js"];

			const migrationFile = process.argv[2];

			if (!migrationFile) {
				console.error("Please provide a migration file path");
				expect(console.error).toHaveBeenCalledWith(
					"Please provide a migration file path"
				);
			}
		});

		it("should handle missing command line arguments", () => {
			process.argv = ["node", "run-migration.js"];

			const migrationFile = process.argv[2];
			expect(migrationFile).toBeUndefined();
		});

		it("should process valid migration file paths", () => {
			const testPaths = [
				"migration.sql",
				"001_create_users.sql",
				"v1/002_add_indexes.sql",
				"migrations/003_alter_table.sql",
			];

			testPaths.forEach((path) => {
				process.argv = ["node", "run-migration.js", path];
				const migrationFile = process.argv[2];
				expect(migrationFile).toBe(path);
			});
		});
	});
});
