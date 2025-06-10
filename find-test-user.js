const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = "https://kxuczrnakuybcgpnxclb.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dWN6cm5ha3V5YmNncG54Y2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMTc3ODIsImV4cCI6MjA0NjU5Mzc4Mn0.D7tKw-Ae8-vOC_PLFF9GVyQ0nP7b4jV--XEmbN5mP_A";
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTestUser() {
	console.log("\n🔍 FINDING SUITABLE TEST USER FOR FEED ANALYSIS");
	console.log("=".repeat(50));

	try {
		// Get all users
		const { data: users } = await supabase
			.from("users")
			.select("id, username, display_name")
			.limit(20);

		console.log(`\n📋 Found ${users?.length || 0} users:`);
		if (users) {
			users.forEach((user, idx) => {
				console.log(
					`  ${idx + 1}. ${user.username} (${user.display_name}) - ID: ${
						user.id
					}`
				);
			});
		} else {
			console.log("  No users found!");
			return null;
		}

		// Check follow relationships
		const { data: follows } = await supabase
			.from("follows")
			.select("follower_id, following_id")
			.limit(50);

		console.log(`\n🔗 Found ${follows?.length || 0} follow relationships:`);

		if (!follows || follows.length === 0) {
			console.log("  No follow relationships found!");
			return null;
		}

		// Group by follower to find users who follow others
		const followerCounts = {};
		follows.forEach((follow) => {
			if (!followerCounts[follow.follower_id]) {
				followerCounts[follow.follower_id] = 0;
			}
			followerCounts[follow.follower_id]++;
		});

		console.log("\n👥 Users who follow others:");
		Object.entries(followerCounts).forEach(([followerId, count]) => {
			const user = users.find((u) => u.id === followerId);
			console.log(
				`  ${
					user?.username || "Unknown"
				} (${followerId}) follows ${count} users`
			);
		});

		// Find the user with most follows for testing
		const bestTestUser = Object.entries(followerCounts).sort(
			([, a], [, b]) => b - a
		)[0];

		if (bestTestUser) {
			const [userId, followCount] = bestTestUser;
			const user = users.find((u) => u.id === userId);
			console.log(`\n🎯 RECOMMENDED TEST USER: ${user?.username} (${userId})`);
			console.log(`   Follows ${followCount} users - perfect for feed testing`);

			// Show who they follow
			const { data: theirFollows } = await supabase
				.from("follows")
				.select("following_id")
				.eq("follower_id", userId);

			console.log(`\n   They follow:`);
			theirFollows.forEach((follow) => {
				const followedUser = users.find((u) => u.id === follow.following_id);
				console.log(
					`   - ${followedUser?.username || "Unknown"} (${follow.following_id})`
				);
			});

			return userId;
		} else {
			console.log("\n❌ No users with follows found!");
			return null;
		}
	} catch (error) {
		console.error("❌ Error finding test user:", error);
		return null;
	}
}

findTestUser();
