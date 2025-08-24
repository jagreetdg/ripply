/**
 * Supabase Configuration Tests
 * Tests Supabase client initialization and configuration
 */

require("../helpers/testEnv");

describe("Supabase Configuration", () => {
	describe("Client Initialization", () => {
		it("should create Supabase client instance", () => {
			const { supabase } = require("../../src/config/supabase");

			expect(supabase).toBeDefined();
			expect(typeof supabase).toBe("object");
		});

		it("should have required Supabase methods", () => {
			const { supabase } = require("../../src/config/supabase");

			expect(supabase).toHaveProperty("from");
			expect(supabase).toHaveProperty("auth");
			expect(supabase).toHaveProperty("storage");
			expect(typeof supabase.from).toBe("function");
		});

		it("should configure auth settings correctly", () => {
			const { supabase } = require("../../src/config/supabase");

			// These properties depend on your specific Supabase configuration
			expect(supabase.auth).toBeDefined();
			// Use correct method names for Supabase v2
			expect(typeof supabase.auth.signInWithPassword).toBe("function");
			expect(typeof supabase.auth.signOut).toBe("function");
		});
	});

	describe("Database Operations", () => {
		it("should create table references", () => {
			const { supabase } = require("../../src/config/supabase");

			const usersTable = supabase.from("users");
			expect(usersTable).toBeDefined();
			expect(typeof usersTable.select).toBe("function");
			expect(typeof usersTable.insert).toBe("function");
			expect(typeof usersTable.update).toBe("function");
			expect(typeof usersTable.delete).toBe("function");
		});

		it("should support chaining operations", () => {
			const { supabase } = require("../../src/config/supabase");

			const query = supabase.from("users").select("*");

			expect(query).toBeDefined();
			expect(typeof query.eq).toBe("function");
			expect(typeof query.order).toBe("function");
			expect(typeof query.limit).toBe("function");
		});
	});

	describe("Authentication Integration", () => {
		it("should provide auth methods", () => {
			const { supabase } = require("../../src/config/supabase");

			expect(supabase.auth).toBeDefined();
			expect(typeof supabase.auth.getSession).toBe("function");
			expect(typeof supabase.auth.getUser).toBe("function");
		});

		it("should handle session management", () => {
			const { supabase } = require("../../src/config/supabase");

			// Test that session methods exist
			expect(typeof supabase.auth.onAuthStateChange).toBe("function");
		});
	});

	describe("Storage Integration", () => {
		it("should provide storage methods", () => {
			const { supabase } = require("../../src/config/supabase");

			expect(supabase.storage).toBeDefined();
			expect(typeof supabase.storage.from).toBe("function");
		});

		it("should create bucket references", () => {
			const { supabase } = require("../../src/config/supabase");

			const bucket = supabase.storage.from("test-bucket");
			expect(bucket).toBeDefined();
			expect(typeof bucket.upload).toBe("function");
			expect(typeof bucket.download).toBe("function");
		});
	});

	describe("Configuration Options", () => {
		it("should handle realtime configuration", () => {
			const { supabase } = require("../../src/config/supabase");

			// Test realtime functionality if configured
			expect(supabase.realtime).toBeDefined();
		});
	});

	describe("Module Export", () => {
		it("should export Supabase client as default", () => {
			const { supabase } = require("../../src/config/supabase");

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
