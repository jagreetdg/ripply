const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Import controllers
const voiceNoteController = require("../controllers/voiceNotes/voiceNoteController");
const interactionController = require("../controllers/voiceNotes/interactionController");
const feedController = require("../controllers/voiceNotes/feedController");
const uploadController = require("../controllers/voiceNotes/uploadController");

/**
 * Refactored Voice Notes Routes
 *
 * This file replaces the monolithic voiceNotes.js route file with a clean,
 * modular structure using separate controllers for different concerns.
 */

// ===== STATIC ROUTES (MUST COME BEFORE DYNAMIC ROUTES) =====

/**
 * Test deployment endpoint - Development only
 * @route GET /api/voice-notes/test-deployment
 */
router.get("/test-deployment", async (req, res) => {
	// Only allow in development
	if (process.env.NODE_ENV === "production") {
		return res.status(404).json({ error: "Endpoint not found" });
	}

	try {
		const deploymentInfo = {
			timestamp: new Date().toISOString(),
			message: "Refactored voice notes API deployed successfully",
			version: "2024-12-19-refactored",
			architecture: "Modular MVC pattern with service layer",
			improvements: [
				"Separated concerns into controllers, services, and utilities",
				"Reduced monolithic file from 1,938 lines to focused modules",
				"Improved maintainability and testability",
				"Clear separation of feed algorithms, CRUD operations, and interactions",
			],
		};

		res.status(200).json(deploymentInfo);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// ===== FEED & DISCOVERY (BEFORE DYNAMIC ROUTES) =====

// Get public feed (public)
router.get("/feed", feedController.getPublicFeed);

// Get personalized feed for user (authenticated)
router.get("/feed/:userId", authenticateToken, feedController.getUserFeed);

// ===== BASIC CRUD OPERATIONS =====

// Search voice notes (public)
router.get("/search", voiceNoteController.searchVoiceNotes);

// Get voice notes by user (public)
router.get("/user/:userId", voiceNoteController.getVoiceNotesByUser);

// Get all voice notes with pagination (authenticated)
router.get("/", authenticateToken, voiceNoteController.getAllVoiceNotes);

// Get single voice note by ID (public)
router.get("/:id", voiceNoteController.getVoiceNoteById);

// Create new voice note (authenticated)
router.post("/", authenticateToken, voiceNoteController.createVoiceNote);

// Update voice note (authenticated)
router.put("/:id", authenticateToken, voiceNoteController.updateVoiceNote);

// Delete voice note (authenticated)
router.delete("/:id", authenticateToken, voiceNoteController.deleteVoiceNote);

// ===== ADDITIONAL DISCOVERY =====

// Get discovery posts (authenticated)
router.get(
	"/discovery/posts/:userId",
	authenticateToken,
	feedController.getDiscoveryPosts
);

// Get discovery users (authenticated)
router.get(
	"/discovery/users/:userId",
	authenticateToken,
	feedController.getDiscoveryUsers
);

// Get voice notes by tag (public)
router.get("/tags/:tagName", feedController.getVoiceNotesByTag);

// Get tags for a voice note (public)
router.get("/:id/tags", feedController.getVoiceNoteTags);

// ===== INTERACTIONS =====

// Likes
router.get("/:id/likes", interactionController.getVoiceNoteLikes);
router.post(
	"/:id/like",
	authenticateToken,
	interactionController.likeVoiceNote
);
router.post(
	"/:id/unlike",
	authenticateToken,
	interactionController.unlikeVoiceNote
);
router.get(
	"/:id/likes/check",
	authenticateToken,
	interactionController.checkUserLiked
);

// Comments
router.get("/:id/comments", interactionController.getVoiceNoteComments);
router.post(
	"/:id/comments",
	authenticateToken,
	interactionController.addComment
);

// Plays
router.post("/:id/play", interactionController.recordPlay);

// Shares
router.post(
	"/:voiceNoteId/share",
	authenticateToken,
	interactionController.shareVoiceNote
);
router.get("/:voiceNoteId/shares", interactionController.getVoiceNoteShares);
router.get(
	"/:id/shares/check",
	authenticateToken,
	interactionController.checkUserShared
);

// ===== NEW CLEAN INTERACTION SYSTEM =====
router.post(
	"/:id/like-new",
	authenticateToken,
	interactionController.toggleLikeNew
);
router.post(
	"/:id/share-new",
	authenticateToken,
	interactionController.toggleShareNew
);
router.get(
	"/:id/interaction-status",
	authenticateToken,
	interactionController.getInteractionStatusNew
);

// ===== TEST ROUTES (for testing purposes) =====
router.get("/test", (req, res) => {
	res.json({ route: "voiceNotes" });
});

router.post("/test", (req, res) => {
	res.json({ route: "voiceNotes" });
});

module.exports = router;
