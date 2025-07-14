const contentService = require("../../services/users/contentService");

/**
 * Controller for user content management
 */

/**
 * Get voice notes by user
 * @route GET /api/users/:userId/voice-notes
 */
const getUserVoiceNotes = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const result = await contentService.getUserVoiceNotes(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching user voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get shared voice notes by user (reposted content)
 * @route GET /api/users/:userId/shared-voice-notes
 */
const getUserSharedVoiceNotes = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		console.log(
			`[DEBUG] getUserSharedVoiceNotes called - userId: ${userId}, page: ${page}, limit: ${limit}`
		);

		const result = await contentService.getUserSharedVoiceNotes(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		console.log(`[DEBUG] getUserSharedVoiceNotes result:`, {
			dataLength: result.data?.length,
			pagination: result.pagination,
			hasMessage: !!result.message,
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching user shared voice notes:", error);
		console.error("Error details:", {
			message: error.message,
			code: error.code,
			details: error.details,
			hint: error.hint,
			stack: error.stack,
		});
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get combined content for a user (both original and shared)
 * @route GET /api/users/:userId/combined-content
 */
const getUserCombinedContent = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const result = await contentService.getUserCombinedContent(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		res.status(200).json(result);
	} catch (error) {
		console.error("Error fetching user combined content:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	getUserVoiceNotes,
	getUserSharedVoiceNotes,
	getUserCombinedContent,
};
