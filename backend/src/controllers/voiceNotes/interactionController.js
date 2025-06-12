const interactionService = require("../../services/voiceNotes/interactionService");

/**
 * Controller for voice note interactions (likes, comments, plays, shares)
 */

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

		const like = await interactionService.likeVoiceNote(id, userId);
		res.status(201).json(like);
	} catch (error) {
		if (error.message === "Already liked this voice note") {
			return res.status(400).json({ message: error.message });
		}

		console.error("Error liking voice note:", error);
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
		res.status(200).json({ message: "Voice note unliked successfully" });
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
		res.status(200).json({ hasLiked });
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

		// Check if already shared to toggle behavior
		const alreadyShared = await interactionService.checkUserShared(
			voiceNoteId,
			userId
		);

		if (alreadyShared) {
			// Unshare
			await interactionService.unshareVoiceNote(voiceNoteId, userId);
			console.log(`[DEBUG] User ${userId} unshared voice note ${voiceNoteId}`);
			res.status(200).json({
				message: "Voice note unshared successfully",
				action: "unshared",
			});
		} else {
			// Share
			const share = await interactionService.shareVoiceNote(
				voiceNoteId,
				userId
			);
			console.log(`[DEBUG] User ${userId} shared voice note ${voiceNoteId}`);
			res.status(201).json({
				...share,
				action: "shared",
			});
		}
	} catch (error) {
		console.error("Error sharing/unsharing voice note:", error);
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

		const result = await interactionService.getVoiceNoteShares(voiceNoteId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
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
		res.status(200).json({ hasShared });
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
