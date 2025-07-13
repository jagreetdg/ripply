// Database utility to get follows from Supabase
const { supabase, supabaseAdmin } = require("../config/supabase");
require("dotenv").config();

/**
 * Get follows with optional filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records to return
 * @param {string} options.userId - Filter by user ID
 * @returns {Promise<Array>} - Array of follows
 */
async function getFollows(options = {}) {
	try {
		const { limit = 10, userId } = options;

		let query = supabaseAdmin.from("follows").select(`
      *,
      follower:follower_id (id, username, display_name, avatar_url),
      following:following_id (id, username, display_name, avatar_url)
    `);

		if (userId) {
			query = query.eq("follower_id", userId);
		}

		const { data, error } = await query
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("Error fetching follows:", error);
		throw error;
	}
}

/**
 * Get followers for a user
 * @param {string} userId - User ID to get followers for
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of followers
 */
async function getFollowers(userId, options = {}) {
	try {
		const { limit = 10 } = options;

		const { data: users, error: usersError } = await supabaseAdmin
			.from("users")
			.select("id, username, display_name, avatar_url, is_verified")
			.eq("id", userId)
			.single();

		if (usersError) {
			throw usersError;
		}

		if (!users) {
			return [];
		}

		const { data: follows, error: followsError } = await supabaseAdmin
			.from("follows")
			.select(
				`
        *,
        follower:follower_id (id, username, display_name, avatar_url, is_verified)
      `
			)
			.eq("following_id", userId)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (followsError) {
			throw followsError;
		}

		return follows || [];
	} catch (error) {
		console.error("Error fetching followers:", error);
		throw error;
	}
}

/**
 * Get all follows
 * @returns {Promise<Array>} - Array of all follows
 */
async function getAllFollows() {
	try {
		const { data, error } = await supabaseAdmin.from("follows").select("*");

		if (error) {
			throw error;
		}

		return data || [];
	} catch (error) {
		console.error("Error fetching all follows:", error);
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
