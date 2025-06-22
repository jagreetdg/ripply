const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Import controllers
const profileController = require("../controllers/users/profileController");
const followController = require("../controllers/users/followController");
const contentController = require("../controllers/users/contentController");

/**
 * Refactored Users Routes
 *
 * This file replaces the monolithic users.js route file with a clean,
 * modular structure using separate controllers for different concerns.
 */

// ===== PROFILE MANAGEMENT =====

// Get current authenticated user (authenticated)
router.get("/me", authenticateToken, profileController.getCurrentUser);

// Search for users (public)
router.get("/search", profileController.searchUsers);

// Get user by username (public)
router.get("/username/:username", profileController.getUserByUsername);

// Get user profile by ID (public)
router.get("/:userId", profileController.getUserById);

// Update user profile (authenticated)
router.put("/:userId", authenticateToken, profileController.updateUserProfile);

// Update user verification status (admin only) - REQUIRES AUTHENTICATION
router.patch(
	"/:userId/verify",
	authenticateToken,
	profileController.updateVerificationStatus
);

// Update user profile photos (authenticated) - REQUIRES AUTHENTICATION
router.patch(
	"/:userId/photos",
	authenticateToken,
	profileController.updateProfilePhotos
);

// ===== FOLLOW SYSTEM =====

// Follow a user (authenticated)
router.post("/:userId/follow", authenticateToken, followController.followUser);

// Unfollow a user (authenticated)
router.post(
	"/:userId/unfollow",
	authenticateToken,
	followController.unfollowUser
);

// Unfollow a user (authenticated) - Alternative DELETE method
router.delete(
	"/:userId/follow",
	authenticateToken,
	followController.unfollowUser
);

// Get user's followers (authenticated)
router.get(
	"/:userId/followers",
	authenticateToken,
	followController.getFollowers
);

// Get users that a user is following (authenticated)
router.get(
	"/:userId/following",
	authenticateToken,
	followController.getFollowing
);

// Check if a user is following another user (public)
router.get(
	"/:userId/is-following/:followerId",
	followController.checkFollowStatus
);

// Get follower count for a user (public)
router.get("/:userId/follower-count", followController.getFollowerCount);

// Get following count for a user (public)
router.get("/:userId/following-count", followController.getFollowingCount);

// Get follow statistics (new endpoint for both counts)
router.get("/:userId/follow-stats", followController.getFollowStats);

// ===== USER CONTENT =====

// Get voice notes by user (authenticated)
router.get(
	"/:userId/voice-notes",
	authenticateToken,
	contentController.getUserVoiceNotes
);

// Get shared voice notes by user (authenticated)
router.get(
	"/:userId/shared-voice-notes",
	authenticateToken,
	contentController.getUserSharedVoiceNotes
);

// Get combined content for a user (new endpoint)
router.get(
	"/:userId/combined-content",
	authenticateToken,
	contentController.getUserCombinedContent
);

// ===== TEST ROUTES (for testing purposes) =====
router.get("/test", (req, res) => {
	res.json({ route: "users" });
});

router.post("/test", (req, res) => {
	res.json({ route: "users" });
});

module.exports = router;
