const axios = require("axios");

const REMOTE_URL = "https://ripply-backend.onrender.com";
const TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d";

async function testFeedResponse() {
	console.log("🔍 Testing Feed Response Content");
	console.log("================================");

	// First, let's verify the diagnostic data
	try {
		console.log("📊 Checking diagnostic data...");
		const diagnosticResponse = await axios.get(
			`${REMOTE_URL}/api/voice-notes/diagnostic/feed/${TEST_USER_ID}`
		);
		const diagnostic = diagnosticResponse.data;

		console.log(`✅ Following ${diagnostic.followsCount} users`);
		console.log(
			`✅ Expected ${diagnostic.filteredPostsCount} original posts from followed users`
		);

		if (diagnostic.samplePosts?.filteredPosts) {
			console.log(
				"\n📝 Expected original posts (should have is_shared: false):"
			);
			diagnostic.samplePosts.filteredPosts
				.slice(0, 3)
				.forEach((post, index) => {
					console.log(
						`   ${index + 1}. ID: ${post.id} - "${post.title}" by ${
							post.username
						}`
					);
				});
		}

		// Now let's test what happens when we call the feed endpoint without auth
		// This should fail but might give us clues
		console.log("\n🔐 Testing feed endpoint (will fail due to auth)...");
		try {
			const feedResponse = await axios.get(
				`${REMOTE_URL}/api/voice-notes/feed/${TEST_USER_ID}`
			);
			console.log("❌ Unexpected: Feed endpoint worked without auth");
			console.log("Response:", JSON.stringify(feedResponse.data, null, 2));
		} catch (error) {
			if (error.response?.status === 401) {
				console.log("✅ Expected: 401 Authentication required");
				console.log("   Feed endpoint is properly protected");
			} else {
				console.log(
					`❌ Unexpected error: ${error.response?.status} - ${
						error.response?.data?.message || error.message
					}`
				);
			}
		}

		// Let's also check if the debug-feed endpoint is working
		console.log("\n🐛 Testing debug feed endpoint...");
		try {
			const debugResponse = await axios.get(
				`${REMOTE_URL}/api/voice-notes/debug-feed/${TEST_USER_ID}`
			);
			console.log("✅ Debug feed endpoint response:");

			const data = debugResponse.data;
			console.log(`   Following: ${data.followingCount} users`);
			console.log(`   Original posts: ${data.originalPosts.count}`);
			console.log(`   Shared posts: ${data.sharedPosts.count}`);
			console.log(`   Combined total: ${data.combined.length}`);

			if (data.combined.length > 0) {
				console.log("\n📋 First 3 combined posts:");
				data.combined.slice(0, 3).forEach((post, index) => {
					console.log(
						`   ${index + 1}. ${
							post.is_shared ? "🔄 SHARED" : "📝 ORIGINAL"
						} - ID: ${post.id} - "${post.title}" by ${post.username}${
							post.shared_by ? ` (shared by ${post.shared_by})` : ""
						}`
					);
				});
			}
		} catch (error) {
			console.log(
				`❌ Debug endpoint error: ${error.response?.status} - ${
					error.response?.data?.message || error.message
				}`
			);
		}
	} catch (error) {
		console.error("❌ Error in test:", error.message);
	}
}

testFeedResponse();
