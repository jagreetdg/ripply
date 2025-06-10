/**
 * Test Environment Setup
 * Sets up environment variables for testing
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";

// Supabase test configuration
process.env.SUPABASE_URL =
	process.env.SUPABASE_URL || "https://kxuczrnakuybcgpnxclb.supabase.co";
process.env.SUPABASE_KEY =
	process.env.SUPABASE_KEY ||
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWN6cm5ha3V5YmNncG54Y2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMTc3ODIsImV4cCI6MjA0NjU5Mzc4Mn0.D7tKw-Ae8-vOC_PLFF9GVyQ0nP7b4jV--XEmbN5mP_A";

// Database test configuration
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5432";
process.env.DB_NAME = process.env.DB_NAME || "ripply_test";
process.env.DB_USER = process.env.DB_USER || "postgres";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "password";

// OAuth test configuration (use test values)
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.APPLE_CLIENT_ID = "test-apple-client-id";
process.env.APPLE_TEAM_ID = "test-apple-team-id";
process.env.APPLE_KEY_ID = "test-apple-key-id";
process.env.APPLE_PRIVATE_KEY = "test-apple-private-key";

// Email test configuration
process.env.SMTP_HOST = "test-smtp-host";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@example.com";
process.env.SMTP_PASS = "test-password";

// Rate limiting test configuration
process.env.RATE_LIMIT_WINDOW = "60000"; // 1 minute
process.env.RATE_LIMIT_MAX_REQUESTS = "100";

// File upload test configuration
process.env.MAX_FILE_SIZE = "10485760"; // 10MB
process.env.UPLOAD_PATH = "./test-uploads";

// Redis test configuration (if used)
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Logging configuration for tests
process.env.LOG_LEVEL = "error"; // Reduce log noise during tests

// Session configuration
process.env.SESSION_SECRET = "test-session-secret-key-for-testing-only";

console.log("Test environment variables configured");
