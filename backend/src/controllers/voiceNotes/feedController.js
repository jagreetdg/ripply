const feedService = require("../../services/voiceNotes/feedService");

/**
 * Controller for feed algorithms and discovery functionality
 */

/**
 * Get public feed (for anonymous users)
 * @route GET /api/voice-notes/feed
 */
const getPublicFeed = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;

		console.log(`[DEBUG] Fetching public feed, page: ${page}, limit: ${limit}`);

		const feed = await feedService.getPublicFeed({
			page: parseInt(page),
			limit: parseInt(limit),
		});

		console.log(
			`[DEBUG] Returning ${feed.data?.length || 0} posts in public feed`
		);
		res.status(200).json(feed);
	} catch (error) {
		console.error("Error fetching public feed:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get user's personalized feed
 * @route GET /api/voice-notes/feed/:userId
 */
const getUserFeed = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		console.log(
			`[DEBUG] Fetching feed for user: ${userId}, page: ${page}, limit: ${limit}`
		);

		const feed = await feedService.getBalancedFeed(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		console.log(`[DEBUG] Returning ${feed.length} posts in user feed`);
		res.status(200).json(feed);
	} catch (error) {
		console.error("Error fetching user feed:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get discovery posts for a user
 * @route GET /api/voice-notes/discovery/posts/:userId
 */
const getDiscoveryPosts = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		console.log(`[DEBUG] Fetching discovery posts for user: ${userId}`);

		const discoveryPosts = await feedService.getDiscoveryPosts(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(discoveryPosts);
	} catch (error) {
		console.error("Error fetching discovery posts:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get discovery users for a user to follow
 * @route GET /api/voice-notes/discovery/users/:userId
 */
const getDiscoveryUsers = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 20 } = req.query;

		console.log(`[DEBUG] Fetching discovery users for user: ${userId}`);

		const discoveryUsers = await feedService.getDiscoveryUsers(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(discoveryUsers);
	} catch (error) {
		console.error("Error fetching discovery users:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get voice notes by tag
 * @route GET /api/voice-notes/tags/:tagName
 */
const getVoiceNotesByTag = async (req, res) => {
	try {
		const { tagName } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const result = await feedService.getVoiceNotesByTag(tagName, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching voice notes by tag:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get tags for a voice note
 * @route GET /api/voice-notes/:id/tags
 */
const getVoiceNoteTags = async (req, res) => {
	try {
		const { id } = req.params;

		// This is a simplified implementation
		// In a full implementation, you might have a dedicated tag service
		const supabase = require("../../config/supabase");

		const { data, error } = await supabase
			.from("voice_note_tags")
			.select("tag_name")
			.eq("voice_note_id", id);

		if (error) throw error;

		const tags = data.map((item) => item.tag_name);
		res.status(200).json(tags);
	} catch (error) {
		console.error("Error fetching voice note tags:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	getPublicFeed,
	getUserFeed,
	getDiscoveryPosts,
	getDiscoveryUsers,
	getVoiceNotesByTag,
	getVoiceNoteTags,
};
