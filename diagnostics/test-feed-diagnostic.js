const axios = require("axios");

// Configuration - update these as needed
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000"; // Use local backend for testing
const REMOTE_URL = "https://ripply-backend.onrender.com"; // Remote backend
const USE_REMOTE = true; // Set to false to use local backend

// Use the known test user ID from backend/test-endpoints.js
let TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d"; // Known test user from existing tests
const TEST_AUTH_TOKEN = "your-auth-token-here"; // Update with real auth token if needed

const API_BASE = USE_REMOTE ? REMOTE_URL : BASE_URL;

// Try to get a sample user ID from the backend
async function getSampleUserId() {
	try {
		console.log("🔍 Attempting to get a sample user ID from the backend...");

		// Try the users endpoint (might not require auth)
		const response = await axios.get(`${API_BASE}/api/users`);

		if (
			response.data &&
			Array.isArray(response.data) &&
			response.data.length > 0
		) {
			const sampleUser = response.data[0];
			console.log(
				`✅ Found sample user: ${sampleUser.username} (${sampleUser.id})`
			);
			return sampleUser.id;
		}
	} catch (error) {
		console.log("ℹ️  Could not fetch sample user ID automatically");
		console.log(
			"   This might be normal if the endpoint requires authentication"
		);
	}

	return null;
}

async function analyzeDiagnostics(userId = TEST_USER_ID) {
	console.log("📊 Analyzing Feed Diagnostics");
	console.log("============================");
	console.log("API Base:", API_BASE);
	console.log("User ID:", userId);

	if (userId === "your-test-user-id-here") {
		console.log("❌ No valid user ID available for testing");
		return;
	}

	try {
		// Test the diagnostic endpoint to understand the data structure
		console.log("\n=== DIAGNOSTIC ANALYSIS ===");
		const diagnosticUrl = `${API_BASE}/api/voice-notes/diagnostic/feed/${userId}`;
		console.log(`GET ${diagnosticUrl}`);

		const diagnosticResponse = await axios.get(diagnosticUrl);
		console.log("✅ Diagnostic Response status:", diagnosticResponse.status);

		const data = diagnosticResponse.data;
		console.log("\n📈 DETAILED ANALYSIS:");
		console.log(`   - User follows: ${data.followsCount} users`);
		console.log(`   - Total posts in DB: ${data.totalPostsCount}`);
		console.log(`   - Posts from followed users: ${data.filteredPostsCount}`);
		console.log(
			`   - Following IDs: ${JSON.stringify(data.filteredPostCreators || [])}`
		);

		// Analyze the issue
		console.log("\n🔍 ISSUE ANALYSIS:");
		if (data.followsCount === 0) {
			console.log("❌ ROOT CAUSE: User doesn't follow anyone");
			console.log("   ➜ Solution: User needs to follow other users");
		} else if (data.filteredPostsCount === 0) {
			console.log("❌ ROOT CAUSE: Followed users have no posts");
			console.log(
				"   ➜ Solution: Followed users need to create posts, or user needs to follow active users"
			);
		} else {
			console.log("✅ DATA STRUCTURE LOOKS CORRECT");
			console.log(
				`   ➜ Expected result: Feed should show ${data.filteredPostsCount} original posts from followed users`
			);
			console.log(
				"   ➜ If user only sees shared posts, there's a bug in the feed algorithm"
			);

			// This confirms the bug described by the user
			console.log("\n🚨 BUG CONFIRMATION:");
			console.log(
				"   Since diagnostic shows posts exist but user only sees shared posts,"
			);
			console.log(
				"   this confirms the reported issue: 'only reposted notes showing, no original notes'"
			);
		}

		// Show detailed breakdown if available
		if (data.samplePosts?.filteredPosts?.length > 0) {
			console.log("\n📋 SAMPLE POSTS FROM FOLLOWED USERS:");
			data.samplePosts.filteredPosts.forEach((post, index) => {
				console.log(
					`   ${index + 1}. "${post.title}" by ${post.username} (${
						post.isFromFollowed ? "✅ followed" : "❌ not followed"
					})`
				);
			});
		}

		if (data.samplePosts?.allPosts?.length > 0) {
			console.log("\n📋 SAMPLE FROM ALL POSTS:");
			data.samplePosts.allPosts.slice(0, 5).forEach((post, index) => {
				console.log(
					`   ${index + 1}. "${post.title}" by ${post.username} (${
						post.isFromFollowed ? "✅ followed" : "❌ not followed"
					})`
				);
			});
		}

		// Test conclusion
		console.log("\n🎯 CONCLUSION:");
		console.log("================");
		if (data.filteredPostsCount > 0) {
			console.log(
				"✅ The backend data is correct - posts from followed users exist"
			);
			console.log(
				"❌ The issue is in the feed algorithm not returning original posts"
			);
			console.log("🔧 RECOMMENDED ACTIONS:");
			console.log("   1. Check if backend code changes have been deployed");
			console.log(
				"   2. Verify the feed endpoint returns both original AND shared posts"
			);
			console.log(
				"   3. Test with authentication to see actual feed composition"
			);
			console.log("   4. Check frontend processing for any filtering issues");

			console.log("\n📝 BACKEND DEBUGGING STEPS:");
			console.log("   1. Check server logs when feed endpoint is called");
			console.log(
				"   2. Look for debug messages about 'original posts' vs 'shared posts'"
			);
			console.log("   3. Verify the processedOriginalPosts array is not empty");
			console.log("   4. Confirm is_shared: false posts are being returned");
		} else {
			console.log("ℹ️  No posts from followed users - this might be expected");
		}
	} catch (error) {
		console.error(
			"❌ Diagnostic error:",
			error.response?.status,
			error.response?.data?.message || error.message
		);

		if (error.response?.status === 500) {
			console.log("\n🔧 Server error - this might indicate:");
			console.log("   - Database connection issues");
			console.log("   - Backend code errors");
			console.log("   - Missing environment variables");
		}
	}
}

// Main execution
async function main() {
	console.log("🧪 Feed Algorithm Issue Analysis");
	console.log("================================");
	console.log(
		"Problem: User only sees shared/reposted notes, no original posts"
	);
	console.log(
		"Goal: Determine if backend data supports the expected behavior\n"
	);

	// Try to get a sample user ID first, but we already have a known one
	const sampleUserId = await getSampleUserId();

	if (sampleUserId) {
		console.log("✅ Found dynamic user ID, using that for analysis");
		await analyzeDiagnostics(sampleUserId);
	} else {
		console.log(`🔧 Using known test user ID: ${TEST_USER_ID}`);
		console.log("   (This is from the existing backend test file)");
		await analyzeDiagnostics(TEST_USER_ID);
	}
}

// Run the main function
main();
