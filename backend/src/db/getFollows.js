// Database utility to get follows from Supabase
const supabase = require("../config/supabase");
require("dotenv").config();

/**
 * Get follows with user information
 * @param {string} userId - User ID
 * @param {string} relationshipType - 'followers' or 'following'
 * @returns {Promise<Array>} - Array of follow relationships with user data
 */
async function getFollows(userId, relationshipType) {
	try {
		// Validate inputs
		if (!userId) {
			throw new Error("User ID is required");
		}

		if (
			!relationshipType ||
			!["followers", "following"].includes(relationshipType)
		) {
			throw new Error(
				'Invalid relationship type. Must be "followers" or "following"'
			);
		}

		// Build query based on relationship type
		let query = supabase.from("follows").select(`
        *,
        follower:users!follower_id(id, username, display_name, avatar_url, is_verified),
        following:users!following_id(id, username, display_name, avatar_url, is_verified)
      `);

		// Apply appropriate filter
		if (relationshipType === "followers") {
			query = query.eq("following_id", userId);
		} else {
			query = query.eq("follower_id", userId);
		}

		const { data, error } = await query
			.order("created_at", { ascending: false })
			.limit(100); // Default limit

		if (error) {
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("Unexpected error:", error);
		throw error;
	}
}

async function createSampleFollows() {
	try {
		// Get users
		const { data: users, error: usersError } = await supabase
			.from("users")
			.select("id");
		if (usersError) {
			console.error("Error fetching users:", usersError);
			return;
		}
		// Each user follows the next user (circular)
		const followsData = [];
		for (let i = 0; i < users.length; i++) {
			followsData.push({
				follower_id: users[i].id,
				following_id: users[(i + 1) % users.length].id,
			});
		}
		const { data: follows, error: followsError } = await supabase
			.from("follows")
			.insert(followsData)
			.select();
		if (followsError) {
			console.error("Error creating follows:", followsError);
			return;
		}
		console.log("Created sample follows:");
		console.log(JSON.stringify(follows, null, 2));
	} catch (error) {
		console.error("Error creating sample follows:", error);
	}
}

// Export the function for use in tests and other modules
module.exports = {
	getFollows,
	createSampleFollows,
};

// Only run the script if this file is executed directly
if (require.main === module) {
	async function runScript() {
		try {
			const { data, error } = await supabase.from("follows").select("*");
			if (error) {
				console.error("Error fetching follows:", error);
				return;
			}
			console.log("Follows in database:");
			console.log(JSON.stringify(data, null, 2));
			if (data.length === 0) {
				console.log("No follows found. Creating sample follows...");
				await createSampleFollows();
			}
		} catch (error) {
			console.error("Unexpected error:", error);
		}
	}

	runScript();
}
