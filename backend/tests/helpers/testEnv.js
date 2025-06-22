/**
 * Test Environment Setup
 * Sets up environment variables for testing
 */

// Load environment variables from .env file
require("dotenv").config();

const setupTestEnvironment = () => {
	// Set NODE_ENV to test if not already set
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = "test";
	}

	// Set test environment variables directly for testing
	process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://test.supabase.co";
	process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";
	process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-that-is-long-enough-for-testing";
	process.env.PORT = process.env.TEST_PORT || "3001";
	process.env.LOG_LEVEL = process.env.LOG_LEVEL || "error";
	process.env.BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
	process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-google-client-id";
	process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret";
	process.env.APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "test-apple-client-id";
	process.env.APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET || "test-apple-client-secret";

	// Validate required test environment variables (now set above)
	const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "JWT_SECRET"];

	const missingVars = requiredEnvVars.filter(
		(varName) => !process.env[varName]
	);

	if (missingVars.length > 0) {
		console.error("Missing required environment variables for testing:");
		missingVars.forEach((varName) => {
			console.error(`  - ${varName}`);
		});
		console.error(
			"\nPlease ensure these are set in your .env file or test environment."
		);
		process.exit(1);
	}

	console.log("✅ Test environment setup complete");
};

// Run setup immediately when this file is loaded
console.log("🧪 Setting up test environment...");
setupTestEnvironment();

// Export configuration function
module.exports = {
	setupTestEnvironment,
};
