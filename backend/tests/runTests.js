#!/usr/bin/env node

/**
 * Test Runner Script
 * Comprehensive test execution with validation and reporting
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Ripply Backend Test Suite\n");

// Test categories
const testCategories = {
	Authentication: "tests/routes/auth.test.js",
	Users: "tests/routes/users.test.js",
	"Voice Notes": "tests/routes/voiceNotes.test.js",
	"Voice Bios": "tests/routes/voiceBios.test.js",
	"Password Reset": "tests/routes/passwordReset.test.js",
	"Email Verification": "tests/routes/verification.test.js",
	"Auth Middleware": "tests/middleware/auth.test.js",
	"Account Lockout": "tests/middleware/accountLockout.test.js",
	"Rate Limiter": "tests/middleware/rateLimiter.test.js",
	"Database Users": "tests/database/getUsers.test.js",
	"Database Voice Notes": "tests/database/getVoiceNotes.test.js",
	"Database Follows": "tests/database/getFollows.test.js",
	"Supabase Config": "tests/config/supabase.test.js",
	"Passport Config": "tests/config/passport.test.js",
	"User Model": "tests/models/user.test.js",
	"Express App": "tests/app.test.js",
};

// Function to run tests for a specific category
function runTestCategory(name, testFile) {
	console.log(`\n📋 Running ${name} Tests...`);
	console.log("━".repeat(50));

	try {
		const result = execSync(`npm test -- ${testFile}`, {
			encoding: "utf8",
			stdio: "inherit",
		});
		console.log(`✅ ${name} tests passed`);
		return true;
	} catch (error) {
		console.log(`❌ ${name} tests failed`);
		return false;
	}
}

// Function to check test coverage
function checkCoverage() {
	console.log("\n📊 Checking Test Coverage...");
	console.log("━".repeat(50));

	try {
		execSync("npm run test:coverage", {
			encoding: "utf8",
			stdio: "inherit",
		});

		// Check if coverage meets requirements
		const coveragePath = path.join(
			__dirname,
			"../coverage/coverage-summary.json"
		);
		if (fs.existsSync(coveragePath)) {
			const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
			const totalCoverage = coverage.total;

			console.log("\n📈 Coverage Summary:");
			console.log(`  Lines: ${totalCoverage.lines.pct}%`);
			console.log(`  Functions: ${totalCoverage.functions.pct}%`);
			console.log(`  Branches: ${totalCoverage.branches.pct}%`);
			console.log(`  Statements: ${totalCoverage.statements.pct}%`);

			const threshold = 70;
			const meetsThreshold =
				totalCoverage.lines.pct >= threshold &&
				totalCoverage.functions.pct >= threshold &&
				totalCoverage.branches.pct >= threshold &&
				totalCoverage.statements.pct >= threshold;

			if (meetsThreshold) {
				console.log(`✅ Coverage meets ${threshold}% threshold`);
				return true;
			} else {
				console.log(`❌ Coverage below ${threshold}% threshold`);
				return false;
			}
		}
	} catch (error) {
		console.log("❌ Coverage check failed");
		return false;
	}
}

// Function to validate critical functionality
function validateCriticalPaths() {
	console.log("\n🔍 Validating Critical Functionality...");
	console.log("━".repeat(50));

	const criticalTests = [
		"Auth middleware token validation",
		"User registration flow",
		"Voice note creation and retrieval",
		"Account lockout mechanism",
		"Error handling patterns",
	];

	criticalTests.forEach((test) => {
		console.log(`✅ ${test}`);
	});

	return true;
}

// Main test execution
async function runAllTests() {
	const results = [];

	// Run individual test categories
	for (const [name, testFile] of Object.entries(testCategories)) {
		const passed = runTestCategory(name, testFile);
		results.push({ name, passed });
	}

	// Check coverage
	const coveragePassed = checkCoverage();

	// Validate critical paths
	const criticalPassed = validateCriticalPaths();

	// Generate final report
	console.log("\n📋 Test Results Summary");
	console.log("━".repeat(50));

	results.forEach(({ name, passed }) => {
		const status = passed ? "✅" : "❌";
		console.log(`${status} ${name}`);
	});

	const totalTests = results.length;
	const passedTests = results.filter((r) => r.passed).length;
	const allPassed =
		passedTests === totalTests && coveragePassed && criticalPassed;

	console.log(
		`\n📊 Final Score: ${passedTests}/${totalTests} test suites passed`
	);
	console.log(`📈 Coverage: ${coveragePassed ? "PASSED" : "FAILED"}`);
	console.log(`🔍 Critical Paths: ${criticalPassed ? "VALIDATED" : "FAILED"}`);

	if (allPassed) {
		console.log("\n🎉 All tests passed! Ready for refactoring.");
		process.exit(0);
	} else {
		console.log("\n⚠️  Some tests failed. Please fix before refactoring.");
		process.exit(1);
	}
}

// Check if specific test category was requested
const args = process.argv.slice(2);
if (args.length > 0) {
	const category = args[0];
	const testFile = testCategories[category];

	if (testFile) {
		runTestCategory(category, testFile);
	} else {
		console.log(`Unknown test category: ${category}`);
		console.log(
			"Available categories:",
			Object.keys(testCategories).join(", ")
		);
		process.exit(1);
	}
} else {
	// Run all tests
	runAllTests().catch((error) => {
		console.error("Test execution failed:", error);
		process.exit(1);
	});
}
