/**
 * Utility functions for processing voice note data
 */

/**
 * Process voice note counts from Supabase aggregation format
 * @param {Object} note - Voice note object with aggregated counts
 * @returns {Object} Processed note with extracted count values
 */
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

/**
 * Calculate discovery score for a voice note based on engagement
 * @param {Object} post - Voice note post object
 * @param {Array} preferredTags - User's preferred tags
 * @param {Array} likedCreators - Creators the user has liked before
 * @returns {Object} Post with discovery score
 */
const calculateDiscoveryScore = (
	post,
	preferredTags = [],
	likedCreators = []
) => {
	let score = 1; // Base score

	// Score based on tag preferences
	if (post.tags && preferredTags.length > 0) {
		const postTags = post.tags.map((t) => t.tag_name);
		const tagMatches = postTags.filter((tag) => preferredTags.includes(tag));
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
};

/**
 * Calculate discovery score for a user based on their content engagement
 * @param {Object} user - User object with voice notes data
 * @returns {Object} User with discovery score
 */
const calculateUserDiscoveryScore = (user) => {
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
};

module.exports = {
	processVoiceNoteCounts,
	calculateDiscoveryScore,
	calculateUserDiscoveryScore,
};
