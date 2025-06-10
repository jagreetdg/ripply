/**
 * Jest Configuration for Ripply Backend
 */

module.exports = {
	// Test environment
	testEnvironment: "node",

	// Test directories
	roots: ["<rootDir>/tests", "<rootDir>/src"],

	// Test file patterns
	testMatch: ["**/__tests__/**/*.{js,ts}", "**/?(*.)+(spec|test).{js,ts}"],

	// Setup files
	setupFilesAfterEnv: ["<rootDir>/tests/helpers/testDatabase.js"],

	// Coverage configuration
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	collectCoverageFrom: [
		"src/**/*.{js,ts}",
		"!src/**/*.test.{js,ts}",
		"!src/**/__tests__/**",
		"!src/index.js", // Exclude main entry point
		"!src/db/migrations/**", // Exclude migration files
		"!src/scripts/**", // Exclude setup scripts
	],

	// Coverage thresholds
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},

	// Module paths
	moduleDirectories: ["node_modules", "<rootDir>/src"],

	// Clear mocks between tests
	clearMocks: true,

	// Restore mocks after each test
	restoreMocks: true,

	// Timeout for tests (30 seconds for database operations)
	testTimeout: 30000,

	// Verbose output
	verbose: true,

	// Transform configuration (if needed for ES6 modules)
	transform: {
		"^.+\\.(js|ts)$": "babel-jest",
	},

	// Module file extensions
	moduleFileExtensions: ["js", "ts", "json"],

	// Global setup and teardown
	globalSetup: "<rootDir>/tests/helpers/globalSetup.js",
	globalTeardown: "<rootDir>/tests/helpers/globalTeardown.js",

	// Environment variables for testing
	setupFiles: ["<rootDir>/tests/helpers/testEnv.js"],

	// Ignore patterns
	testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/"],

	// Force exit after tests complete
	forceExit: true,

	// Detect open handles to prevent hanging
	detectOpenHandles: true,

	// Bail after first test failure (optional)
	// bail: 1,
};
