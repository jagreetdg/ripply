const { uploadVoiceNote } = require("../../utils/storage");

/**
 * Controller for voice note file uploads
 */

/**
 * Upload a voice note file to Supabase storage
 * @route POST /api/voice-notes/upload
 */
const uploadVoiceNoteFile = async (req, res) => {
	try {
		const userId = req.user?.id; // Get user ID from authenticated user

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		// Check if file was uploaded
		const file = req.file;
		if (!file) {
			return res.status(400).json({ message: "Audio file is required" });
		}

		// Validate file type
		if (!file.mimetype || !file.mimetype.startsWith("audio/")) {
			return res.status(400).json({
				message: "Invalid file type. Only audio files are allowed.",
				allowedTypes: [
					"audio/webm",
					"audio/mp4",
					"audio/mpeg",
					"audio/ogg",
					"audio/wav",
				],
			});
		}

		// Validate file size (10MB max)
		const maxFileSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxFileSize) {
			return res.status(400).json({
				message: `File too large. Maximum size allowed: ${
					maxFileSize / (1024 * 1024)
				}MB`,
			});
		}

		// Upload to Supabase storage
		const audioUrl = await uploadVoiceNote(userId, {
			buffer: file.buffer,
			mimetype: file.mimetype,
			name: file.originalname,
		});

		if (!audioUrl) {
			throw new Error("Failed to generate audio URL");
		}

		// Return the signed URL for the uploaded file
		res.status(200).json({
			message: "Voice note uploaded successfully",
			audio_url: audioUrl,
			file_info: {
				originalName: file.originalname,
				mimeType: file.mimetype,
				size: file.size,
			},
		});
	} catch (error) {
		console.error("Error uploading voice note:", error);

		// Handle specific Supabase errors
		if (error.message && error.message.includes("duplicate")) {
			return res.status(409).json({
				message: "File already exists. Please try again.",
			});
		}

		if (error.message && error.message.includes("quota")) {
			return res.status(507).json({
				message: "Storage quota exceeded. Please contact support.",
			});
		}

		res.status(500).json({
			message: "Failed to upload voice note",
			error: error.message,
		});
	}
};

/**
 * Create voice note with uploaded audio
 * @route POST /api/voice-notes/create-with-upload
 */
const createVoiceNoteWithUpload = async (req, res) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { caption, duration } = req.body;
		const file = req.file;

		if (!file) {
			return res.status(400).json({ message: "Audio file is required" });
		}

		// Validate duration
		const durationNum = parseFloat(duration);
		if (
			!duration ||
			isNaN(durationNum) ||
			durationNum <= 0 ||
			durationNum > 60
		) {
			return res.status(400).json({
				message: "Duration must be a number between 1 and 60 seconds",
			});
		}

		// Validate file type
		if (!file.mimetype || !file.mimetype.startsWith("audio/")) {
			return res.status(400).json({
				message: "Invalid file type. Only audio files are allowed.",
			});
		}

		// Upload the audio file first
		const audioUrl = await uploadVoiceNote(userId, {
			buffer: file.buffer,
			mimetype: file.mimetype,
			name: file.originalname,
		});

		if (!audioUrl) {
			throw new Error("Failed to upload audio file");
		}

		// Create voice note record
		const voiceNoteService = require("../../services/voiceNotes/voiceNoteService");
		const { v4: uuidv4 } = require("uuid");

		const voiceNoteData = {
			id: uuidv4(),
			title: caption || "Voice Note", // Use caption as title, or default
			description: caption,
			audio_url: audioUrl,
			duration: Math.round(durationNum),
			is_public: true,
			user_id: userId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const createdVoiceNote = await voiceNoteService.createVoiceNote(
			voiceNoteData
		);

		res.status(201).json({
			message: "Voice note created successfully",
			voice_note: createdVoiceNote,
		});
	} catch (error) {
		console.error("Error creating voice note with upload:", error);
		res.status(500).json({
			message: "Failed to create voice note",
			error: error.message,
		});
	}
};

module.exports = {
	uploadVoiceNoteFile,
	createVoiceNoteWithUpload,
};
