const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const REMOTE_URL = "https://ripply-backend.onrender.com";
const TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d";

const supabaseUrl = "https://kxuczrnakuybcgpnxclb.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWN6cm5ha3V5YmNncG54Y2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMTc3ODIsImV4cCI6MjA0NjU5Mzc4Mn0.D7tKw-Ae8-vOC_PLFF9GVyQ0nP7b4jV--XEmbN5mP_A";
const supabase = createClient(supabaseUrl, supabaseKey);

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

async function investigateFeedResponse() {
	console.log("🔍 INVESTIGATING FEED RESPONSE - Why only 2 original posts?");
	console.log("=".repeat(60));

	const testUserId = "7b92c915-c931-4792-ada1-da94fcb6104d"; // Your user ID from logs

	try {
		// Step 1: Check who you follow
		const { data: followingData } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", testUserId);

		const followingIds = followingData?.map((f) => f.following_id) || [];
		console.log(`\n1. You follow ${followingIds.length} users:`);
		followingIds.forEach((id, idx) => {
			console.log(`   ${idx + 1}. ${id}`);
		});

		if (followingIds.length === 0) {
			console.log("❌ You follow no users - that explains the empty feed!");
			return;
		}

		// Step 2: Check ALL original posts from followed users (no pagination)
		const { data: allOriginalPosts } = await supabase
			.from("voice_notes")
			.select("id, user_id, title, created_at")
			.in("user_id", followingIds)
			.order("created_at", { ascending: false });

		console.log(
			`\n2. TOTAL original posts from followed users: ${
				allOriginalPosts?.length || 0
			}`
		);

		if (allOriginalPosts && allOriginalPosts.length > 0) {
			console.log("\n   Breakdown by user:");
			const postsByUser = {};
			allOriginalPosts.forEach((post) => {
				if (!postsByUser[post.user_id]) {
					postsByUser[post.user_id] = [];
				}
				postsByUser[post.user_id].push(post);
			});

			Object.entries(postsByUser).forEach(([userId, posts]) => {
				console.log(`   User ${userId}: ${posts.length} posts`);
				posts.slice(0, 3).forEach((post) => {
					console.log(`     - "${post.title}" (${post.created_at})`);
				});
				if (posts.length > 3) {
					console.log(`     ... and ${posts.length - 3} more`);
				}
			});
		}

		// Step 3: Simulate the backend's exact query for original posts
		console.log(`\n3. Simulating backend's EXACT original posts query:`);
		const { data: backendOriginalQuery } = await supabase
			.from("voice_notes")
			.select(
				`
				*,
				users:user_id (id, username, display_name, avatar_url),
				likes:voice_note_likes (count),
				comments:voice_note_comments (count),
				plays:voice_note_plays (count),
				shares:voice_note_shares (count),
				tags:voice_note_tags (tag_name)
			`
			)
			.in("user_id", followingIds)
			.order("created_at", { ascending: false });

		console.log(
			`   Backend original query returned: ${
				backendOriginalQuery?.length || 0
			} posts`
		);

		// Step 4: Call the actual production API
		console.log(`\n4. Calling production API directly:`);
		try {
			const response = await fetch(
				`https://ripply-backend.onrender.com/api/voice-notes/feed/${testUserId}`,
				{
					headers: {
						Authorization: "Bearer dummy-token-for-test",
					},
				}
			);

			if (response.ok) {
				const apiData = await response.json();
				const originalFromAPI = apiData.filter(
					(item) => item.is_shared === false
				);
				const sharedFromAPI = apiData.filter((item) => item.is_shared === true);

				console.log(`   API returned ${apiData.length} total items:`);
				console.log(`   - Original posts: ${originalFromAPI.length}`);
				console.log(`   - Shared posts: ${sharedFromAPI.length}`);

				console.log(`\n   🔍 API Original posts:`);
				originalFromAPI.forEach((post, idx) => {
					console.log(
						`     ${idx + 1}. "${post.title}" by ${post.users?.username} (${
							post.user_id
						})`
					);
				});

				// Check if any expected original posts are missing
				const apiOriginalIds = new Set(originalFromAPI.map((p) => p.id));
				const missingPosts =
					allOriginalPosts?.filter((p) => !apiOriginalIds.has(p.id)) || [];

				if (missingPosts.length > 0) {
					console.log(
						`\n   ❌ MISSING from API (${missingPosts.length} posts):`
					);
					missingPosts.slice(0, 5).forEach((post) => {
						console.log(`     - "${post.title}" by ${post.user_id}`);
					});
				}
			} else {
				console.log(`   API Error: ${response.status} ${response.statusText}`);
				const errorText = await response.text();
				console.log(`   Error details: ${errorText}`);
			}
		} catch (apiError) {
			console.log(`   API call failed: ${apiError.message}`);
		}

		// Step 5: Check for pagination issues
		console.log(`\n5. Checking for pagination issues:`);
		console.log(`   Expected original posts: ${allOriginalPosts?.length || 0}`);
		console.log(`   API default limit: 10`);
		console.log(`   If expected > 10, pagination might be hiding posts`);
	} catch (error) {
		console.error("❌ Investigation error:", error);
	}
}

testFeedResponse();
investigateFeedResponse();
