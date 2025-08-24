const { supabase, supabaseAdmin } = require("../../config/supabase");
const {
	uploadProfilePicture,
	uploadCoverPhoto,
} = require("../../utils/storage");

/**
 * Service layer for user profile management
 */

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User profile data
 */
const getUserById = async (userId) => {
	const { data, error } = await supabaseAdmin
		.from("users")
		.select("*")
		.eq("id", userId);

	if (error) throw error;

	if (!data || data.length === 0) {
		return null;
	}

	return data[0];
};

/**
 * Get user profile by username
 * @param {string} username - Username
 * @returns {Object|null} User profile data
 */
const getUserByUsername = async (username) => {
	const { data, error } = await supabaseAdmin
		.from("users")
		.select("*")
		.eq("username", username);

	if (error) throw error;

	if (!data || data.length === 0) {
		return null;
	}

	return data[0];
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Object} Updated user profile
 */
const updateUserProfile = async (userId, updates) => {
	// Remove any sensitive fields that shouldn't be updated directly
	const sanitizedUpdates = { ...updates };
	delete sanitizedUpdates.id;
	delete sanitizedUpdates.email;
	delete sanitizedUpdates.created_at;

	const { data, error } = await supabaseAdmin
		.from("users")
		.update(sanitizedUpdates)
		.eq("id", userId)
		.select()
		.single();

	if (error) throw error;

	if (!data) {
		throw new Error("User not found");
	}

	return data;
};

/**
 * Search for users based on username or display name
 * @param {string} searchTerm - Search term
 * @param {Object} options - Search options
 * @returns {Array} Array of matching users
 */
const searchUsers = async (searchTerm, options = {}) => {
	const { page = 1, limit = 20, excludeUserId = null } = options;

	const offset = (page - 1) * limit;

	if (!searchTerm || searchTerm.trim() === "") {
		return [];
	}

	const searchPattern = `%${searchTerm.toLowerCase()}%`;

	// Build the query
	let query = supabaseAdmin
		.from("users")
		.select("*", { count: "exact" })
		.or(`username.ilike.${searchPattern},display_name.ilike.${searchPattern}`)
		.order("is_verified", { ascending: false })
		.order("username");

	// Exclude the current user if specified
	if (excludeUserId) {
		query = query.neq("id", excludeUserId);
	}

	// Add pagination
	query = query.range(offset, offset + parseInt(limit) - 1);

	const { data, error, count } = await query;

	if (error) throw error;

	return {
		data,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: count,
			totalPages: Math.ceil(count / limit),
		},
	};
};

/**
 * Update user verification status
 * @param {string} userId - User ID
 * @param {boolean} isVerified - Verification status
 * @returns {Object} Updated user data
 */
const updateVerificationStatus = async (userId, isVerified) => {
	// Check if user exists first
	const { data: userData, error: userError } = await supabaseAdmin
		.from("users")
		.select("id")
		.eq("id", userId)
		.single();

	if (userError || !userData) {
		throw new Error("User not found");
	}

	// Update verification status
	const { data, error } = await supabaseAdmin
		.from("users")
		.update({
			is_verified: isVerified,
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId)
		.select()
		.single();

	if (error) {
		if (error.code === "42703") {
			throw new Error(
				"is_verified column does not exist. Please run the SQL migration script."
			);
		}
		throw error;
	}

	return data;
};

/**
 * Update user profile photos
 * @param {string} userId - User ID
 * @param {Array} photos - Array of photo URLs
 * @returns {Object} Updated user data
 */
const updateProfilePhotos = async (userId, photos) => {
	if (!photos || !Array.isArray(photos)) {
		throw new Error("photos array is required");
	}

	// Check if user exists first
	const { data: userData, error: userError } = await supabaseAdmin
		.from("users")
		.select("id")
		.eq("id", userId)
		.single();

	if (userError || !userData) {
		throw new Error("User not found");
	}

	// Update profile photos
	const { data, error } = await supabaseAdmin
		.from("users")
		.update({
			profile_photos: photos,
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId)
		.select()
		.single();

	if (error) {
		if (error.code === "42703") {
			throw new Error(
				"profile_photos column does not exist. Please run the SQL migration script."
			);
		}
		throw error;
	}

	return data;
};

module.exports = {
	getUserById,
	getUserByUsername,
	updateUserProfile,
	searchUsers,
	updateVerificationStatus,
	updateProfilePhotos,
};

/**
 * Upload profile picture to storage and set users.avatar_url
 * @param {string} userId
 * @param {{name:string,mimetype:string,buffer:Buffer}} file
 * @returns {Promise<object>} Updated user
 */
async function uploadAndSetAvatar(userId, file) {
	if (!userId) throw new Error("userId is required");
	if (!file) throw new Error("file is required");

	// Ensure user exists
	const { data: userData, error: userError } = await supabaseAdmin
		.from("users")
		.select("id")
		.eq("id", userId)
		.single();
	if (userError || !userData) throw new Error("User not found");

	const publicUrl = await uploadProfilePicture(userId, file);

	const { data, error } = await supabaseAdmin
		.from("users")
		.update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
		.eq("id", userId)
		.select()
		.single();
	if (error) throw error;
	return data;
}

/**
 * Upload cover photo to storage and set users.cover_photo_url
 * @param {string} userId
 * @param {{name:string,mimetype:string,buffer:Buffer}} file
 * @returns {Promise<object>} Updated user
 */
async function uploadAndSetCoverPhoto(userId, file) {
	if (!userId) throw new Error("userId is required");
	if (!file) throw new Error("file is required");

	const { data: userData, error: userError } = await supabaseAdmin
		.from("users")
		.select("id")
		.eq("id", userId)
		.single();
	if (userError || !userData) throw new Error("User not found");

	const publicUrl = await uploadCoverPhoto(userId, file);

	const { data, error } = await supabaseAdmin
		.from("users")
		.update({
			cover_photo_url: publicUrl,
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId)
		.select()
		.single();
	if (error) throw error;
	return data;
}

// Export new helpers at end to keep existing named exports intact above
module.exports.uploadAndSetAvatar = uploadAndSetAvatar;
module.exports.uploadAndSetCoverPhoto = uploadAndSetCoverPhoto;
