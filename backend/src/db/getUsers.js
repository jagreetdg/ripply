// Database utility to get users from Supabase
const { supabase, supabaseAdmin } = require("../config/supabase");
require("dotenv").config();

console.log("Connecting to Supabase at:", process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Get users with optional filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records to return
 * @param {string} options.search - Search term for username or display name
 * @returns {Promise<Array>} - Array of users
 */
async function getUsers(options = {}) {
	try {
		const { limit = 10, search } = options;

		let query = supabaseAdmin
			.from("users")
			.select(
				"id, username, display_name, avatar_url, is_verified, created_at"
			);

		if (search) {
			query = query.or(
				`username.ilike.%${search}%,display_name.ilike.%${search}%`
			);
		}

		const { data: users, error } = await query
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			throw error;
		}

		return users || [];
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
}

async function createSampleUsers() {
	try {
		const sampleUsers = [
			{
				username: "alice",
				email: "alice@example.com",
				display_name: "Alice Johnson",
				bio: "Love sharing voice notes about my daily adventures!",
			},
			{
				username: "bob",
				email: "bob@example.com",
				display_name: "Bob Smith",
				bio: "Tech enthusiast and voice note creator",
			},
			{
				username: "charlie",
				email: "charlie@example.com",
				display_name: "Charlie Brown",
				bio: "Musician sharing audio snippets",
			},
		];

		const { data: users, error } = await supabase
			.from("users")
			.insert(sampleUsers)
			.select();

		if (error) {
			console.error("Error creating users:", error);
			return;
		}

		console.log("Created sample users:");
		console.log(JSON.stringify(users, null, 2));
	} catch (error) {
		console.error("Error creating sample users:", error);
	}
}

// Export the function for use in tests and other modules
module.exports = {
	getUsers,
	createSampleUsers,
};

// Only run the script if this file is executed directly
if (require.main === module) {
	async function runScript() {
		try {
			const users = await getUsers();
			console.log("Users in database:");
			console.log(JSON.stringify(users, null, 2));

			if (users.length === 0) {
				console.log("No users found. Creating sample users...");
				await createSampleUsers();
			}
		} catch (error) {
			console.error("Unexpected error:", error);
		}
	}

	runScript();
}
