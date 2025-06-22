/**
 * User model for Ripply app
 * Provides methods for user operations with Supabase
 */
const supabase = require("../config/supabase");

class User {
	/**
	 * Find a user by ID
	 * @param {string} id - User ID
	 * @returns {Promise<Object|null>} - User object or null if not found
	 */
	static async findById(id) {
		if (!id) {
			throw new Error("User ID is required");
		}

		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", id)
				.single();

			if (error) {
				if (error.code === "PGRST116") return null; // Not found
				throw new Error("Database error");
			}
			return data;
		} catch (error) {
			if (
				error.message === "User ID is required" ||
				error.message === "Database error"
			) {
				throw error;
			}
			console.error("Error finding user by ID:", error);
			throw new Error("Unexpected error");
		}
	}

	/**
	 * Find a user by email
	 * @param {string} email - User email
	 * @returns {Promise<Object|null>} - User object or null if not found
	 */
	static async findByEmail(email) {
		if (!email) {
			throw new Error("Email is required");
		}

		this._validateEmail(email);

		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("email", email.toLowerCase())
				.single();

			if (error && error.code !== "PGRST116") throw error;
			return data || null;
		} catch (error) {
			if (
				error.message === "Email is required" ||
				error.message === "Invalid email format"
			) {
				throw error;
			}
			console.error("Error finding user by email:", error);
			return null;
		}
	}

	/**
	 * Find a user by username
	 * @param {string} username - Username
	 * @returns {Promise<Object|null>} - User object or null if not found
	 */
	static async findByUsername(username) {
		if (!username) {
			throw new Error("Username is required");
		}

		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("username", username.toLowerCase())
				.single();

			if (error && error.code !== "PGRST116") throw error;
			return data || null;
		} catch (error) {
			if (error.message === "Username is required") {
				throw error;
			}
			console.error("Error finding user by username:", error);
			return null;
		}
	}

	/**
	 * Create a new user
	 * @param {Object} userData - User data
	 * @returns {Promise<Object|null>} - Created user or null if error
	 */
	static async create(userData) {
		if (!userData || !userData.username || !userData.email) {
			throw new Error("Username and email are required");
		}

		this._validateEmail(userData.email);
		this._validateUsername(userData.username);

		try {
			const { data, error } = await supabase
				.from("users")
				.insert([
					{
						...userData,
						email: userData.email.toLowerCase(),
						username: userData.username.toLowerCase(),
					},
				])
				.select();

			if (error) {
				if (error.code === "23505") {
					// Unique constraint violation
					throw new Error("Username or email already exists");
				}
				throw error;
			}

			// Return first item from the array if data exists
			return data && data.length > 0 ? data[0] : null;
		} catch (error) {
			if (
				error.message === "Username and email are required" ||
				error.message === "Invalid email format" ||
				error.message ===
					"Username can only contain letters, numbers, and underscores" ||
				error.message === "Username or email already exists"
			) {
				throw error;
			}
			console.error("Error creating user:", error);
			return null;
		}
	}

	/**
	 * Update a user
	 * @param {string} id - User ID
	 * @param {Object} updates - Fields to update
	 * @returns {Promise<Object|null>} - Updated user or null if error
	 */
	static async update(id, updates) {
		if (!id) {
			throw new Error("User ID is required");
		}

		if (!updates || Object.keys(updates).length === 0) {
			throw new Error("Update data is required");
		}

		// Check for restricted fields
		const restrictedFields = ["id", "created_at"];
		const hasRestrictedField = Object.keys(updates).some((field) =>
			restrictedFields.includes(field)
		);
		if (hasRestrictedField) {
			throw new Error("Cannot update restricted fields");
		}

		// Validate email if provided
		if (updates.email) {
			this._validateEmail(updates.email);
			updates.email = updates.email.toLowerCase();
		}

		try {
			const { data, error } = await supabase
				.from("users")
				.update(updates)
				.eq("id", id)
				.select();

			if (error) {
				if (error.code === "PGRST116") {
					throw new Error("User not found");
				}
				throw error;
			}

			// Check if user was found and updated
			if (!data || data.length === 0) {
				throw new Error("User not found");
			}

			return data[0];
		} catch (error) {
			if (
				error.message === "User ID is required" ||
				error.message === "Update data is required" ||
				error.message === "Cannot update restricted fields" ||
				error.message === "Invalid email format" ||
				error.message === "User not found"
			) {
				throw error;
			}
			console.error("Error updating user:", error);
			return null;
		}
	}

	/**
	 * Delete a user
	 * @param {string} id - User ID
	 * @returns {Promise<boolean>} - Success status
	 */
	static async delete(id) {
		if (!id) {
			throw new Error("User ID is required");
		}

		try {
			const { error } = await supabase.from("users").delete().eq("id", id);

			if (error) throw new Error("Deletion failed");
			return true;
		} catch (error) {
			if (
				error.message === "User ID is required" ||
				error.message === "Deletion failed"
			) {
				throw error;
			}
			console.error("Error deleting user:", error);
			return false;
		}
	}

	/**
	 * Search users by query
	 * @param {string} query - Search query
	 * @param {number} limit - Maximum results (default: 10)
	 * @returns {Promise<Array>} - Array of users
	 */
	static async search(query, limit = 10) {
		if (!query) {
			throw new Error("Search query is required");
		}

		try {
			let queryBuilder = supabase
				.from("users")
				.select("id, username, display_name")
				.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);

			if (limit) {
				queryBuilder = queryBuilder.limit(limit);
			}

			const { data, error } = await queryBuilder;

			if (error) throw error;
			return data || [];
		} catch (error) {
			if (error.message === "Search query is required") {
				throw error;
			}
			console.error("Error searching users:", error);
			return [];
		}
	}

	/**
	 * Get follower count for a user
	 * @param {string} userId - User ID
	 * @returns {Promise<number>} - Follower count
	 */
	static async getFollowerCount(userId) {
		if (!userId) {
			throw new Error("User ID is required");
		}

		try {
			const { count, error } = await supabase
				.from("follows")
				.select("*", { count: "exact", head: true })
				.eq("following_id", userId);

			if (error) throw error;
			return count || 0;
		} catch (error) {
			if (error.message === "User ID is required") {
				throw error;
			}
			console.error("Error getting follower count:", error);
			return 0;
		}
	}

	/**
	 * Get following count for a user
	 * @param {string} userId - User ID
	 * @returns {Promise<number>} - Following count
	 */
	static async getFollowingCount(userId) {
		if (!userId) {
			throw new Error("User ID is required");
		}

		try {
			const { count, error } = await supabase
				.from("follows")
				.select("*", { count: "exact", head: true })
				.eq("follower_id", userId);

			if (error) throw error;
			return count || 0;
		} catch (error) {
			if (error.message === "User ID is required") {
				throw error;
			}
			console.error("Error getting following count:", error);
			return 0;
		}
	}

	/**
	 * Check if user is following another user
	 * @param {string} followerId - Follower user ID
	 * @param {string} followingId - Following user ID
	 * @returns {Promise<boolean>} - Following status
	 */
	static async isFollowing(followerId, followingId) {
		if (!followerId || !followingId) {
			throw new Error("Both user IDs are required");
		}

		try {
			const { data, error } = await supabase
				.from("follows")
				.select("id")
				.eq("follower_id", followerId)
				.eq("following_id", followingId)
				.single();

			if (error && error.code !== "PGRST116") throw error;
			return !!data;
		} catch (error) {
			if (error.message === "Both user IDs are required") {
				throw error;
			}
			console.error("Error checking following status:", error);
			return false;
		}
	}

	/**
	 * Validate email format
	 * @param {string} email - Email to validate
	 * @throws {Error} If email is invalid
	 */
	static _validateEmail(email) {
		if (!email) {
			throw new Error("Email is required");
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new Error("Invalid email format");
		}
	}

	/**
	 * Validate username format
	 * @param {string} username - Username to validate
	 * @throws {Error} If username is invalid
	 */
	static _validateUsername(username) {
		if (!username) {
			throw new Error("Username is required");
		}

		const usernameRegex = /^[a-zA-Z0-9_]+$/;
		if (!usernameRegex.test(username)) {
			throw new Error(
				"Username can only contain letters, numbers, and underscores"
			);
		}
	}
}

module.exports = User;
