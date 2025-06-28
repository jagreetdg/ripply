const uuidv4 = require("uuid").v4;
const voiceNoteService = require("../../services/voiceNotes/voiceNoteService");
const { processVoiceNoteCounts } = require("../../utils/voiceNotes/processors");

/**
 * Controller for basic voice note CRUD operations
 */

/**
 * Get all voice notes with pagination
 * @route GET /api/voice-notes
 */
const getAllVoiceNotes = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;

		const result = await voiceNoteService.getVoiceNotes({
			page: parseInt(page),
			limit: parseInt(limit),
		});

		// Process voice note counts and tags
		const processedData = result.data.map((note) => {
			return processVoiceNoteCounts(note);
		});

		res.status(200).json({
			...result,
			data: processedData,
		});
	} catch (error) {
		console.error("Error fetching voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get a single voice note by ID
 * @route GET /api/voice-notes/:id
 */
const getVoiceNoteById = async (req, res) => {
	try {
		const { id } = req.params;

		const voiceNote = await voiceNoteService.getVoiceNoteById(id);

		if (!voiceNote) {
			return res.status(404).json({ message: "Voice note not found" });
		}

		const processedVoiceNote = processVoiceNoteCounts(voiceNote);
		res.status(200).json(processedVoiceNote);
	} catch (error) {
		console.error("Error fetching voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Create a new voice note
 * @route POST /api/voice-notes
 */
const createVoiceNote = async (req, res) => {
	try {
		const {
			title,
			description,
			audio_url,
			duration,
			is_public = true,
			user_id,
			tags = [],
		} = req.body;

		// Validate required fields
		if (!title || !audio_url || !user_id) {
			return res.status(400).json({
				message: "title, audio_url, and user_id are required",
			});
		}

		const voiceNoteData = {
			id: uuidv4(),
			title,
			description,
			audio_url,
			duration,
			is_public,
			user_id,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const createdVoiceNote = await voiceNoteService.createVoiceNote(
			voiceNoteData
		);

		// Handle tags if provided
		if (tags && tags.length > 0) {
			// Note: Tag handling could be moved to a separate service
			// For now, this is a simplified implementation
			console.log(`Creating voice note with tags: ${tags.join(", ")}`);
		}

		res.status(201).json(createdVoiceNote);
	} catch (error) {
		console.error("Error creating voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Update a voice note
 * @route PUT /api/voice-notes/:id
 */
const updateVoiceNote = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = {
			...req.body,
			updated_at: new Date().toISOString(),
		};

		// Remove fields that shouldn't be updated directly
		delete updates.id;
		delete updates.created_at;
		delete updates.user_id;

		const updatedVoiceNote = await voiceNoteService.updateVoiceNote(
			id,
			updates
		);

		if (!updatedVoiceNote) {
			return res.status(404).json({ message: "Voice note not found" });
		}

		res.status(200).json(updatedVoiceNote);
	} catch (error) {
		console.error("Error updating voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Delete a voice note
 * @route DELETE /api/voice-notes/:id
 */
const deleteVoiceNote = async (req, res) => {
	try {
		const { id } = req.params;

		await voiceNoteService.deleteVoiceNote(id);

		res.status(200).json({ message: "Voice note deleted successfully" });
	} catch (error) {
		console.error("Error deleting voice note:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Search voice notes
 * @route GET /api/voice-notes/search
 */
const searchVoiceNotes = async (req, res) => {
	try {
		const {
			term: searchTerm,
			searchType,
			page = 1,
			limit = 10,
			currentUserId,
		} = req.query;

		// This case is for when the search bar is empty.
		if (!searchTerm) {
			const result = await voiceNoteService.getVoiceNotes({
				page: parseInt(page),
				limit: parseInt(limit),
			});
			return res.status(200).json(result);
		}

		const result = await voiceNoteService.searchVoiceNotes(searchTerm, {
			page: parseInt(page),
			limit: parseInt(limit),
			searchType: searchType || "title",
			currentUserId,
		});

		// The service now returns the data in the exact shape the frontend needs.
		// No further processing is required here.
		res.status(200).json(result);
	} catch (error) {
		console.error("Error searching voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Get voice notes by user
 * @route GET /api/voice-notes/user/:userId
 */
const getVoiceNotesByUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const result = await voiceNoteService.getVoiceNotesByUser(userId, {
			page: parseInt(page),
			limit: parseInt(limit),
		});

		// Process voice note counts and tags
		const processedData = result.data.map((note) => {
			return processVoiceNoteCounts(note);
		});

		res.status(200).json({
			...result,
			data: processedData,
		});
	} catch (error) {
		console.error("Error fetching user voice notes:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

module.exports = {
	getAllVoiceNotes,
	getVoiceNoteById,
	createVoiceNote,
	updateVoiceNote,
	deleteVoiceNote,
	searchVoiceNotes,
	getVoiceNotesByUser,
};
