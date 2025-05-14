const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const uuidv4 = require("uuid").v4;

// Get personalized feed (voice notes from users the current user follows)
router.get("/feed/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const offset = (page - 1) * limit;

		// First get the list of users that the current user follows
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		if (followingError) throw followingError;

		// If the user doesn't follow anyone, return an empty array
		if (!followingData || followingData.length === 0) {
			return res.status(200).json({
				data: [],
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total: 0,
				},
			});
		}

		// Extract the IDs of users being followed
		const followingIds = followingData.map((follow) => follow.following_id);

		// Get voice notes from followed users
		const { data, error, count } = await supabase
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
			.in("user_id", followingIds)
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
		console.error("Error fetching personalized feed:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get all voice notes (with pagination)
router.get("/", async (req, res) => {
	try {
		const { page = 1, limit = 10, userId } = req.query;
		const offset = (page - 1) * limit;

		let query = supabase
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
			.order("created_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		// Filter by user if provided
		if (userId) {
			query = query.eq("user_id", userId);
		}

		const { data, error, count } = await query;

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
		console.error("Error fetching voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get likes for a voice note
router.get("/:id/likes", async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from("voice_note_likes")
			.select("user_id, users:user_id (id, username, display_name, avatar_url)")
			.eq("voice_note_id", id);
		if (error) throw error;
		res.status(200).json({ data });
	} catch (error) {
		console.error("Error fetching likes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get tags for a voice note
router.get("/:id/tags", async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from("voice_note_tags")
			.select("tag_name")
			.eq("voice_note_id", id);
		if (error) throw error;
		const tags = data ? data.map((tag) => tag.tag_name) : [];
		res.status(200).json({ tags });
	} catch (error) {
		console.error("Error fetching tags:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get a single voice note by ID
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { data, error } = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        users:user_id (id, username, display_name, avatar_url),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        tags:voice_note_tags (tag_name)
      `
			)
			.eq("id", id)
			.single();
		if (error) throw error;
		if (!data) {
			return res.status(404).json({ message: "Voice note not found" });
		}
		// Process tags
		const tags = data.tags ? data.tags.map((tag) => tag.tag_name) : [];
		const responseData = {
			...data,
			tags,
		};
		res.status(200).json(responseData);
	} catch (error) {
		console.error("Error fetching voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Create a new voice note
router.post("/", async (req, res) => {
	try {
		const {
			title,
			duration,
			audio_url,
			user_id,
			background_image = null,
			tags = [],
		} = req.body;

		// Validate required fields
		if (!title || !duration || !audio_url || !user_id) {
			return res.status(400).json({
				message:
					"Missing required fields: title, duration, audio_url, and user_id are required",
			});
		}

		// Insert the voice note
		const { data: voiceNote, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.insert([
				{
					title,
					duration,
					audio_url,
					user_id,
					background_image,
				},
			])
			.select()
			.single();

		if (voiceNoteError) throw voiceNoteError;

		// If there are tags, insert them
		if (tags.length > 0) {
			const tagInserts = tags.map((tag) => ({
				voice_note_id: voiceNote.id,
				tag_name: tag.toLowerCase().trim(),
			}));

			const { error: tagError } = await supabase
				.from("voice_note_tags")
				.insert(tagInserts);

			if (tagError) throw tagError;
		}

		res.status(201).json(voiceNote);
	} catch (error) {
		console.error("Error creating voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Update a voice note
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		// Remove fields that shouldn't be directly updated
		delete updates.id;
		delete updates.user_id;
		delete updates.created_at;

		const { data, error } = await supabase
			.from("voice_notes")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ message: "Voice note not found" });
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("Error updating voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Delete a voice note
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const { error } = await supabase.from("voice_notes").delete().eq("id", id);

		if (error) throw error;

		res.status(200).json({ message: "Voice note deleted successfully" });
	} catch (error) {
		console.error("Error deleting voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Like a voice note
router.post("/:id/like", async (req, res) => {
	try {
		const { id } = req.params;
		const { user_id } = req.body;

		if (!user_id) {
			return res.status(400).json({ message: "user_id is required" });
		}

		// Check if already liked
		const { data: existingLike, error: checkError } = await supabase
			.from("voice_note_likes")
			.select("*")
			.eq("voice_note_id", id)
			.eq("user_id", user_id)
			.single();

		if (checkError && checkError.code !== "PGRST116") throw checkError;

		if (existingLike) {
			return res.status(400).json({ message: "Already liked this voice note" });
		}

		// Insert like
		const { data: like, error } = await supabase
			.from("voice_note_likes")
			.insert([{ voice_note_id: id, user_id }])
			.select()
			.single();

		if (error) throw error;

		res.status(201).json(like);
	} catch (error) {
		console.error("Error liking voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Unlike a voice note
router.post("/:id/unlike", async (req, res) => {
	try {
		const { id } = req.params;
		const { user_id } = req.body;

		if (!user_id) {
			return res.status(400).json({ message: "user_id is required" });
		}

		// Delete the like
		const { error } = await supabase
			.from("voice_note_likes")
			.delete()
			.eq("voice_note_id", id)
			.eq("user_id", user_id);

		if (error) throw error;

		res.status(200).json({ message: "Voice note unliked successfully" });
	} catch (error) {
		console.error("Error unliking voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Record a play for a voice note
router.post("/:id/play", async (req, res) => {
	try {
		const { id } = req.params;
		const { user_id } = req.body;

		const { data, error } = await supabase
			.from("voice_note_plays")
			.insert([
				{
					voice_note_id: id,
					user_id: user_id || null, // Allow anonymous plays
				},
			])
			.select()
			.single();

		if (error) throw error;

		res.status(201).json(data);
	} catch (error) {
		console.error("Error recording play:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get comments for a voice note
router.get("/:id/comments", async (req, res) => {
	try {
		const { id } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const offset = (page - 1) * limit;

		const { data, error, count } = await supabase
			.from("voice_note_comments")
			.select("*, users:user_id (id, username, display_name, avatar_url)", {
				count: "exact",
			})
			.eq("voice_note_id", id)
			.order("created_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		if (error) throw error;

		// Process the data to ensure user info is properly structured
		const processedData = data.map((comment) => {
			// Ensure user data is properly structured
			return {
				...comment,
				user: comment.users, // Rename users to user to match frontend expectations
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
		console.error("Error fetching comments:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Add a comment to a voice note
router.post("/:id/comments", async (req, res) => {
	try {
		const { id } = req.params;
		const { user_id, content } = req.body;

		if (!user_id || !content) {
			return res
				.status(400)
				.json({ message: "user_id and content are required" });
		}

		const { data, error } = await supabase
			.from("voice_note_comments")
			.insert([{ voice_note_id: id, user_id, content }])
			.select("*, users:user_id (id, username, display_name, avatar_url)")
			.single();

		if (error) throw error;

		// Process the data to ensure user info is properly structured
		const processedData = {
			...data,
			user: data.users, // Rename users to user to match frontend expectations
		};

		res.status(201).json(processedData);
	} catch (error) {
		console.error("Error adding comment:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get voice notes by tag
router.get("/tags/:tagName", async (req, res) => {
	try {
		const { tagName } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const offset = (page - 1) * limit;

		const { data, error, count } = await supabase
			.from("voice_note_tags")
			.select(
				`
        tag_name,
        voice_notes:voice_note_id (
          *,
          users:user_id (id, username, display_name, avatar_url),
          likes:voice_note_likes (count),
          comments:voice_note_comments (count),
          plays:voice_note_plays (count)
        )
      `,
				{ count: "exact" }
			)
			.eq("tag_name", tagName.toLowerCase())
			.range(offset, offset + limit - 1);

		if (error) throw error;

		// Reshape the data to return just the voice notes
		const voiceNotes = data.map((item) => item.voice_notes);

		res.status(200).json({
			data: voiceNotes,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: count,
			},
		});
	} catch (error) {
		console.error("Error fetching voice notes by tag:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Record a share for a voice note
router.post("/:voiceNoteId/share", async (req, res) => {
	try {
		const { voiceNoteId } = req.params;
		// Support both userId and followerId in the request body for consistency
		const { userId, followerId } = req.body;
		const effectiveUserId = userId || followerId;

		if (!effectiveUserId) {
			return res.status(400).json({ message: "User ID is required" });
		}

		console.log(
			`[DEBUG] Share request: voiceNoteId=${voiceNoteId}, userId=${effectiveUserId}`
		);

		// Check if voice note exists
		const { data: voiceNoteData, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.select("id, user_id")
			.eq("id", voiceNoteId)
			.single();

		if (voiceNoteError || !voiceNoteData) {
			return res.status(404).json({ message: "Voice note not found" });
		}

		// Check if user has already shared this voice note
		const { data: existingShare, error: existingShareError } = await supabase
			.from("voice_note_shares")
			.select("id")
			.eq("voice_note_id", voiceNoteId)
			.eq("user_id", effectiveUserId)
			.single();

		if (existingShareError && existingShareError.code !== "PGRST116") {
			if (existingShareError.code === "42P01") {
				// Table doesn't exist yet
				return res.status(400).json({
					message: "Voice note shares table does not exist",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			throw existingShareError;
		}

		let result;

		if (existingShare) {
			// Update the existing share timestamp
			result = await supabase
				.from("voice_note_shares")
				.update({
					shared_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingShare.id)
				.select();
		} else {
			// Create a new share
			result = await supabase
				.from("voice_note_shares")
				.insert({
					id: uuidv4(),
					voice_note_id: voiceNoteId,
					user_id: effectiveUserId,
					shared_at: new Date().toISOString(),
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.select();
		}

		if (result.error) {
			if (result.error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(400).json({
					message: "Voice note shares table does not exist",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			throw result.error;
		}

		// Get updated share count
		const { data: sharesData, error: countError } = await supabase
			.from("voice_note_shares")
			.select("id")
			.eq("voice_note_id", voiceNoteId);

		if (countError) {
			if (countError.code === "42P01") {
				// Table doesn't exist yet
				return res.status(200).json({
					message: "Share recorded successfully",
					voiceNoteId,
					userId,
					shareCount: 1,
					note: "Share count may not be accurate until you run the SQL script in the Supabase SQL Editor",
				});
			}
			throw countError;
		}

		const shareCount = sharesData.length;

		res.status(200).json({
			message: "Share recorded successfully",
			voiceNoteId,
			userId,
			shareCount,
		});
	} catch (error) {
		console.error("Error recording share:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get share count for a voice note
router.get("/:voiceNoteId/shares", async (req, res) => {
	try {
		const { voiceNoteId } = req.params;

		// Check if voice note exists
		const { data: voiceNoteData, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.select("id")
			.eq("id", voiceNoteId)
			.single();

		if (voiceNoteError || !voiceNoteData) {
			return res.status(404).json({ message: "Voice note not found" });
		}

		// Get shares from the voice_note_shares table
		const { data, error } = await supabase
			.from("voice_note_shares")
			.select("*")
			.eq("voice_note_id", voiceNoteId);

		if (error) {
			if (error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(200).json({
					voiceNoteId,
					shareCount: 0,
					shares: [],
					note: "Voice note shares table does not exist. Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			throw error;
		}

		res.status(200).json({
			voiceNoteId,
			shareCount: data.length,
			shares: data,
		});
	} catch (error) {
		console.error("Error getting share count:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Check if a user has liked a voice note
router.get("/:id/likes/check", async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.query;

		if (!userId) {
			return res
				.status(400)
				.json({ message: "userId query parameter is required" });
		}

		console.log(
			`[DEBUG] Checking if user ${userId} has liked voice note ${id}`
		);

		// Check if the like exists
		const { data, error } = await supabase
			.from("voice_note_likes")
			.select("*")
			.eq("voice_note_id", id)
			.eq("user_id", userId)
			.single();

		if (error && error.code !== "PGRST116") {
			console.error("[ERROR] Error checking like status:", error);
			throw error;
		}

		// Return true if the like exists, false otherwise
		const isLiked = !!data;
		console.log(
			`[DEBUG] User ${userId} has liked voice note ${id}: ${isLiked}`
		);

		res.status(200).json({ isLiked });
	} catch (error) {
		console.error("Error checking like status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Check if a user has shared a voice note
router.get("/:id/shares/check", async (req, res) => {
	try {
		const { id } = req.params;
		const { userId } = req.query;

		if (!userId) {
			return res
				.status(400)
				.json({ message: "userId query parameter is required" });
		}

		console.log(
			`[DEBUG] Checking if user ${userId} has shared voice note ${id}`
		);

		// Check if the share exists
		const { data, error } = await supabase
			.from("voice_note_shares")
			.select("*")
			.eq("voice_note_id", id)
			.eq("user_id", userId)
			.single();

		if (error) {
			// If the table doesn't exist yet, return false
			if (error.code === "42P01") {
				console.log("[DEBUG] voice_note_shares table does not exist");
				return res.status(200).json({ isShared: false });
			}

			// Ignore "not found" errors
			if (error.code !== "PGRST116") {
				console.error("[ERROR] Error checking share status:", error);
				throw error;
			}
		}

		// Return true if the share exists, false otherwise
		const isShared = !!data;
		console.log(
			`[DEBUG] User ${userId} has shared voice note ${id}: ${isShared}`
		);

		res.status(200).json({ isShared });
	} catch (error) {
		console.error("Error checking share status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

module.exports = router;
