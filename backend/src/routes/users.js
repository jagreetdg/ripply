const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// Search for users based on username or display name
router.get("/search", async (req, res) => {
	try {
		const { term } = req.query;
		const { page = 1, limit = 20 } = req.query;
		const offset = (page - 1) * limit;

		console.log(`[DEBUG] Searching for users with term: "${term}"`);

		if (!term || term.trim() === "") {
			return res.status(200).json([]);
		}

		const searchTerm = `%${term.toLowerCase()}%`;

		// Search for users matching the term in username or display_name
		const { data, error, count } = await supabase
			.from("users")
			.select("*", { count: "exact" })
			.or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
			.order("is_verified", { ascending: false })
			.order("username")
			.range(offset, offset + parseInt(limit) - 1);

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

// Update user profile
router.put("/:userId", async (req, res) => {
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

// Get user's followers
router.get("/:userId/followers", async (req, res) => {
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

// Get users that a user is following
router.get("/:userId/following", async (req, res) => {
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

// Follow a user
router.post("/:userId/follow", async (req, res) => {
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

// Unfollow a user
router.post("/:userId/unfollow", async (req, res) => {
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

// Get voice notes by user
router.get("/:userId/voice-notes", async (req, res) => {
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

		// First get all the voice notes that the user has shared
		const { data: sharedData, error: sharedError } = await supabase
			.from("voice_note_shares")
			.select(
				"voice_note_id, shared_at, user_id, users!voice_note_shares_user_id_fkey (id, username, display_name, avatar_url)"
			)
			.eq("user_id", userId)
			.order("shared_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		if (sharedError) {
			if (sharedError.code === "42P01") {
				// Table doesn't exist yet
				return res.status(200).json({
					data: [],
					pagination: {
						page: parseInt(page),
						limit: parseInt(limit),
						total: 0,
					},
					message: "Shared voice notes table does not exist",
				});
			}
			throw sharedError;
		}

		// If user hasn't shared any voice notes, return empty array
		if (!sharedData || sharedData.length === 0) {
			return res.status(200).json({
				data: [],
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: 0,
				},
			});
		}

		// Get the IDs of the shared voice notes
		const voiceNoteIds = sharedData.map((share) => share.voice_note_id);

		// Get the actual voice note data for these IDs
		const {
			data: voiceNotesData,
			error: voiceNotesError,
			count,
		} = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        users:user_id (id, username, display_name, avatar_url),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        tags:voice_note_tags (tag_name)
      `,
				{ count: "exact" }
			)
			.in("id", voiceNoteIds);

		if (voiceNotesError) throw voiceNotesError;

		// Process the data to format tags and mark as shared
		const processedData = voiceNotesData.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			// Find the shared_at date for this voice note
			const shareInfo = sharedData.find(
				(share) => share.voice_note_id === note.id
			);

			// Use the user data we already joined
			const sharerData = shareInfo ? shareInfo.users : null;

			return {
				...note,
				tags,
				is_shared: true,
				shared_at: shareInfo ? shareInfo.shared_at : null,
				shared_by: sharerData
					? {
							id: sharerData.id,
							username: sharerData.username,
							display_name: sharerData.display_name,
							avatar_url: sharerData.avatar_url,
					  }
					: null,
			};
		});

		// Sort by shared_at time
		processedData.sort((a, b) => {
			return new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime();
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
		console.error("Error fetching user shared voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

module.exports = router;
