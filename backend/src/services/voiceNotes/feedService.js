const supabase = require("../../config/supabase");
const {
	processVoiceNoteCounts,
	calculateDiscoveryScore,
	calculateUserDiscoveryScore,
} = require("../../utils/voiceNotes/processors");
const { VOICE_NOTE_SELECT_QUERY } = require("./voiceNoteService"); // Import the golden query

/**
 * Service layer for feed algorithms and discovery functionality
 */

/**
 * Get user's following IDs
 * @param {string} userId - User ID
 * @returns {Array} Array of following user IDs
 */
const getUserFollowing = async (userId) => {
	const { data, error } = await supabase
		.from("follows")
		.select("following_id")
		.eq("follower_id", userId);

	if (error) throw error;
	return data.map((follow) => follow.following_id);
};

/**
 * Get original posts from followed users
 * @param {Array} followingIds - IDs of users being followed
 * @param {Object} options - Query options
 * @returns {Array} Original posts with engagement data
 */
const getOriginalPosts = async (followingIds, options = {}) => {
	const { limit = 10, offset = 0 } = options;

	if (followingIds.length === 0) return [];

	const { data, error } = await supabase
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
		.in("user_id", followingIds)
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	// Get actual share counts for all voice notes in parallel
	const shareCountPromises = data.map(async (note) => {
		try {
			const { count } = await supabase
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", note.id);
			return { voiceNoteId: note.id, shareCount: count || 0 };
		} catch (error) {
			console.warn(`Failed to get share count for ${note.id}:`, error);
			return { voiceNoteId: note.id, shareCount: 0 };
		}
	});

	const shareCounts = await Promise.all(shareCountPromises);
	const shareCountMap = shareCounts.reduce(
		(map, { voiceNoteId, shareCount }) => {
			map[voiceNoteId] = shareCount;
			return map;
		},
		{}
	);

	return data.map((note) => {
		// Extract tags from the nested structure
		const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

		const processedNote = {
			...processVoiceNoteCounts(note),
			tags,
			is_shared: false,
		};

		// Override the share count with the actual count
		processedNote.shares = shareCountMap[note.id] || 0;

		return processedNote;
	});
};

/**
 * Get shared posts from followed users
 * @param {Array} followingIds - IDs of users being followed
 * @param {Object} options - Query options
 * @returns {Array} Shared posts with engagement data and sharer info
 */
const getSharedPosts = async (followingIds, options = {}) => {
	const { limit = 10, offset = 0 } = options;

	if (followingIds.length === 0) return [];

	// Get share records from followed users
	const { data: sharedData, error: sharedError } = await supabase
		.from("voice_note_shares")
		.select("id, voice_note_id, user_id, shared_at")
		.in("user_id", followingIds)
		.order("shared_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (sharedError && sharedError.code !== "42P01") {
		throw sharedError;
	}

	if (!sharedData || sharedData.length === 0) return [];

	// Get the actual voice notes
	const sharedVoiceNoteIds = sharedData.map((share) => share.voice_note_id);
	const { data: sharedVoiceNotes, error: sharedVoiceNotesError } =
		await supabase
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
			.in("id", sharedVoiceNoteIds);

	if (sharedVoiceNotesError) throw sharedVoiceNotesError;

	// Get actual share counts for all voice notes in parallel
	const shareCountPromises = sharedVoiceNotes.map(async (note) => {
		try {
			const { count } = await supabase
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", note.id);
			return { voiceNoteId: note.id, shareCount: count || 0 };
		} catch (error) {
			console.warn(`Failed to get share count for ${note.id}:`, error);
			return { voiceNoteId: note.id, shareCount: 0 };
		}
	});

	const shareCounts = await Promise.all(shareCountPromises);
	const shareCountMap = shareCounts.reduce(
		(map, { voiceNoteId, shareCount }) => {
			map[voiceNoteId] = shareCount;
			return map;
		},
		{}
	);

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

	// Combine voice notes with share info
	return sharedVoiceNotes.map((note) => {
		// Extract tags from the nested structure
		const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

		const shareRecord = sharersData.find(
			(share) => share.voice_note_id === note.id
		);

		const processedNote = {
			...processVoiceNoteCounts(note),
			tags,
			is_shared: true,
			shared_at: shareRecord?.shared_at || new Date().toISOString(),
			shared_by: shareRecord?.sharer || null,
		};

		// Override the share count with the actual count
		processedNote.shares = shareCountMap[note.id] || 0;

		return processedNote;
	});
};

/**
 * Get balanced feed for a user (mix of original and shared posts)
 * @param {string} userId - User ID
 * @param {Object} options - Feed options
 * @returns {Array} Balanced feed posts
 */
const getBalancedFeed = async (userId, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const offset = (page - 1) * limit;

	// Get following IDs
	const followingIds = await getUserFollowing(userId);

	if (followingIds.length === 0) {
		return [];
	}

	// Calculate how many original vs shared posts to fetch for balance
	const originalPostsTarget = Math.ceil(limit * 0.6); // 60% original
	const sharedPostsTarget = Math.floor(limit * 0.4); // 40% shared

	// Fetch both types in parallel
	const [originalPosts, sharedPosts] = await Promise.all([
		getOriginalPosts(followingIds, {
			limit: originalPostsTarget * 2,
			offset: Math.floor(offset * 0.6),
		}),
		getSharedPosts(followingIds, {
			limit: sharedPostsTarget * 2,
			offset: Math.floor(offset * 0.4),
		}),
	]);

	// Interleave posts for balanced feed
	const balancedFeed = [];
	let originalIndex = 0;
	let sharedIndex = 0;

	for (let i = 0; i < limit; i++) {
		// Determine if we should add original or shared based on ratio
		const shouldAddOriginal = i % 5 < 3; // 3 out of 5 should be original (60%)

		if (shouldAddOriginal && originalIndex < originalPosts.length) {
			balancedFeed.push(originalPosts[originalIndex++]);
		} else if (sharedIndex < sharedPosts.length) {
			balancedFeed.push(sharedPosts[sharedIndex++]);
		} else if (originalIndex < originalPosts.length) {
			balancedFeed.push(originalPosts[originalIndex++]);
		}
	}

	return balancedFeed;
};

/**
 * Get discovery posts for a user based on their preferences
 * @param {string} userId - User ID
 * @param {Object} options - Discovery options
 * @returns {Array} Personalized discovery posts
 */
const getDiscoveryPosts = async (userId, options = {}) => {
	const { page = 1, limit = 20 } = options;
	const offset = (page - 1) * limit;

	// Get user's following to exclude from discovery
	const followingIds = await getUserFollowing(userId);

	// Get user's preferred tags from their liked posts
	const { data: likedPosts } = await supabase
		.from("voice_note_likes")
		.select(
			`
			voice_notes:voice_note_id (
				tags:voice_note_tags (tag_name)
			)
		`
		)
		.eq("user_id", userId)
		.limit(50);

	const preferredTags = [
		...new Set(
			likedPosts
				?.flatMap(
					(like) => like.voice_notes?.tags?.map((t) => t.tag_name) || []
				)
				.filter(Boolean) || []
		),
	];

	// Get creators user has liked before
	const { data: likedCreatorsData } = await supabase
		.from("voice_note_likes")
		.select(
			`
			voice_notes:voice_note_id (user_id)
		`
		)
		.eq("user_id", userId);

	const likedCreators = [
		...new Set(
			likedCreatorsData
				?.map((like) => like.voice_notes?.user_id)
				.filter(Boolean) || []
		),
	];

	// Get discovery posts (exclude own posts and posts from followed users)
	let query = supabase
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
		.neq("user_id", userId); // Exclude user's own posts

	// Exclude posts from users already followed
	if (followingIds.length > 0) {
		query = query.not("user_id", "in", `(${followingIds.join(",")})`);
	}

	const { data: discoveryPosts, error } = await query
		.order("created_at", { ascending: false })
		.limit(Math.min(100, limit * 3)); // Get more to rank and filter

	if (error) throw error;

	if (!discoveryPosts || discoveryPosts.length === 0) {
		return [];
	}

	// Get actual share counts for all voice notes in parallel
	const shareCountPromises = discoveryPosts.map(async (note) => {
		try {
			const { count } = await supabase
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", note.id);
			return { voiceNoteId: note.id, shareCount: count || 0 };
		} catch (error) {
			console.warn(`Failed to get share count for ${note.id}:`, error);
			return { voiceNoteId: note.id, shareCount: 0 };
		}
	});

	const shareCounts = await Promise.all(shareCountPromises);
	const shareCountMap = shareCounts.reduce(
		(map, { voiceNoteId, shareCount }) => {
			map[voiceNoteId] = shareCount;
			return map;
		},
		{}
	);

	// Calculate discovery scores and sort
	const processedPosts = discoveryPosts.map((post) => {
		const scoredPost = calculateDiscoveryScore(
			post,
			preferredTags,
			likedCreators
		);
		// Process the counts to convert from Supabase aggregation format to simple numbers
		const processedPost = processVoiceNoteCounts(scoredPost);
		// Override the share count with the actual count
		processedPost.shares = shareCountMap[post.id] || 0;
		return processedPost;
	});

	const finalPosts = processedPosts
		.sort((a, b) => b.discoveryScore - a.discoveryScore)
		.slice(offset, offset + parseInt(limit));

	return finalPosts;
};

/**
 * Get discovery users for a user to follow
 * @param {string} userId - User ID
 * @param {Object} options - Discovery options
 * @returns {Array} Recommended users to follow
 */
const getDiscoveryUsers = async (userId, options = {}) => {
	const { page = 1, limit = 20 } = options;
	const offset = (page - 1) * limit;

	// Get users the current user already follows
	const followingIds = await getUserFollowing(userId);

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

	const { data: users, error } = await query.limit(50); // Get more to score and rank

	if (error) throw error;

	if (!users || users.length === 0) {
		return [];
	}

	// Process users with engagement scoring
	const processedUsers = users.map(calculateUserDiscoveryScore);

	// Sort by discovery score and apply pagination
	const finalUsers = processedUsers
		.sort((a, b) => b.discoveryScore - a.discoveryScore)
		.slice(offset, offset + parseInt(limit));

	return finalUsers;
};

/**
 * Get voice notes by tag
 * @param {string} tagName - Tag name
 * @param {Object} options - Query options
 * @returns {Object} Voice notes with pagination info
 */
const getVoiceNotesByTag = async (tagName, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const offset = (page - 1) * limit;

	// First, find the voice_note_ids associated with the tag
	const { data: tagData, error: tagError } = await supabase
		.from("voice_note_tags")
		.select("voice_note_id")
		.eq("tag_name", tagName.toLowerCase());

	if (tagError) throw tagError;
	if (!tagData || tagData.length === 0) {
		return { data: [], pagination: { total: 0, totalPages: 0, page, limit } };
	}

	const voiceNoteIds = tagData.map((t) => t.voice_note_id);

	// Now, fetch the voice notes with those IDs
	const { data, error, count } = await supabase
		.from("voice_notes")
		.select(VOICE_NOTE_SELECT_QUERY, { count: "exact" })
		.in("id", voiceNoteIds)
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) throw error;

	// Reshape the data to return just the voice notes with proper tag processing
	const voiceNotes = data.map((item) => {
		const voiceNote = item.voice_notes;
		// Extract tags from the nested structure
		const tags = voiceNote.tags
			? voiceNote.tags.map((tag) => tag.tag_name)
			: [];

		const processedNote = {
			...processVoiceNoteCounts(voiceNote),
			tags,
		};

		return processedNote;
	});

	return {
		data: voiceNotes,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: count,
			totalPages: Math.ceil(count / limit),
		},
	};
};

/**
 * Get public feed for anonymous users
 * @param {Object} options - Query options
 * @returns {Object} Public voice notes with pagination
 */
const getPublicFeed = async (options = {}) => {
	const { page = 1, limit = 10, discover = "newest", currentUserId } = options;
	const offset = (page - 1) * limit;

	let query = supabase.from("voice_notes").select(VOICE_NOTE_SELECT_QUERY, {
		count: "exact",
	});

	if (discover === "newest") {
		query = query.order("created_at", { ascending: false });
	} else if (discover === "oldest") {
		query = query.order("created_at", { ascending: true });
	}

	const { data, error, count } = await query.range(
		offset,
		offset + parseInt(limit) - 1
	);

	if (error) throw error;

	// Get actual share counts for all voice notes in parallel
	const shareCountPromises = data.map(async (note) => {
		try {
			const { count } = await supabase
				.from("voice_note_shares")
				.select("*", { count: "exact", head: true })
				.eq("voice_note_id", note.id);
			return { voiceNoteId: note.id, shareCount: count || 0 };
		} catch (error) {
			console.warn(`Failed to get share count for ${note.id}:`, error);
			return { voiceNoteId: note.id, shareCount: 0 };
		}
	});

	const shareCounts = await Promise.all(shareCountPromises);
	const shareCountMap = shareCounts.reduce(
		(map, { voiceNoteId, shareCount }) => {
			map[voiceNoteId] = shareCount;
			return map;
		},
		{}
	);

	// Process voice note counts and tags
	const processedData = data.map((note) => {
		// Extract tags from the nested structure
		const tags = note.tags ? note.tags.map((tag) => tag.tag_name) : [];

		const processedNote = {
			...processVoiceNoteCounts(note),
			tags,
		};

		// Override the share count with the actual count
		processedNote.shares = shareCountMap[note.id] || 0;

		return processedNote;
	});

	return {
		data: processedData,
		pagination: {
			page: parseInt(page),
			limit: parseInt(limit),
			total: count,
			totalPages: Math.ceil(count / limit),
		},
	};
};

module.exports = {
	getUserFollowing,
	getOriginalPosts,
	getSharedPosts,
	getBalancedFeed,
	getDiscoveryPosts,
	getDiscoveryUsers,
	getVoiceNotesByTag,
	getPublicFeed,
};
