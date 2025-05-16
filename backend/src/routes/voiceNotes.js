const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const uuidv4 = require("uuid").v4;

// Search for voice notes by title or tags
router.get("/search", async (req, res) => {
	try {
		const { term, searchType } = req.query;
		const { page = 1, limit = 20 } = req.query;
		const offset = (page - 1) * limit;

		console.log(
			`[DEBUG] Searching for voice notes with term: "${term}", searchType: ${
				searchType || "all"
			}`
		);

		if (!term || term.trim() === "") {
			return res.status(200).json([]);
		}

		const searchTerm = `%${term.toLowerCase()}%`;
		let query = supabase.from("voice_notes").select(
			`
			*,
			users (id, username, display_name, avatar_url, is_verified),
			likes:voice_note_likes (count),
			comments:voice_note_comments (count),
			plays:voice_note_plays (count),
			tags:voice_note_tags (tag_name)
		`,
			{ count: "exact" }
		);

		// If searchType is 'tag', only search in tags
		if (searchType === "tag") {
			console.log(`[DEBUG] Searching only in tags for "${term}"`);

			// First get voice notes IDs that have matching tags
			const { data: tagMatches, error: tagError } = await supabase
				.from("voice_note_tags")
				.select("voice_note_id")
				.ilike("tag_name", searchTerm);

			if (tagError) {
				console.error("[ERROR] Error searching tags:", tagError);
				throw tagError;
			}

			if (!tagMatches || tagMatches.length === 0) {
				console.log(`[DEBUG] No tags found matching "${term}"`);
				return res.status(200).json([]);
			}

			console.log(
				`[DEBUG] Found ${tagMatches.length} tag matches for "${term}"`
			);

			// Get the voice note IDs from the tag matches
			const voiceNoteIds = tagMatches.map((match) => match.voice_note_id);

			// Filter the voice notes by these IDs
			query = query.in("id", voiceNoteIds);
		} else {
			// Search in title by default
			query = query.ilike("title", searchTerm);
		}

		// Add pagination and execute the query
		const { data, error, count } = await query
			.order("created_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		if (error) {
			console.error("[ERROR] Error searching voice notes:", error);
			throw error;
		}

		// Process the data to format tags properly
		const processedData = data.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			return {
				...note,
				tags,
			};
		});

		console.log(
			`[DEBUG] Found ${processedData.length} voice notes matching "${term}"`
		);
		res.status(200).json(processedData);
	} catch (error) {
		console.error("Error searching voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get personalized feed for a user
router.get("/feed/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const offset = (page - 1) * limit;

		console.log(`[DEBUG] Fetching personalized feed for user: ${userId}`);

		// First get the list of users that the current user follows
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		if (followingError) {
			console.error("[ERROR] Error fetching following data:", followingError);
			throw followingError;
		}

		// If the user doesn't follow anyone, return an empty array
		if (!followingData || followingData.length === 0) {
			console.log(
				`[DEBUG] User ${userId} doesn't follow anyone, returning empty feed`
			);
			return res.status(200).json([]);
		}

		// Extract the IDs of users being followed
		const followingIds = followingData.map((follow) => follow.following_id);
		console.log(`[DEBUG] User ${userId} follows ${followingIds.length} users`);

		// Get voice notes from followed users
		const { data: originalPosts, error: originalError } = await supabase
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
			.in("user_id", followingIds)
			.order("created_at", { ascending: false });

		if (originalError) {
			console.error("[ERROR] Error fetching original posts:", originalError);
			throw originalError;
		}

		// Get shared voice notes from followed users
		const { data: sharedData, error: sharedError } = await supabase
			.from("voice_note_shares")
			.select(
				`
	id,
	voice_note_id,
	user_id,
	shared_at,
	sharer:users!voice_note_shares_user_id_fkey (id, username, display_name, avatar_url)
`
			)
			.in("user_id", followingIds)
			.order("shared_at", { ascending: false });

		if (sharedError && sharedError.code !== "42P01") {
			console.error("[ERROR] Error fetching shared posts:", sharedError);
			throw sharedError;
		}

		let processedSharedPosts = [];

		// If there are shared posts and the table exists
		if (sharedData && sharedData.length > 0) {
			// Get the voice note IDs from the shares
			const sharedVoiceNoteIds = sharedData.map((share) => share.voice_note_id);

			// Fetch the actual voice notes
			const { data: sharedVoiceNotes, error: sharedVoiceNotesError } =
				await supabase
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
					.in("id", sharedVoiceNoteIds);

			if (sharedVoiceNotesError) {
				console.error(
					"[ERROR] Error fetching shared voice notes:",
					sharedVoiceNotesError
				);
				throw sharedVoiceNotesError;
			}

			// Process each shared voice note to include sharer info
			processedSharedPosts = sharedVoiceNotes.map((note) => {
				// Find the corresponding share record
				const shareRecord = sharedData.find(
					(share) => share.voice_note_id === note.id
				);

				// Extract tags
				const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

				return {
					...note,
					tags,
					is_shared: true,
					shared_at: shareRecord?.shared_at || new Date().toISOString(),
					shared_by: shareRecord?.sharer || null,
				};
			});
		}

		// Process original posts
		const processedOriginalPosts = originalPosts.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			return {
				...note,
				tags,
				is_shared: false,
			};
		});

		// Combine both types of posts
		const allPosts = [...processedOriginalPosts, ...processedSharedPosts];

		// Sort by created_at or shared_at (newest first)
		allPosts.sort((a, b) => {
			const dateA = a.is_shared
				? new Date(a.shared_at)
				: new Date(a.created_at);
			const dateB = b.is_shared
				? new Date(b.shared_at)
				: new Date(b.created_at);
			return dateB - dateA;
		});

		// Apply pagination after sorting
		const paginatedPosts = allPosts.slice(offset, offset + parseInt(limit));

		console.log(
			`[DEBUG] Returning ${paginatedPosts.length} personalized feed items for user ${userId}`
		);

		// Return in the same format as the regular voice notes endpoint
		res.status(200).json(paginatedPosts);
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

		console.log(
			`[DEBUG] Fetching all voice notes page ${page}, limit ${limit}`
		);

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

		if (error) {
			console.error("[ERROR] Error fetching all voice notes:", error);
			throw error;
		}

		// Process the data to format tags
		const processedData = data.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			return {
				...note,
				tags,
			};
		});

		console.log(`[DEBUG] Returning ${processedData.length} voice notes`);

		// Return just the array of voice notes for consistency with the feed endpoint
		res.status(200).json(processedData);
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
			.select("id, user_id, shares")
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

		let isShared = false;
		let shareCount = voiceNoteData.shares || 0;

		try {
			if (existingShare) {
				// User is unsharing: delete the share and decrement the count
				const { error: deleteError } = await supabase
					.from("voice_note_shares")
					.delete()
					.eq("id", existingShare.id);

				if (deleteError) throw deleteError;

				// Decrement the share count in the voice_notes table
				const { error: updateError } = await supabase
					.from("voice_notes")
					.update({ shares: Math.max(0, shareCount - 1) })
					.eq("id", voiceNoteId);

				if (updateError) throw updateError;

				shareCount = Math.max(0, shareCount - 1);
				isShared = false;
			} else {
				// User is sharing: create a new share and increment the count
				const { error: insertError } = await supabase
					.from("voice_note_shares")
					.insert({
						id: uuidv4(),
						voice_note_id: voiceNoteId,
						user_id: effectiveUserId,
						shared_at: new Date().toISOString(),
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					});

				if (insertError) throw insertError;

				// Increment the share count in the voice_notes table
				const { error: updateError } = await supabase
					.from("voice_notes")
					.update({ shares: shareCount + 1 })
					.eq("id", voiceNoteId);

				if (updateError) throw updateError;

				shareCount = shareCount + 1;
				isShared = true;
			}
		} catch (error) {
			console.error("Error processing share operation:", error);
			throw error;
		}

		res.status(200).json({
			message: isShared
				? "Share recorded successfully"
				: "Share removed successfully",
			voiceNoteId,
			userId: effectiveUserId,
			shareCount,
			isShared,
		});
	} catch (error) {
		console.error("Error recording share:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get voice note shares
router.get("/:voiceNoteId/shares", async (req, res) => {
	try {
		const { voiceNoteId } = req.params;

		console.log(`[DEBUG] Fetching shares for voice note: ${voiceNoteId}`);

		// Check if voice note exists and get the shares count
		const { data: voiceNoteData, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.select("id, shares")
			.eq("id", voiceNoteId)
			.single();

		if (voiceNoteError) {
			if (voiceNoteError.code === "PGRST116") {
				// Not found
				return res.status(404).json({ message: "Voice note not found" });
			}

			// If there's a column error, fall back to counting shares
			if (voiceNoteError.code === "42703") {
				console.error("Error fetching share count:", voiceNoteError);

				// Fall back to counting from the shares table
				const { data: sharesData, error: countError } = await supabase
					.from("voice_note_shares")
					.select("id", { count: "exact" })
					.eq("voice_note_id", voiceNoteId);

				if (countError) {
					if (countError.code === "42P01") {
						return res.status(200).json({ shareCount: 0 });
					}
					throw countError;
				}

				return res.status(200).json({ shareCount: sharesData.length });
			}

			throw voiceNoteError;
		}

		// Return the shares count from the voice_notes table
		const shareCount = voiceNoteData.shares || 0;
		console.log(`[DEBUG] Voice note ${voiceNoteId} has ${shareCount} shares`);

		res.status(200).json({ shareCount });
	} catch (error) {
		console.error("Error fetching share count:", error);
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

// DIAGNOSTIC: Check a user's follows data
router.get("/diagnostic/follows/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		console.log(`[DIAGNOSTIC] Checking follow data for user: ${userId}`);

		// Get users that this user follows
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select(
				"following_id, following:following_id(id, username, display_name)"
			)
			.eq("follower_id", userId);

		if (followingError) {
			console.error(
				"[DIAGNOSTIC] Error fetching following data:",
				followingError
			);
			throw followingError;
		}

		// Get users that follow this user
		const { data: followersData, error: followersError } = await supabase
			.from("follows")
			.select("follower_id, follower:follower_id(id, username, display_name)")
			.eq("following_id", userId);

		if (followersError) {
			console.error(
				"[DIAGNOSTIC] Error fetching followers data:",
				followersError
			);
			throw followersError;
		}

		// Check if user exists
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("id, username, display_name")
			.eq("id", userId)
			.single();

		if (userError) {
			console.error("[DIAGNOSTIC] Error fetching user data:", userError);
			// Don't throw error, continue with diagnosis
		}

		// Format the following users
		const following = followingData.map((follow) => ({
			id: follow.following_id,
			username: follow.following?.username || "unknown",
			display_name: follow.following?.display_name || "Unknown User",
		}));

		// Format the followers
		const followers = followersData.map((follow) => ({
			id: follow.follower_id,
			username: follow.follower?.username || "unknown",
			display_name: follow.follower?.display_name || "Unknown User",
		}));

		// Return the diagnostic information
		res.status(200).json({
			userId,
			userExists: !!userData,
			userData: userData || null,
			followsCount: following.length,
			followersCount: followers.length,
			follows: following,
			followers: followers,
		});
	} catch (error) {
		console.error("[DIAGNOSTIC] Error in diagnostic endpoint:", error);
		res.status(500).json({
			message: "Error running diagnostics",
			error: error.message,
			stack: error.stack,
		});
	}
});

// DIAGNOSTIC: Get trace of personalized feed
router.get("/diagnostic/feed/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		console.log(`[DIAGNOSTIC] Running feed trace for user: ${userId}`);

		// Step 1: Get the users this person follows
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		if (followingError) {
			console.error(
				"[DIAGNOSTIC] Error fetching following data:",
				followingError
			);
			return res.status(500).json({
				message: "Error fetching following data",
				error: followingError.message,
			});
		}

		// Log users being followed
		console.log(
			`[DIAGNOSTIC] User ${userId} follows ${followingData?.length || 0} users`
		);

		// If not following anyone, return early
		if (!followingData || followingData.length === 0) {
			return res.status(200).json({
				userId,
				followsCount: 0,
				message:
					"User doesn't follow anyone, personalized feed should be empty",
			});
		}

		// Extract user IDs being followed
		const followingIds = followingData.map((follow) => follow.following_id);
		console.log(`[DIAGNOSTIC] Following IDs: ${followingIds.join(", ")}`);

		// Get all the posts - not filtered by following
		const { data: allPosts, error: allPostsError } = await supabase
			.from("voice_notes")
			.select(
				`
				id, 
				title, 
				user_id,
				users:user_id (id, username, display_name)
			`
			)
			.order("created_at", { ascending: false })
			.limit(50);

		if (allPostsError) {
			console.error("[DIAGNOSTIC] Error fetching all posts:", allPostsError);
			return res.status(500).json({
				message: "Error fetching all posts",
				error: allPostsError.message,
			});
		}

		console.log(
			`[DIAGNOSTIC] Found ${allPosts?.length || 0} total posts in the database`
		);

		// Get the same posts but with following filter applied
		const { data: filteredPosts, error: filteredError } = await supabase
			.from("voice_notes")
			.select(
				`
				id, 
				title, 
				user_id,
				users:user_id (id, username, display_name)
			`
			)
			.in("user_id", followingIds)
			.order("created_at", { ascending: false })
			.limit(50);

		if (filteredError) {
			console.error(
				"[DIAGNOSTIC] Error fetching filtered posts:",
				filteredError
			);
			return res.status(500).json({
				message: "Error fetching filtered posts",
				error: filteredError.message,
			});
		}

		console.log(
			`[DIAGNOSTIC] Found ${
				filteredPosts?.length || 0
			} posts from followed users`
		);

		// Get the post creator IDs for analysis
		const allPostCreators = [...new Set(allPosts.map((post) => post.user_id))];
		const followedPostCreators = [
			...new Set(filteredPosts.map((post) => post.user_id)),
		];

		// Build diagnostics data
		const diagnosticData = {
			userId,
			followsCount: followingIds.length,
			totalPostsCount: allPosts.length,
			filteredPostsCount: filteredPosts.length,
			filteredPostCreators: followedPostCreators,
			allPostsFromFollowedUsers: allPosts.filter((post) =>
				followingIds.includes(post.user_id)
			).length,
			actualSQLResultsMatchingFilter: filteredPosts.length,
			postsGroups: {
				totalUniqueCreators: allPostCreators.length,
				followedCreators: followedPostCreators.length,
				unfollowedCreatorsWithPosts: allPostCreators.filter(
					(id) => !followingIds.includes(id)
				).length,
			},
			samplePosts: {
				allPosts: allPosts.slice(0, 5).map((post) => ({
					id: post.id,
					title: post.title,
					user_id: post.user_id,
					username: post.users?.username,
					isFromFollowed: followingIds.includes(post.user_id),
				})),
				filteredPosts: filteredPosts.slice(0, 5).map((post) => ({
					id: post.id,
					title: post.title,
					user_id: post.user_id,
					username: post.users?.username,
					isFromFollowed: followingIds.includes(post.user_id),
				})),
			},
		};

		res.status(200).json(diagnosticData);
	} catch (error) {
		console.error("[DIAGNOSTIC] Error in feed trace endpoint:", error);
		res.status(500).json({
			message: "Error running feed trace",
			error: error.message,
		});
	}
});

module.exports = router;
