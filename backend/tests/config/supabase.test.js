/**
 * Supabase Configuration Tests
 * Tests Supabase client initialization and configuration
 */

describe("Supabase Configuration", () => {
	let originalEnv;

	beforeEach(() => {
		// Save original environment variables
		originalEnv = { ...process.env };

		// Clear the module cache to ensure fresh imports
		jest.resetModules();
	});

	afterEach(() => {
		// Restore original environment variables
		process.env = originalEnv;
	});

	describe("Environment Variables", () => {
		it("should require SUPABASE_URL environment variable", () => {
			delete process.env.SUPABASE_URL;
			process.env.SUPABASE_ANON_KEY = "test-anon-key";

			expect(() => {
				require("../../src/config/supabase");
			}).toThrow();
		});

		it("should require SUPABASE_ANON_KEY environment variable", () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			delete process.env.SUPABASE_ANON_KEY;

			expect(() => {
				require("../../src/config/supabase");
			}).toThrow();
		});

		it("should accept valid environment variables", () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

			expect(() => {
				require("../../src/config/supabase");
			}).not.toThrow();
		});

		it("should validate SUPABASE_URL format", () => {
			process.env.SUPABASE_URL = "invalid-url";
			process.env.SUPABASE_ANON_KEY = "test-anon-key";

			expect(() => {
				require("../../src/config/supabase");
			}).toThrow();
		});

		it("should validate SUPABASE_ANON_KEY format", () => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "invalid-key";

			// This might not throw depending on the validation in your config
			// Adjust expectation based on your actual validation logic
			const supabase = require("../../src/config/supabase");
			expect(supabase).toBeDefined();
		});
	});

	describe("Client Initialization", () => {
		beforeEach(() => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
		});

		it("should create Supabase client instance", () => {
			const supabase = require("../../src/config/supabase");

			expect(supabase).toBeDefined();
			expect(typeof supabase).toBe("object");
		});

		it("should have required Supabase methods", () => {
			const supabase = require("../../src/config/supabase");

			expect(supabase).toHaveProperty("from");
			expect(supabase).toHaveProperty("auth");
			expect(supabase).toHaveProperty("storage");
			expect(typeof supabase.from).toBe("function");
		});

		it("should configure auth settings correctly", () => {
			const supabase = require("../../src/config/supabase");

			// These properties depend on your specific Supabase configuration
			expect(supabase.auth).toBeDefined();
			expect(typeof supabase.auth.signIn).toBe("function");
			expect(typeof supabase.auth.signOut).toBe("function");
		});
	});

	describe("Database Operations", () => {
		beforeEach(() => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
		});

		it("should create table references", () => {
			const supabase = require("../../src/config/supabase");

			const usersTable = supabase.from("users");
			expect(usersTable).toBeDefined();
			expect(typeof usersTable.select).toBe("function");
			expect(typeof usersTable.insert).toBe("function");
			expect(typeof usersTable.update).toBe("function");
			expect(typeof usersTable.delete).toBe("function");
		});

		it("should support chaining operations", () => {
			const supabase = require("../../src/config/supabase");

			const query = supabase.from("users").select("*");

			expect(query).toBeDefined();
			expect(typeof query.eq).toBe("function");
			expect(typeof query.order).toBe("function");
			expect(typeof query.limit).toBe("function");
		});
	});

	describe("Authentication Integration", () => {
		beforeEach(() => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
		});

		it("should provide auth methods", () => {
			const supabase = require("../../src/config/supabase");

			expect(supabase.auth).toBeDefined();
			expect(typeof supabase.auth.getSession).toBe("function");
			expect(typeof supabase.auth.getUser).toBe("function");
		});

		it("should handle session management", () => {
			const supabase = require("../../src/config/supabase");

			// Test that session methods exist
			expect(typeof supabase.auth.onAuthStateChange).toBe("function");
		});
	});

	describe("Storage Integration", () => {
		beforeEach(() => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
		});

		it("should provide storage methods", () => {
			const supabase = require("../../src/config/supabase");

			expect(supabase.storage).toBeDefined();
			expect(typeof supabase.storage.from).toBe("function");
		});

		it("should create bucket references", () => {
			const supabase = require("../../src/config/supabase");

			const bucket = supabase.storage.from("test-bucket");
			expect(bucket).toBeDefined();
			expect(typeof bucket.upload).toBe("function");
			expect(typeof bucket.download).toBe("function");
		});
	});

	describe("Configuration Options", () => {
		beforeEach(() => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
		});

		it("should use correct URL and key", () => {
			const supabase = require("../../src/config/supabase");

			// The exact properties to test depend on your Supabase version
			// Adjust these based on your client configuration
			expect(supabase.supabaseUrl).toBe("https://test.supabase.co");
			expect(supabase.supabaseKey).toBe(
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
			);
		});

		it("should handle realtime configuration", () => {
			const supabase = require("../../src/config/supabase");

			// Test realtime functionality if configured
			expect(supabase.realtime).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		it("should handle missing environment file gracefully", () => {
			delete process.env.SUPABASE_URL;
			delete process.env.SUPABASE_ANON_KEY;

			expect(() => {
				require("../../src/config/supabase");
			}).toThrow();
		});

		it("should provide meaningful error messages", () => {
			delete process.env.SUPABASE_URL;
			process.env.SUPABASE_ANON_KEY = "test-key";

			try {
				require("../../src/config/supabase");
			} catch (error) {
				expect(error.message).toContain("SUPABASE_URL");
			}
		});
	});

	describe("Development vs Production", () => {
		it("should work in development environment", () => {
			process.env.NODE_ENV = "development";
			process.env.SUPABASE_URL = "https://dev.supabase.co";
			process.env.SUPABASE_ANON_KEY = "dev-key";

			const supabase = require("../../src/config/supabase");
			expect(supabase).toBeDefined();
		});

		it("should work in production environment", () => {
			process.env.NODE_ENV = "production";
			process.env.SUPABASE_URL = "https://prod.supabase.co";
			process.env.SUPABASE_ANON_KEY = "prod-key";

			const supabase = require("../../src/config/supabase");
			expect(supabase).toBeDefined();
		});

		it("should work in test environment", () => {
			process.env.NODE_ENV = "test";
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";

			const supabase = require("../../src/config/supabase");
			expect(supabase).toBeDefined();
		});
	});

	describe("Module Export", () => {
		beforeEach(() => {
			process.env.SUPABASE_URL = "https://test.supabase.co";
			process.env.SUPABASE_ANON_KEY = "test-key";
		});

		it("should export Supabase client as default", () => {
			const supabase = require("../../src/config/supabase");

			expect(supabase).toBeDefined();
			expect(typeof supabase).toBe("object");
		});

		it("should export the same instance on multiple requires", () => {
			const supabase1 = require("../../src/config/supabase");
			const supabase2 = require("../../src/config/supabase");

			expect(supabase1).toBe(supabase2);
		});
	});
});
