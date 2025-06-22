const axios = require("axios");

const REMOTE_URL = "https://ripply-backend.onrender.com";
const TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d";

async function testDirectFeed() {
	console.log("🧪 Direct Feed Endpoint Test");
	console.log("============================");
	console.log(
		"This will test the feed endpoint directly to see what's being returned"
	);
	console.log("");

	try {
		// Test the actual feed endpoint (this will fail due to auth, but we can see the error)
		const feedUrl = `${REMOTE_URL}/api/voice-notes/feed/${TEST_USER_ID}`;
		console.log(`Testing: ${feedUrl}`);

		try {
			const response = await axios.get(feedUrl);
			console.log("✅ SUCCESS - Feed endpoint returned data:");
			console.log(`   Status: ${response.status}`);
			console.log(`   Items: ${response.data.length}`);

			if (response.data.length > 0) {
				const originalPosts = response.data.filter((item) => !item.is_shared);
				const sharedPosts = response.data.filter((item) => item.is_shared);

				console.log(`   Original posts: ${originalPosts.length}`);
				console.log(`   Shared posts: ${sharedPosts.length}`);

				console.log("\n📋 Sample items:");
				response.data.slice(0, 5).forEach((item, index) => {
					console.log(
						`   ${index + 1}. ${
							item.is_shared ? "🔄 SHARED" : "📝 ORIGINAL"
						} - "${item.title}" by ${item.users?.username}`
					);
				});
			}
		} catch (error) {
			if (error.response?.status === 401) {
				console.log("❌ EXPECTED: 401 Authentication required");
				console.log("   This confirms the endpoint exists and requires auth");
			} else {
				console.error(
					"❌ UNEXPECTED ERROR:",
					error.response?.status,
					error.response?.data
				);
			}
		}

		// Now let's compare with diagnostic data
		console.log("\n📊 Comparing with diagnostic data...");
		const diagnosticResponse = await axios.get(
			`${REMOTE_URL}/api/voice-notes/diagnostic/feed/${TEST_USER_ID}`
		);
		const diagnostic = diagnosticResponse.data;

		console.log(
			`Diagnostic shows: ${diagnostic.filteredPostsCount} posts from followed users`
		);
		console.log("Expected voice note IDs from followed users:");

		if (diagnostic.samplePosts?.filteredPosts) {
			diagnostic.samplePosts.filteredPosts
				.slice(0, 5)
				.forEach((post, index) => {
					console.log(
						`   ${index + 1}. ID: ${post.id} - "${post.title}" by ${
							post.username
						}`
					);
				});
		}
	} catch (error) {
		console.error("Error in test:", error.message);
	}
}

testDirectFeed();
