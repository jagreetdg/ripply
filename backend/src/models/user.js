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
		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Error finding user by ID:", error);
			return null;
		}
	}

	/**
	 * Find a user by email
	 * @param {string} email - User email
	 * @returns {Promise<Object|null>} - User object or null if not found
	 */
	static async findByEmail(email) {
		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("email", email)
				.single();

			if (error && error.code !== "PGRST116") throw error;
			return data || null;
		} catch (error) {
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
		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("username", username)
				.single();

			if (error && error.code !== "PGRST116") throw error;
			return data || null;
		} catch (error) {
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
		try {
			const { data, error } = await supabase
				.from("users")
				.insert([userData])
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
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
		try {
			const { data, error } = await supabase
				.from("users")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Error updating user:", error);
			return null;
		}
	}
}

module.exports = User;
