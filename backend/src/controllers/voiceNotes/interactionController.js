const interactionService = require("../../services/voiceNotes/interactionService");

/**
 * Controller for voice note interactions (likes, comments, plays, shares)
 */

// In-memory cache to prevent duplicate requests
const requestCache = new Map();

// Helper function to create a request key
const createRequestKey = (userId, voiceNoteId, action) => {
	return `${userId}-${voiceNoteId}-${action}`;
};

// Helper function to handle request deduplication
const withRequestDeduplication = async (
	userId,
	voiceNoteId,
	action,
	handler
) => {
	const requestKey = createRequestKey(userId, voiceNoteId, action);

	// Check if request is already in progress
	if (requestCache.has(requestKey)) {
		console.log(`[DEDUP] Request already in progress: ${requestKey}`);
		throw new Error("Request already in progress. Please wait.");
	}

	// Mark request as in progress
	requestCache.set(requestKey, Date.now());

	try {
		const result = await handler();
		return result;
	} finally {
		// Remove from cache after completion
		requestCache.delete(requestKey);
	}
};

// Clean up old cache entries periodically (older than 30 seconds) - only in non-test environments
if (process.env.NODE_ENV !== "test") {
	setInterval(() => {
		const now = Date.now();
		for (const [key, timestamp] of requestCache.entries()) {
			if (now - timestamp > 30000) {
				requestCache.delete(key);
			}
		}
	}, 10000); // Clean every 10 seconds
}

// ===== LIKES =====

/**
 * Get likes for a voice note
 * @route GET /api/voice-notes/:id/likes
 */
const getVoiceNoteLikes = async (req, res) => {
	try {
		const { id } = req.params;

		const likes = await interactionService.getVoiceNoteLikes(id);
		res.status(200).json(likes);
	} catch (error) {
		console.error("Error fetching voice note likes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Like a voice note
 * @route POST /api/voice-notes/:id/like
 */
const likeVoiceNote = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id; // Use authenticated user ID

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		// Use request deduplication to prevent race conditions
		const result = await withRequestDeduplication(
			userId,
			id,
			"like",
			async () => {
				// Check if already liked to provide toggle behavior
				const alreadyLiked = await interactionService.checkUserLiked(
					id,
					userId
				);

				if (alreadyLiked) {
					// If already liked, unlike it (toggle behavior)
					await interactionService.unlikeVoiceNote(id, userId);
					const likesCount = await interactionService.getVoiceNoteLikes(id);

					return {
						message: "Voice note unliked successfully",
						isLiked: false,
						likesCount: likesCount,
					};
				} else {
					// If not liked, like it
					await interactionService.likeVoiceNote(id, userId);
					const likesCount = await interactionService.getVoiceNoteLikes(id);

					return {
						message: "Voice note liked successfully",
						isLiked: true,
						likesCount: likesCount,
					};
				}
			}
		);

		res.status(200).json(result);
	} catch (error) {
		console.error("Error toggling like on voice note:", error);

		if (error.message === "Request already in progress. Please wait.") {
			return res.status(429).json({ message: error.message });
		}

		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Unlike a voice note
 * @route POST /api/voice-notes/:id/unlike
 */
const unlikeVoiceNote = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id; // Use authenticated user ID

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		await interactionService.unlikeVoiceNote(id, userId);
		const likesCount = await interactionService.getVoiceNoteLikes(id);

		res.status(200).json({
			message: "Voice note unliked successfully",
			isLiked: false,
			likesCount: likesCount.length || 0,
		});
	} catch (error) {
		console.error("Error unliking voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Check if user has liked a voice note
 * @route GET /api/voice-notes/:id/likes/check
 */
const checkUserLiked = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id; // From authentication middleware

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const hasLiked = await interactionService.checkUserLiked(id, userId);
		res.status(200).json({ isLiked: hasLiked });
	} catch (error) {
		console.error("Error checking like status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ===== COMMENTS =====

/**
 * Get comments for a voice note
 * @route GET /api/voice-notes/:id/comments
 */
const getVoiceNoteComments = async (req, res) => {
	try {
		const { id } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const result = await interactionService.getVoiceNoteComments(id, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching comments:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Add a comment to a voice note
 * @route POST /api/voice-notes/:id/comments
 */
const addComment = async (req, res) => {
	try {
		const { id } = req.params;
		const { content } = req.body;
		const userId = req.user?.id; // Use authenticated user ID

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		if (!content) {
			return res.status(400).json({ message: "content is required" });
		}

		const comment = await interactionService.addComment(id, userId, content);
		res.status(201).json(comment);
	} catch (error) {
		console.error("Error adding comment:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ===== PLAYS =====

/**
 * Record a play for a voice note
 * @route POST /api/voice-notes/:id/play
 */
const recordPlay = async (req, res) => {
	try {
		const { id } = req.params;
		const { user_id } = req.body; // Keep optional user_id for anonymous plays

		// Allow anonymous plays if no user_id provided
		const userId = user_id || req.user?.id || null;

		const play = await interactionService.recordPlay(id, userId);
		res.status(201).json(play);
	} catch (error) {
		console.error("Error recording play:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// ===== SHARES =====

/**
 * Share or unshare a voice note
 * @route POST /api/voice-notes/:voiceNoteId/share
 */
const shareVoiceNote = async (req, res) => {
	try {
		const { voiceNoteId } = req.params;
		// Use the authenticated user's ID for security
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		if (!voiceNoteId) {
			return res.status(400).json({ message: "Voice note ID is required" });
		}

		console.log(
			`[DEBUG] Share/Unshare request: voiceNoteId=${voiceNoteId}, userId=${userId}`
		);

		// Use request deduplication to prevent race conditions
		const result = await withRequestDeduplication(
			userId,
			voiceNoteId,
			"share",
			async () => {
				// Check if already shared to toggle behavior
				const alreadyShared = await interactionService.checkUserShared(
					voiceNoteId,
					userId
				);

				if (alreadyShared) {
					// If already shared, unshare it (toggle behavior)
					await interactionService.unshareVoiceNote(voiceNoteId, userId);
					const shareCount = await interactionService.getVoiceNoteShareCount(
						voiceNoteId
					);

					console.log(
						`[DEBUG] Voice note unshared: voiceNoteId=${voiceNoteId}, userId=${userId}, newShareCount=${shareCount}`
					);

					return {
						message: "Voice note unshared successfully",
						isShared: false,
						shareCount: shareCount,
					};
				} else {
					// If not shared, share it
					await interactionService.shareVoiceNote(voiceNoteId, userId);
					const shareCount = await interactionService.getVoiceNoteShareCount(
						voiceNoteId
					);

					console.log(
						`[DEBUG] Voice note shared: voiceNoteId=${voiceNoteId}, userId=${userId}, newShareCount=${shareCount}`
					);

					return {
						message: "Voice note shared successfully",
						isShared: true,
						shareCount: shareCount,
					};
				}
			}
		);

		res.status(200).json(result);
	} catch (error) {
		console.error("Error toggling share on voice note:", error);

		if (error.message === "Request already in progress. Please wait.") {
			return res.status(429).json({ message: error.message });
		}

		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get shares for a voice note
 * @route GET /api/voice-notes/:voiceNoteId/shares
 */
const getVoiceNoteShares = async (req, res) => {
	try {
		const { voiceNoteId } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const userId = req.user?.id; // Get current user for repost status

		const result = await interactionService.getVoiceNoteShares(voiceNoteId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		// Return both the detailed result and a simple shareCount for API compatibility
		const shareCount = Array.isArray(result)
			? result.length
			: result.data
			? result.data.length
			: 0;

		// Also check if current user has shared it for consistency
		let isShared = false;
		if (userId) {
			try {
				isShared = await interactionService.checkUserShared(
					voiceNoteId,
					userId
				);
			} catch (error) {
				console.warn("Could not check user share status:", error.message);
			}
		}

		res.status(200).json({
			...result,
			shareCount: shareCount,
			isShared: isShared,
		});
	} catch (error) {
		console.error("Error fetching voice note shares:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Check if user has shared a voice note
 * @route GET /api/voice-notes/:id/shares/check
 */
const checkUserShared = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id; // From authentication middleware

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const hasShared = await interactionService.checkUserShared(id, userId);
		res.status(200).json({ isShared: hasShared });
	} catch (error) {
		console.error("Error checking share status:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	// Likes
	getVoiceNoteLikes,
	likeVoiceNote,
	unlikeVoiceNote,
	checkUserLiked,
	// Comments
	getVoiceNoteComments,
	addComment,
	// Plays
	recordPlay,
	// Shares
	shareVoiceNote,
	getVoiceNoteShares,
	checkUserShared,
};
