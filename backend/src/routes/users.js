const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { authenticateToken } = require("../middleware/auth");

// Get current authenticated user - REQUIRES AUTHENTICATION
router.get("/me", authenticateToken, async (req, res) => {
	try {
		// Since the authenticateToken middleware has already attached the user to req.user,
		// we can simply return it
		console.log("[DEBUG] Returning authenticated user info from /me endpoint");

		// The user is already attached to the request by the authenticateToken middleware
		if (!req.user) {
			return res.status(401).json({ message: "User not authenticated" });
		}

		res.status(200).json(req.user);
	} catch (error) {
		console.error("[ERROR] Error fetching current user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Search for users based on username or display name - REQUIRES AUTHENTICATION
router.get("/search", authenticateToken, async (req, res) => {
	try {
		const { term, currentUserId } = req.query;
		const { page = 1, limit = 20 } = req.query;
		const offset = (page - 1) * limit;

		console.log(`[DEBUG] Searching for users with term: "${term}"`);

		if (!term || term.trim() === "") {
			return res.status(200).json([]);
		}

		const searchTerm = `%${term.toLowerCase()}%`;

		// Build the query
		let query = supabase
			.from("users")
			.select("*", { count: "exact" })
			.or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
			.order("is_verified", { ascending: false })
			.order("username");

		// Exclude the current user if currentUserId is provided
		if (currentUserId) {
			console.log(
				`[DEBUG] Excluding current user: ${currentUserId} from search results`
			);
			query = query.neq("id", currentUserId);
		}

		// Add pagination
		query = query.range(offset, offset + parseInt(limit) - 1);

		const { data, error, count } = await query;

		if (error) {
			console.error("[ERROR] Error searching users:", error);
			throw error;
		}

		// Return the results
		console.log(`[DEBUG] Found ${data.length} users matching "${term}"`);
		res.status(200).json(data);
	} catch (error) {
		console.error("Error searching users:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get user profile
router.get("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// First check if the user exists without using .single()
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", userId);

		if (error) throw error;

		if (!data || data.length === 0) {
			console.log(`User not found with ID: ${userId}`);
			return res.status(404).json({ message: "User not found" });
		}

		// Return the first user found (should be only one)
		res.status(200).json(data[0]);
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Update user profile - REQUIRES AUTHENTICATION
router.put("/:userId", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const updates = req.body;

		// Remove any sensitive fields that shouldn't be updated directly
		delete updates.id;
		delete updates.email;
		delete updates.created_at;

		const { data, error } = await supabase
			.from("users")
			.update(updates)
			.eq("id", userId)
			.select()
			.single();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get user's followers - REQUIRES AUTHENTICATION
router.get("/:userId/followers", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;

		const { data, error } = await supabase
			.from("follows")
			.select("follower_id, users!follower_id(*)")
			.eq("following_id", userId);

		if (error) throw error;

		res.status(200).json(data);
	} catch (error) {
		console.error("Error fetching followers:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get users that a user is following - REQUIRES AUTHENTICATION
router.get("/:userId/following", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;

		const { data, error } = await supabase
			.from("follows")
			.select("following_id, users!following_id(*)")
			.eq("follower_id", userId);

		if (error) throw error;

		res.status(200).json(data);
	} catch (error) {
		console.error("Error fetching following:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Follow a user - REQUIRES AUTHENTICATION
router.post("/:userId/follow", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const { followerId } = req.body;

		console.log(
			`[DEBUG] Follow request: userId=${userId}, followerId=${followerId}`
		);

		// Check if already following
		const { data: existingFollow, error: checkError } = await supabase
			.from("follows")
			.select("*")
			.eq("follower_id", followerId)
			.eq("following_id", userId)
			.single();

		if (checkError && checkError.code !== "PGRST116") {
			console.error("[ERROR] Error checking existing follow:", checkError);
			throw checkError;
		}

		if (existingFollow) {
			console.log("[DEBUG] Already following this user");
			return res.status(400).json({ message: "Already following this user" });
		}

		// Create follow relationship
		console.log("[DEBUG] Creating new follow relationship");
		const { data, error } = await supabase
			.from("follows")
			.insert([{ follower_id: followerId, following_id: userId }])
			.select()
			.single();

		if (error) {
			console.error("[ERROR] Error inserting follow:", error);
			throw error;
		}

		console.log("[DEBUG] Follow relationship created successfully:", data);
		res.status(201).json(data);
	} catch (error) {
		console.error("Error following user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Unfollow a user - REQUIRES AUTHENTICATION
router.post("/:userId/unfollow", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const { followerId } = req.body;

		console.log(
			`[DEBUG] Unfollow request: userId=${userId}, followerId=${followerId}`
		);

		// Check if the follow relationship exists first
		const { data: existingFollow, error: checkError } = await supabase
			.from("follows")
			.select("*")
			.eq("follower_id", followerId)
			.eq("following_id", userId)
			.single();

		if (checkError && checkError.code !== "PGRST116") {
			console.error(
				"[ERROR] Error checking existing follow for unfollow:",
				checkError
			);
		}

		if (!existingFollow) {
			console.log("[DEBUG] No follow relationship found to delete");
			return res
				.status(404)
				.json({ message: "Not currently following this user" });
		}

		console.log("[DEBUG] Deleting follow relationship");
		const { error } = await supabase
			.from("follows")
			.delete()
			.eq("follower_id", followerId)
			.eq("following_id", userId);

		if (error) {
			console.error("[ERROR] Error deleting follow:", error);
			throw error;
		}

		console.log("[DEBUG] Follow relationship deleted successfully");
		res.status(200).json({ message: "Unfollowed successfully" });
	} catch (error) {
		console.error("Error unfollowing user:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get voice notes by user - REQUIRES AUTHENTICATION
router.get("/:userId/voice-notes", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const offset = (page - 1) * limit;

		const { data, error, count } = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        tags:voice_note_tags (tag_name)
      `,
				{ count: "exact" }
			)
			.eq("user_id", userId)
			.order("created_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		if (error) throw error;

		// Process the data to format tags
		const processedData = data.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			return {
				...note,
				tags,
			};
		});

		res.status(200).json({
			data: processedData,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: count,
			},
		});
	} catch (error) {
		console.error("Error fetching user voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get user by username
router.get("/username/:username", async (req, res) => {
	try {
		const { username } = req.params;

		// First check if the user exists without using .single()
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("username", username);

		if (error) throw error;

		if (!data || data.length === 0) {
			console.log(`User not found with username: ${username}`);
			return res.status(404).json({ message: "User not found" });
		}

		// Return the first user found (should be only one)
		res.status(200).json(data[0]);
	} catch (error) {
		console.error("Error fetching user by username:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Update user verification status
router.patch("/:userId/verify", async (req, res) => {
	try {
		const { userId } = req.params;
		const { isVerified } = req.body;

		if (isVerified === undefined) {
			return res.status(400).json({ message: "isVerified field is required" });
		}

		// Check if user exists
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("id")
			.eq("id", userId)
			.single();

		if (userError || !userData) {
			return res.status(404).json({ message: "User not found" });
		}

		// Update user verification status
		const { data, error } = await supabase
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
				// Column doesn't exist yet
				return res.status(400).json({
					message: "is_verified column does not exist",
					note: "Please run the SQL script in the Supabase SQL Editor to add the necessary columns",
				});
			}
			throw error;
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("Error updating user verification status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Update user profile photos
router.patch("/:userId/photos", async (req, res) => {
	try {
		const { userId } = req.params;
		const { photos } = req.body;

		if (!photos || !Array.isArray(photos)) {
			return res.status(400).json({ message: "photos array is required" });
		}

		// Check if user exists
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("id")
			.eq("id", userId)
			.single();

		if (userError || !userData) {
			return res.status(404).json({ message: "User not found" });
		}

		// Update user profile photos
		const { data, error } = await supabase
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
				// Column doesn't exist yet
				return res.status(400).json({
					message: "profile_photos column does not exist",
					note: "Please run the SQL script in the Supabase SQL Editor to add the necessary columns",
				});
			}
			throw error;
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("Error updating user profile photos:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Check if a user is following another user
router.get("/:userId/is-following/:followerId", async (req, res) => {
	try {
		const { userId, followerId } = req.params;

		console.log(
			`[DEBUG] Checking if user ${followerId} is following ${userId}`
		);

		const { data, error } = await supabase
			.from("follows")
			.select("*")
			.eq("follower_id", followerId)
			.eq("following_id", userId)
			.single();

		if (error && error.code !== "PGRST116") {
			console.error("[ERROR] Error checking follow status:", error);
			throw error;
		}

		const isFollowing = !!data; // Convert to boolean
		console.log(`[DEBUG] Follow status: ${isFollowing}`);

		res.status(200).json({ isFollowing });
	} catch (error) {
		console.error("Error checking follow status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get follower count for a user
router.get("/:userId/follower-count", async (req, res) => {
	try {
		const { userId } = req.params;

		console.log(`[DEBUG] Getting follower count for user: ${userId}`);

		// Use a count query to get the number of followers
		const { count, error } = await supabase
			.from("follows")
			.select("*", { count: "exact", head: true })
			.eq("following_id", userId);

		if (error) {
			console.error("[ERROR] Error getting follower count:", error);
			throw error;
		}

		console.log(`[DEBUG] Follower count for ${userId}: ${count}`);
		res.status(200).json({ count });
	} catch (error) {
		console.error("Error getting follower count:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get following count for a user
router.get("/:userId/following-count", async (req, res) => {
	try {
		const { userId } = req.params;

		console.log(`[DEBUG] Getting following count for user: ${userId}`);

		// Use a count query to get the number of users being followed
		const { count, error } = await supabase
			.from("follows")
			.select("*", { count: "exact", head: true })
			.eq("follower_id", userId);

		if (error) {
			console.error("[ERROR] Error getting following count:", error);
			throw error;
		}

		console.log(`[DEBUG] Following count for ${userId}: ${count}`);
		res.status(200).json({ count });
	} catch (error) {
		console.error("Error getting following count:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get shared voice notes by user (reposted content)
router.get("/:userId/shared-voice-notes", async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const offset = (page - 1) * limit;

		console.log(
			`[DEBUG] Fetching shared voice notes for user: ${userId}, page: ${page}, limit: ${limit}`
		);

		// First get all the voice note share records by the user, with sharer's details
		const {
			data: sharedEntries,
			error: sharedError,
			count: totalSharesCount,
		} = await supabase
			.from("voice_note_shares")
			.select(
				"voice_note_id, created_at, user_id, sharer_details:users (id, username, display_name, avatar_url)", // users here refers to the user who made the share (the sharer)
				{ count: "exact" } // For pagination of shares
			)
			.eq("user_id", userId) // Filter shares made by the profile user
			.order("created_at", { ascending: false }) // Order by when the share happened
			.range(offset, offset + parseInt(limit) - 1);

		if (sharedError) {
			if (sharedError.code === "42P01") {
				// undefined_table
				console.warn("[WARN] voice_note_shares table does not exist.");
				return res.status(200).json({
					data: [],
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total: 0,
					},
					message: "Shared voice notes feature not fully configured.",
				});
			}
			console.error("[ERROR] Error fetching shared entries:", sharedError);
			throw sharedError;
		}

		if (!sharedEntries || sharedEntries.length === 0) {
			console.log(`[DEBUG] User ${userId} has not shared any voice notes.`);
			return res.status(200).json({
				data: [],
				pagination: { page: parseInt(page), limit: parseInt(limit), total: 0 },
			});
		}

		const voiceNoteIds = sharedEntries.map((entry) => entry.voice_note_id);

		// Get the actual voice note data for these IDs, including original creator's details
		const { data: voiceNotesData, error: voiceNotesError } = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        users (id, username, display_name, avatar_url), 
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        tags:voice_note_tags (tag_name)
      `
			)
			.in("id", voiceNoteIds);

		if (voiceNotesError) {
			console.error(
				"[ERROR] Error fetching voice note details for shared items:",
				voiceNotesError
			);
			throw voiceNotesError;
		}

		// Combine voice note data with share information
		const processedData = voiceNotesData.map((note) => {
			const tags = note.tags ? note.tags.map((tagObj) => tagObj.tag_name) : [];
			const shareInfo = sharedEntries.find(
				(entry) => entry.voice_note_id === note.id
			);

			// note.users is the original creator of the voice note
			// shareInfo.sharer_details is the user who shared this note (the profile owner, in this context)
			return {
				...note, // original voice note data, including original creator (note.users)
				tags,
				is_shared: true,
				shared_at: shareInfo ? shareInfo.created_at : null, // Timestamp of the share
				shared_by: shareInfo?.sharer_details
					? {
							id: shareInfo.sharer_details.id,
							username: shareInfo.sharer_details.username,
							display_name: shareInfo.sharer_details.display_name,
							avatar_url: shareInfo.sharer_details.avatar_url,
					  }
					: null,
			};
		});

		// Re-sort based on the share time (created_at from voice_note_shares)
		// because the voiceNotesData might not be in the same order as sharedEntries if some IDs were missing
		processedData.sort((a, b) => {
			const dateA = a.shared_at ? new Date(a.shared_at).getTime() : 0;
			const dateB = b.shared_at ? new Date(b.shared_at).getTime() : 0;
			return dateB - dateA;
		});

		res.status(200).json({
			data: processedData,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: totalSharesCount, // Use the count from the shares query for accurate pagination of shares
			},
		});
	} catch (error) {
		console.error("Error fetching user shared voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

module.exports = router;
