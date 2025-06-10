const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const uuidv4 = require("uuid").v4;
const { authenticateToken } = require("../middleware/auth");

// Helper function to process voice note counts from Supabase aggregation format
const processVoiceNoteCounts = (note) => {
	if (!note) return note;

	return {
		...note,
		// Extract count values from Supabase aggregation arrays
		likes: note.likes?.[0]?.count || 0,
		comments: note.comments?.[0]?.count || 0,
		plays: note.plays?.[0]?.count || 0,
		shares: note.shares?.[0]?.count || 0,
	};
};

// Temporary test endpoint to check deployment status
router.get("/test-deployment", async (req, res) => {
	try {
		const deploymentInfo = {
			timestamp: new Date().toISOString(),
			message: "Balanced feed algorithm deployed successfully",
			version: "2024-12-19-balanced-feed",
			fixDescription:
				"Implemented balanced feed algorithm to ensure original posts appear on page 1",
			debugLogging: "Enhanced debug logging with balanced feed ratio tracking",
			algorithm:
				"60% original posts, 40% shared posts per page for better balance",
		};

		console.log("[DEBUG] Test deployment endpoint called:", deploymentInfo);
		res.status(200).json(deploymentInfo);
	} catch (error) {
		console.error("Error in test deployment endpoint:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Debug feed endpoint that doesn't require auth - for testing only
router.get("/debug-feed/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		console.log(`[DEBUG] Debug feed called for user: ${userId}`);

		// Get following data
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		if (followingError) {
			throw followingError;
		}

		const followingIds = followingData.map((follow) => follow.following_id);
		console.log(
			`[DEBUG] Following ${followingIds.length} users: ${followingIds.join(
				", "
			)}`
		);

		// Get original posts
		const { data: originalPosts, error: originalError } = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        users:user_id (id, username, display_name, avatar_url),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        shares:voice_note_shares (count)
      `
			)
			.in("user_id", followingIds)
			.order("created_at", { ascending: false })
			.limit(5);

		if (originalError) {
			throw originalError;
		}

		console.log(`[DEBUG] Found ${originalPosts.length} original posts`);

		// Process original posts
		const processedOriginalPosts = originalPosts.map((note) => ({
			...processVoiceNoteCounts(note),
			is_shared: false,
		}));

		// Get shared posts
		const { data: sharedData, error: sharedError } = await supabase
			.from("voice_note_shares")
			.select("id, voice_note_id, user_id, shared_at")
			.in("user_id", followingIds)
			.order("shared_at", { ascending: false })
			.limit(5);

		if (sharedError && sharedError.code !== "42P01") {
			throw sharedError;
		}

		console.log(`[DEBUG] Found ${sharedData?.length || 0} share records`);

		let processedSharedPosts = [];
		if (sharedData && sharedData.length > 0) {
			const sharedVoiceNoteIds = sharedData.map((share) => share.voice_note_id);

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
					shares:voice_note_shares (count)
				`
					)
					.in("id", sharedVoiceNoteIds);

			if (sharedVoiceNotesError) {
				throw sharedVoiceNotesError;
			}

			// Get sharer info
			const sharersData = await Promise.all(
				sharedData.map(async (share) => {
					const { data: sharerInfo } = await supabase
						.from("users")
						.select("id, username, display_name, avatar_url")
						.eq("id", share.user_id)
						.single();
					return { ...share, sharer: sharerInfo };
				})
			);

			processedSharedPosts = sharedVoiceNotes.map((note) => {
				const shareRecord = sharersData.find(
					(share) => share.voice_note_id === note.id
				);

				return {
					...processVoiceNoteCounts(note),
					is_shared: true,
					shared_at: shareRecord?.shared_at || new Date().toISOString(),
					shared_by: shareRecord?.sharer || null,
				};
			});
		}

		// Combine and return structured response
		const response = {
			userId,
			followingCount: followingIds.length,
			originalPosts: {
				count: processedOriginalPosts.length,
				items: processedOriginalPosts.map((post) => ({
					id: post.id,
					title: post.title,
					is_shared: post.is_shared,
					username: post.users?.username,
				})),
			},
			sharedPosts: {
				count: processedSharedPosts.length,
				items: processedSharedPosts.map((post) => ({
					id: post.id,
					title: post.title,
					is_shared: post.is_shared,
					username: post.users?.username,
					shared_by: post.shared_by?.username,
				})),
			},
			combined: [...processedOriginalPosts, ...processedSharedPosts].map(
				(post) => ({
					id: post.id,
					title: post.title,
					is_shared: post.is_shared,
					username: post.users?.username,
					shared_by: post.shared_by?.username || null,
				})
			),
		};

		console.log(`[DEBUG] Debug response:`, JSON.stringify(response, null, 2));
		res.status(200).json(response);
	} catch (error) {
		console.error("Error in debug feed:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Search for voice notes by title or tags - PUBLIC (no auth required)
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
			shares:voice_note_shares (count),
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
			console.log(`[DEBUG] Searching in titles for "${term}"`);
			query = query.ilike("title", searchTerm);
		}

		// Apply pagination and ordering
		query = query
			.order("created_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		const { data, error, count } = await query;

		if (error) {
			console.error("[ERROR] Error searching voice notes:", error);
			throw error;
		}

		console.log(`[DEBUG] Found ${data?.length || 0} voice notes for "${term}"`);

		// Process the data to format tags and counts
		const processedData = (data || []).map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			// Process counts and add tags
			return {
				...processVoiceNoteCounts(note),
				tags,
			};
		});

		res.status(200).json(processedData);
	} catch (error) {
		console.error("Error searching voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get personalized feed for a user - REQUIRES AUTHENTICATION
router.get("/feed/:userId", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 100 } = req.query; // Large limit for mobile infinite scroll
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

		// Extract the IDs of users being followed
		const followingIds = followingData.map((follow) => follow.following_id);
		console.log(`[DEBUG] User ${userId} follows ${followingIds.length} users`);
		console.log(`[DEBUG] Following IDs: ${JSON.stringify(followingIds)}`);

		// If the user doesn't follow anyone, return an empty array
		if (!followingIds || followingIds.length === 0) {
			console.log(
				`[DEBUG] User ${userId} doesn't follow anyone, returning empty feed`
			);
			return res.status(200).json([]);
		}

		// VERIFICATION: Check if users being followed have any voice notes
		const { count: postCount, error: countError } = await supabase
			.from("voice_notes")
			.select("*", { count: "exact", head: true })
			.in("user_id", followingIds);

		if (countError) {
			console.error("[ERROR] Error counting original posts:", countError);
		} else {
			console.log(
				`[DEBUG] Database confirms ${postCount} original posts from followed users`
			);
		}

		// Get voice notes from followed users
		console.log(
			`[DEBUG] Fetching original posts for followed users: ${followingIds.join(
				", "
			)}`
		);
		const { data: originalPosts, error: originalError } = await supabase
			.from("voice_notes")
			.select(
				`
        *,
        users:user_id (id, username, display_name, avatar_url),
        likes:voice_note_likes (count),
        comments:voice_note_comments (count),
        plays:voice_note_plays (count),
        shares:voice_note_shares (count),
        tags:voice_note_tags (tag_name)
      `
			)
			.in("user_id", followingIds)
			.order("created_at", { ascending: false });

		if (originalError) {
			console.error("[ERROR] Error fetching original posts:", originalError);
			throw originalError;
		}

		console.log(
			`[DEBUG] Retrieved ${originalPosts?.length || 0} original posts`
		);
		if (originalPosts && originalPosts.length > 0) {
			console.log(
				`[DEBUG] First original post user_id: ${originalPosts[0].user_id}`
			);
			console.log(
				`[DEBUG] Original post user_ids: ${originalPosts
					.map((p) => p.user_id)
					.join(", ")}`
			);

			// CRITICAL: Verify if the posts are actually from users we're following
			const postCreators = originalPosts.map((p) => p.user_id);
			const areAllPostsFromFollowedUsers = postCreators.every((id) =>
				followingIds.includes(id)
			);
			console.log(
				`[DEBUG] All posts from followed users? ${areAllPostsFromFollowedUsers}`
			);
		} else {
			console.log(`[DEBUG] No original posts found for followed users`);
		}

		// Process original posts
		const processedOriginalPosts = originalPosts.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			const processed = {
				...processVoiceNoteCounts(note),
				tags,
				is_shared: false, // IMPORTANT: Explicitly mark as not shared
			};

			// CRITICAL DEBUG: Log each original post processing
			console.log(
				`[DEBUG] Processing ORIGINAL post ${note.id}: title="${note.title}", is_shared=${processed.is_shared}`
			);

			return processed;
		});

		// Get shared voice notes from followed users
		// FIX: Simplified the foreign key reference to avoid potential issues
		const { data: sharedData, error: sharedError } = await supabase
			.from("voice_note_shares")
			.select(
				`
	id,
	voice_note_id,
	user_id,
	shared_at
`
			)
			.in("user_id", followingIds)
			.order("shared_at", { ascending: false });

		if (sharedError && sharedError.code !== "42P01") {
			console.error("[ERROR] Error fetching shared posts:", sharedError);
			throw sharedError;
		}

		console.log(`[DEBUG] Retrieved ${sharedData?.length || 0} share records`);

		let processedSharedPosts = [];

		// If there are shared posts and the table exists
		if (sharedData && sharedData.length > 0) {
			// Get the voice note IDs from the shares
			const sharedVoiceNoteIds = sharedData.map((share) => share.voice_note_id);
			console.log(
				`[DEBUG] Shared voice note IDs: ${sharedVoiceNoteIds.join(", ")}`
			);

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
					shares:voice_note_shares (count),
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

			console.log(
				`[DEBUG] Retrieved ${
					sharedVoiceNotes?.length || 0
				} shared voice note details`
			);

			// Get sharer information separately to avoid foreign key issues
			const sharersData = await Promise.all(
				sharedData.map(async (share) => {
					const { data: sharerInfo, error: sharerError } = await supabase
						.from("users")
						.select("id, username, display_name, avatar_url")
						.eq("id", share.user_id)
						.single();

					if (sharerError) {
						console.error(
							`[ERROR] Error fetching sharer info for user ${share.user_id}:`,
							sharerError
						);
						return { ...share, sharer: null };
					}

					return { ...share, sharer: sharerInfo };
				})
			);

			// Process each shared voice note to include sharer info
			processedSharedPosts = sharedVoiceNotes
				.map((note) => {
					// Find the corresponding share record with sharer info
					const shareRecord = sharersData.find(
						(share) => share.voice_note_id === note.id
					);

					// CRITICAL FIX: Only treat as "shared" if the sharer is NOT the original creator
					const isActuallyShared =
						shareRecord?.sharer && shareRecord.sharer.id !== note.user_id;

					// Skip posts where the original creator shared their own post
					// These are already included in the original posts
					if (!isActuallyShared) {
						console.log(
							`[DEBUG] SKIPPING self-share: ${note.id} by ${shareRecord?.sharer?.username} (original creator)`
						);
						return null; // Mark for filtering
					}

					// Extract tags
					const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

					const processed = {
						...processVoiceNoteCounts(note),
						tags,
						is_shared: true, // IMPORTANT: Only true for actual reposts
						shared_at: shareRecord?.shared_at || new Date().toISOString(),
						shared_by: shareRecord?.sharer || null,
					};

					// CRITICAL DEBUG: Log each shared post processing
					console.log(
						`[DEBUG] Processing ACTUAL REPOST ${note.id}: title="${note.title}", original_creator=${note.users?.username}, shared_by=${shareRecord?.sharer?.username}`
					);

					return processed;
				})
				.filter(Boolean); // Remove null entries (self-shares)
		}

		console.log(
			`[DEBUG] Processed ${processedOriginalPosts.length} original posts`
		);
		console.log(
			`[DEBUG] Processed ${processedSharedPosts.length} shared posts`
		);

		// Combine both types of posts and remove duplicates
		const originalPostIds = new Set(processedOriginalPosts.map((p) => p.id));
		const uniqueSharedPosts = processedSharedPosts.filter(
			(p) => !originalPostIds.has(p.id)
		);

		console.log(
			`[DEBUG] Removed ${
				processedSharedPosts.length - uniqueSharedPosts.length
			} duplicate posts from shared section`
		);

		console.log(
			`[DEBUG] Ready to create balanced feed with ${processedOriginalPosts.length} original posts and ${uniqueSharedPosts.length} unique shared posts`
		);

		// BALANCED FEED ALGORITHM: Mix original and shared posts for better distribution
		// Instead of pure chronological sorting, we'll interleave original and shared posts
		// to ensure each page has a good mix of both types

		// Sort original posts by creation date (newest first)
		const sortedOriginalPosts = processedOriginalPosts.sort(
			(a, b) => new Date(b.created_at) - new Date(a.created_at)
		);

		// Sort shared posts by share date (newest first)
		const sortedSharedPosts = uniqueSharedPosts.sort(
			(a, b) => new Date(b.shared_at) - new Date(a.shared_at)
		);

		console.log(
			`[DEBUG] Sorted ${sortedOriginalPosts.length} original posts, ${sortedSharedPosts.length} shared posts`
		);

		// Create balanced feed by interleaving posts
		// This ensures each page has a mix rather than all shared posts dominating
		const balancedFeed = [];
		let originalIndex = 0;
		let sharedIndex = 0;

		// Target ratio: roughly 60% original posts, 40% shared posts per page
		// This mimics Twitter/Instagram where you see more from people you follow than reposts
		const totalItems = sortedOriginalPosts.length + sortedSharedPosts.length;
		const targetOriginalRatio = 0.6;

		while (
			originalIndex < sortedOriginalPosts.length ||
			sharedIndex < sortedSharedPosts.length
		) {
			const currentRatio =
				balancedFeed.length > 0
					? balancedFeed.filter((p) => !p.is_shared).length /
					  balancedFeed.length
					: 0;

			// Decide whether to add original or shared post next
			const shouldAddOriginal =
				(currentRatio < targetOriginalRatio &&
					originalIndex < sortedOriginalPosts.length) ||
				sharedIndex >= sortedSharedPosts.length;

			if (shouldAddOriginal && originalIndex < sortedOriginalPosts.length) {
				balancedFeed.push(sortedOriginalPosts[originalIndex]);
				originalIndex++;
			} else if (sharedIndex < sortedSharedPosts.length) {
				balancedFeed.push(sortedSharedPosts[sharedIndex]);
				sharedIndex++;
			} else {
				break;
			}
		}

		console.log(
			`[DEBUG] Created balanced feed with ${balancedFeed.length} posts`
		);
		console.log(
			`[DEBUG] Balanced feed ratio - Original: ${
				balancedFeed.filter((p) => !p.is_shared).length
			}, Shared: ${balancedFeed.filter((p) => p.is_shared).length}`
		);

		// Apply pagination to the balanced feed
		const paginatedPosts = balancedFeed.slice(offset, offset + parseInt(limit));

		console.log(
			`[DEBUG] Returning ${paginatedPosts.length} personalized feed items for user ${userId}`
		);

		// Final check of what we're returning
		if (paginatedPosts.length > 0) {
			const finalOriginalCount = paginatedPosts.filter(
				(post) => post.is_shared !== true
			).length;
			const finalSharedCount = paginatedPosts.filter(
				(post) => post.is_shared === true
			).length;
			console.log(
				`[DEBUG] Paginated feed - Original: ${finalOriginalCount}, Shared: ${finalSharedCount}`
			);

			// CRITICAL DEBUG: Log the first few posts being returned
			console.log(
				`[DEBUG] FINAL RESPONSE - First ${Math.min(
					3,
					paginatedPosts.length
				)} posts:`
			);
			paginatedPosts.slice(0, 3).forEach((post, index) => {
				console.log(
					`[DEBUG] Post ${index + 1}: ID=${post.id}, title="${
						post.title
					}", is_shared=${post.is_shared}, user=${
						post.users?.username
					}, shared_by=${post.shared_by?.username || "N/A"}`
				);
			});
		}

		// Return in the same format as the regular voice notes endpoint
		res.status(200).json(paginatedPosts);
	} catch (error) {
		console.error("Error fetching personalized feed:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get all voice notes (with pagination) - REQUIRES AUTHENTICATION
router.get("/", authenticateToken, async (req, res) => {
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
        shares:voice_note_shares (count),
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

		// Process the data to format tags and counts
		const processedData = data.map((note) => {
			// Extract tags from the nested structure
			const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

			return {
				...processVoiceNoteCounts(note),
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
        shares:voice_note_shares (count),
        tags:voice_note_tags (tag_name)
      `
			)
			.eq("id", id)
			.single();
		if (error) throw error;
		if (!data) {
			return res.status(404).json({ message: "Voice note not found" });
		}
		// Process tags and counts
		const tags = data.tags ? data.tags.map((tag) => tag.tag_name) : [];
		const responseData = {
			...processVoiceNoteCounts(data),
			tags,
		};
		res.status(200).json(responseData);
	} catch (error) {
		console.error("Error fetching voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Create a new voice note - REQUIRES AUTHENTICATION
router.post("/", authenticateToken, async (req, res) => {
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

// Like a voice note - REQUIRES AUTHENTICATION
router.post("/:id/like", authenticateToken, async (req, res) => {
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

// Unlike a voice note - REQUIRES AUTHENTICATION
router.post("/:id/unlike", authenticateToken, async (req, res) => {
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

// Add a comment to a voice note - REQUIRES AUTHENTICATION
router.post("/:id/comments", authenticateToken, async (req, res) => {
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

// Record a share for a voice note - REQUIRES AUTHENTICATION
router.post("/:voiceNoteId/share", authenticateToken, async (req, res) => {
	try {
		const { voiceNoteId } = req.params;
		// Use the authenticated user's ID instead of client-provided userId for security
		const userId = req.user.id;

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}
		if (!voiceNoteId) {
			return res.status(400).json({ message: "Voice note ID is required" });
		}

		console.log(
			`[DEBUG] Share/Unshare request: voiceNoteId=${voiceNoteId}, userId=${userId}`
		);

		// 1. Check if the voice note exists to ensure we're acting on a valid entity
		const { data: voiceNote, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.select("id")
			.eq("id", voiceNoteId)
			.single();

		if (voiceNoteError || !voiceNote) {
			console.error(
				`[ERROR] Voice note not found for ID: ${voiceNoteId}`,
				voiceNoteError
			);
			return res.status(404).json({ message: "Voice note not found" });
		}

		// 2. Check if the user has already shared this voice note
		const { data: existingShare, error: selectError } = await supabase
			.from("voice_note_shares")
			.select("id")
			.eq("voice_note_id", voiceNoteId)
			.eq("user_id", userId)
			.maybeSingle(); // Use maybeSingle to return null if not found, instead of error

		if (selectError) {
			// An actual error, not just "not found"
			console.error("[ERROR] Error checking for existing share:", selectError);
			return res.status(500).json({
				message: "Error checking share status",
				error: selectError.message,
			});
		}

		let isNowShared = false;

		if (existingShare) {
			// User has already shared it, so unshare (delete the record)
			const { error: deleteError } = await supabase
				.from("voice_note_shares")
				.delete()
				.eq("id", existingShare.id);

			if (deleteError) {
				console.error("[ERROR] Error deleting share:", deleteError);
				return res.status(500).json({
					message: "Error unsharing voice note",
					error: deleteError.message,
				});
			}
			isNowShared = false;
			console.log(`[DEBUG] User ${userId} unshared voice note ${voiceNoteId}`);
		} else {
			// User has not shared it, so share (insert a new record)
			// Make sure we include all required fields according to our schema
			const now = new Date().toISOString();
			const shareId = uuidv4(); // Generate UUID for the record

			const { error: insertError } = await supabase
				.from("voice_note_shares")
				.insert({
					id: shareId, // Explicitly set the ID
					voice_note_id: voiceNoteId,
					user_id: userId,
					shared_at: now,
					created_at: now,
					updated_at: now,
				});

			if (insertError) {
				console.error("[ERROR] Error inserting share:", insertError);
				return res.status(500).json({
					message: "Error sharing voice note",
					error: insertError.message,
				});
			}
			isNowShared = true;
			console.log(`[DEBUG] User ${userId} shared voice note ${voiceNoteId}`);
		}

		// 3. Get the new total share count for the voice note from voice_note_shares
		const { count: currentShareCount, error: countError } = await supabase
			.from("voice_note_shares")
			.select("*", { count: "exact", head: true })
			.eq("voice_note_id", voiceNoteId);

		if (countError) {
			console.error("[ERROR] Error getting updated share count:", countError);
			// Non-fatal for the share action itself, but client might get stale count
		}

		res.status(200).json({
			message: isNowShared
				? "Share recorded successfully"
				: "Share removed successfully",
			voiceNoteId,
			userId,
			shareCount: currentShareCount || 0,
			isShared: isNowShared,
		});
	} catch (error) {
		console.error("[ERROR] Unexpected error in /share route:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get voice note shares count (this route might be GET /:voiceNoteId/shares/count or similar)
// The existing GET /:voiceNoteId/shares seems to fetch the count. Let's update it.
router.get("/:voiceNoteId/shares", async (req, res) => {
	try {
		const { voiceNoteId } = req.params;

		if (!voiceNoteId) {
			return res.status(400).json({ message: "Voice note ID is required" });
		}

		console.log(`[DEBUG] Fetching share count for voice note: ${voiceNoteId}`);

		// 1. Check if voice note exists (optional, but good practice)
		const { data: voiceNote, error: voiceNoteError } = await supabase
			.from("voice_notes")
			.select("id")
			.eq("id", voiceNoteId)
			.maybeSingle();

		if (voiceNoteError) {
			console.error(
				`[ERROR] Error checking voice note ${voiceNoteId} existence:`,
				voiceNoteError
			);
			// Don't fail yet, proceed to count shares. If VN doesn't exist, count will be 0.
		}
		if (!voiceNote && !voiceNoteError) {
			// No error, but voiceNote is null
			console.log(
				`[INFO] Voice note ${voiceNoteId} not found while getting share count.`
			);
			// Depending on requirements, you could 404 here or return 0 count.
			// For simplicity, we'll let it proceed and likely return 0 if no shares exist for a non-existent VN.
		}

		// 2. Get the total share count for the voice note from voice_note_shares
		const { count, error: countError } = await supabase
			.from("voice_note_shares")
			.select("*", { count: "exact", head: true })
			.eq("voice_note_id", voiceNoteId);

		if (countError) {
			console.error("[ERROR] Error fetching share count:", countError);
			// Check if the table voice_note_shares doesn't exist (e.g., after a DB reset but before migration)
			if (countError.code === "42P01") {
				// undefined_table
				return res.status(500).json({
					message:
						"Shares table not found. Please ensure database migrations are complete.",
					shareCount: 0,
				});
			}
			return res.status(500).json({
				message: "Error fetching share count",
				error: countError.message,
			});
		}

		console.log(`[DEBUG] Voice note ${voiceNoteId} has ${count || 0} shares`);
		res.status(200).json({ shareCount: count || 0 });
	} catch (error) {
		console.error(
			"[ERROR] Unexpected error in GET /:voiceNoteId/shares:",
			error
		);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Check if a user has liked a voice note - REQUIRES AUTHENTICATION
router.get("/:id/likes/check", authenticateToken, async (req, res) => {
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

// Check if a user has shared a voice note - REQUIRES AUTHENTICATION
router.get("/:id/shares/check", authenticateToken, async (req, res) => {
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

// Discovery endpoint for posts - personalized "For You" feed - REQUIRES AUTHENTICATION
router.get("/discovery/posts/:userId", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 20 } = req.query;
		const offset = (page - 1) * limit;

		console.log(`[DEBUG] Fetching discovery posts for user: ${userId}`);

		// Get user's interaction history to understand preferences
		const { data: userInteractions, error: interactionsError } = await supabase
			.from("voice_note_likes")
			.select(
				"voice_note_id, voice_notes!inner(tags:voice_note_tags(tag_name), user_id)"
			)
			.eq("user_id", userId)
			.limit(50);

		if (interactionsError) {
			console.error(
				"[ERROR] Error fetching user interactions:",
				interactionsError
			);
		}

		// Get tags from liked posts to understand user preferences
		const preferredTags = [];
		const likedCreators = [];

		if (userInteractions && userInteractions.length > 0) {
			userInteractions.forEach((interaction) => {
				if (interaction.voice_notes?.tags) {
					interaction.voice_notes.tags.forEach((tag) => {
						preferredTags.push(tag.tag_name);
					});
				}
				if (interaction.voice_notes?.user_id) {
					likedCreators.push(interaction.voice_notes.user_id);
				}
			});
		}

		// Get users the current user follows to exclude from discovery
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		const followingIds = followingData
			? followingData.map((f) => f.following_id)
			: [];

		// Build discovery query - posts from users not followed, with preference for liked tags/creators
		let discoveryQuery = supabase
			.from("voice_notes")
			.select(
				`
				*,
				users:user_id (id, username, display_name, avatar_url, is_verified),
				likes:voice_note_likes (count),
				comments:voice_note_comments (count),
				plays:voice_note_plays (count),
				tags:voice_note_tags (tag_name)
			`
			)
			.neq("user_id", userId); // Don't show user's own posts

		// Exclude posts from users already followed (to encourage discovery)
		if (followingIds.length > 0) {
			discoveryQuery = discoveryQuery.not(
				"user_id",
				"in",
				`(${followingIds.join(",")})`
			);
		}

		// Order by engagement and recency for discovery
		discoveryQuery = discoveryQuery
			.order("created_at", { ascending: false })
			.range(offset, offset + parseInt(limit) - 1);

		const { data: discoveryPosts, error: discoveryError } =
			await discoveryQuery;

		if (discoveryError) {
			console.error("[ERROR] Error fetching discovery posts:", discoveryError);
			throw discoveryError;
		}

		let finalPosts = [];

		// If we have discovery posts, process and score them
		if (discoveryPosts && discoveryPosts.length > 0) {
			// Process and score posts based on user preferences
			const processedPosts = discoveryPosts.map((post) => {
				let score = 1; // Base score

				// Boost score for posts with preferred tags
				if (post.tags && preferredTags.length > 0) {
					const postTags = post.tags.map((t) => t.tag_name);
					const tagMatches = postTags.filter((tag) =>
						preferredTags.includes(tag)
					);
					score += tagMatches.length * 2;
				}

				// Boost score for posts from creators user has liked before
				if (likedCreators.includes(post.user_id)) {
					score += 3;
				}

				// Boost score based on engagement
				const likes = post.likes?.[0]?.count || 0;
				const comments = post.comments?.[0]?.count || 0;
				const plays = post.plays?.[0]?.count || 0;
				score += likes * 0.3 + comments * 0.5 + plays * 0.1;

				return {
					...post,
					discoveryScore: score,
					tags: post.tags ? post.tags.map((t) => t.tag_name) : [],
				};
			});

			// Sort by discovery score
			finalPosts = processedPosts.sort(
				(a, b) => b.discoveryScore - a.discoveryScore
			);
		} else {
			// Fallback: If no personalized discovery posts, show popular posts
			console.log(
				`[DEBUG] No personalized discovery posts found for user ${userId}, falling back to popular posts`
			);

			const { data: popularPosts, error: popularError } = await supabase
				.from("voice_notes")
				.select(
					`
					*,
					users:user_id (id, username, display_name, avatar_url, is_verified),
					likes:voice_note_likes (count),
					comments:voice_note_comments (count),
					plays:voice_note_plays (count),
					tags:voice_note_tags (tag_name)
				`
				)
				.neq("user_id", userId) // Don't show user's own posts
				.order("created_at", { ascending: false })
				.range(offset, offset + parseInt(limit) - 1);

			if (popularError) {
				console.error("[ERROR] Error fetching popular posts:", popularError);
				throw popularError;
			}

			// Process popular posts with basic scoring based on engagement
			finalPosts = popularPosts.map((post) => {
				const likes = post.likes?.[0]?.count || 0;
				const comments = post.comments?.[0]?.count || 0;
				const plays = post.plays?.[0]?.count || 0;
				const score = likes * 0.3 + comments * 0.5 + plays * 0.1;

				return {
					...post,
					discoveryScore: score,
					tags: post.tags ? post.tags.map((t) => t.tag_name) : [],
				};
			});

			// Sort by engagement score
			finalPosts.sort((a, b) => b.discoveryScore - a.discoveryScore);
		}

		console.log(
			`[DEBUG] Returning ${finalPosts.length} discovery posts for user ${userId}`
		);
		res.status(200).json(finalPosts);
	} catch (error) {
		console.error("Error fetching discovery posts:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Discovery endpoint for users - trending creators based on user preferences - REQUIRES AUTHENTICATION
router.get("/discovery/users/:userId", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 20 } = req.query;
		const offset = (page - 1) * limit;

		console.log(`[DEBUG] Fetching discovery users for user: ${userId}`);

		// Get users the current user already follows
		const { data: followingData, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId);

		if (followingError) {
			console.error("[ERROR] Error fetching following data:", followingError);
		}

		const followingIds = followingData
			? followingData.map((f) => f.following_id)
			: [];

		console.log(`[DEBUG] User ${userId} follows ${followingIds.length} users`);

		// Get users with their voice notes stats for engagement scoring
		let query = supabase
			.from("users")
			.select(
				`
				id, username, display_name, avatar_url, is_verified, bio,
				voice_notes(
					id,
					likes:voice_note_likes(count),
					comments:voice_note_comments(count),
					plays:voice_note_plays(count)
				)
			`
			)
			.neq("id", userId); // Exclude current user

		// Exclude users already followed
		if (followingIds.length > 0) {
			query = query.not("id", "in", `(${followingIds.join(",")})`);
		}

		const { data: users, error: usersError } = await query.limit(50); // Get more to score and rank

		if (usersError) {
			console.error("[ERROR] Error fetching users:", usersError);
			throw usersError;
		}

		console.log(
			`[DEBUG] Found ${users ? users.length : 0} users for discovery`
		);

		// Process users with engagement scoring
		const processedUsers = (users || []).map((user) => {
			let totalLikes = 0;
			let totalComments = 0;
			let totalPlays = 0;
			let totalPosts = 0;

			// Calculate engagement from voice notes
			if (user.voice_notes && Array.isArray(user.voice_notes)) {
				user.voice_notes.forEach((note) => {
					totalPosts++;
					totalLikes += note.likes?.[0]?.count || 0;
					totalComments += note.comments?.[0]?.count || 0;
					totalPlays += note.plays?.[0]?.count || 0;
				});
			}

			// Calculate discovery score
			let score = totalLikes * 0.3 + totalComments * 0.5 + totalPlays * 0.1;
			score += totalPosts * 2; // Boost for having content

			// Boost verified users
			if (user.is_verified) {
				score += 10;
			}

			// Base score for all users
			score += 1;

			return {
				id: user.id,
				username: user.username,
				display_name: user.display_name,
				avatar_url: user.avatar_url,
				is_verified: user.is_verified,
				bio: user.bio,
				discoveryScore: score,
				recentPostsCount: totalPosts,
				totalEngagement: totalLikes + totalComments + totalPlays,
			};
		});

		// Sort by discovery score and apply pagination
		const sortedUsers = processedUsers.sort(
			(a, b) => b.discoveryScore - a.discoveryScore
		);
		const finalUsers = sortedUsers.slice(offset, offset + parseInt(limit));

		console.log(
			`[DEBUG] Returning ${finalUsers.length} discovery users for user ${userId}`
		);
		res.status(200).json(finalUsers);
	} catch (error) {
		console.error("Error fetching discovery users:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

module.exports = router;
