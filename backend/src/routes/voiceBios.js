const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");
const { authenticateToken } = require("../middleware/auth");

// Get voice bio for a user (alternative route)
router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// Get voice bio from the voice_bios table
		const { data, error } = await supabase
			.from("voice_bios")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (error) {
			if (error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(404).json({
					message: "Voice bio not found",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			if (error.code === "PGRST116") {
				// No rows found
				return res.status(404).json({ message: "Voice bio not found" });
			}
			throw error;
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("Error fetching voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get voice bio for a user
router.get("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// Get voice bio from the voice_bios table
		const { data, error } = await supabase
			.from("voice_bios")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (error) {
			if (error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(404).json({
					message: "Voice bio not found",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			if (error.code === "PGRST116") {
				// No rows found
				return res.status(404).json({ message: "Voice bio not found" });
			}
			throw error;
		}

		res.status(200).json(data);
	} catch (error) {
		console.error("Error fetching voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Create or update voice bio (authenticated)
router.post("/", authenticateToken, async (req, res) => {
	try {
		const { audio_url, duration, transcript } = req.body;
		const user_id = req.user.id; // Get user ID from authenticated user

		if (!audio_url || !duration) {
			return res
				.status(400)
				.json({ message: "Audio URL and duration are required" });
		}

		// Validate audio URL format
		const urlRegex = /^https?:\/\/.+/;
		if (!urlRegex.test(audio_url)) {
			return res.status(400).json({ message: "Invalid audio URL format" });
		}

		// Validate duration is positive
		if (typeof duration !== "number" || duration <= 0) {
			return res
				.status(400)
				.json({ message: "Duration must be a positive number" });
		}

		// Validate transcript length
		if (transcript && transcript.length > 1000) {
			return res
				.status(400)
				.json({ message: "Transcript must be 1000 characters or less" });
		}

		// Check if voice bio already exists
		const { data: existingBio, error: bioError } = await supabase
			.from("voice_bios")
			.select("id")
			.eq("user_id", user_id)
			.single();

		let result;
		let isCreation = false;

		if (existingBio) {
			// Update existing voice bio
			result = await supabase
				.from("voice_bios")
				.update({
					audio_url,
					duration,
					transcript,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingBio.id)
				.select()
				.single();
		} else {
			// Create new voice bio
			isCreation = true;
			result = await supabase
				.from("voice_bios")
				.insert({
					id: uuidv4(),
					user_id,
					audio_url,
					duration,
					transcript,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.select()
				.single();
		}

		if (result.error) {
			if (result.error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(400).json({
					message: "Voice bio table does not exist",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			throw result.error;
		}

		res.status(isCreation ? 201 : 200).json(result.data);
	} catch (error) {
		console.error("Error creating/updating voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Create or update voice bio (by user ID in URL) - REQUIRES AUTHENTICATION
router.post("/:userId", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;

		// Security check: Users can only create/update their own voice bio
		if (req.user.id !== userId) {
			return res.status(403).json({
				message: "Unauthorized: You can only manage your own voice bio",
			});
		}
		const { audio_url, duration, transcript } = req.body;

		if (!audio_url || !duration) {
			return res
				.status(400)
				.json({ message: "Audio URL and duration are required" });
		}

		// Check if user exists
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("id")
			.eq("id", userId)
			.single();

		if (userError || !userData) {
			return res.status(404).json({ message: "User not found" });
		}

		// Check if voice bio already exists
		const { data: existingBio, error: bioError } = await supabase
			.from("voice_bios")
			.select("id")
			.eq("user_id", userId)
			.single();

		let result;

		if (existingBio) {
			// Update existing voice bio
			result = await supabase
				.from("voice_bios")
				.update({
					audio_url,
					duration,
					transcript,
					updated_at: new Date().toISOString(),
				})
				.eq("id", existingBio.id)
				.select()
				.single();
		} else {
			// Create new voice bio
			result = await supabase
				.from("voice_bios")
				.insert({
					id: uuidv4(),
					user_id: userId,
					audio_url,
					duration,
					transcript,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.select()
				.single();
		}

		if (result.error) {
			if (result.error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(400).json({
					message: "Voice bio table does not exist",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			throw result.error;
		}

		res.status(200).json(result.data);
	} catch (error) {
		console.error("Error creating/updating voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Delete voice bio - REQUIRES AUTHENTICATION
router.delete("/:userId", authenticateToken, async (req, res) => {
	try {
		const { userId } = req.params;

		// Security check: Users can only delete their own voice bio
		if (req.user.id !== userId) {
			return res.status(403).json({
				message: "Unauthorized: You can only delete your own voice bio",
			});
		}

		// Delete voice bio from the voice_bios table
		const { data, error } = await supabase
			.from("voice_bios")
			.delete()
			.eq("user_id", userId)
			.select();

		if (error) {
			if (error.code === "42P01") {
				// Table doesn't exist yet
				return res.status(404).json({
					message: "Voice bio not found",
					note: "Please run the SQL script in the Supabase SQL Editor to create the necessary tables",
				});
			}
			throw error;
		}

		if (!data || data.length === 0) {
			return res.status(404).json({ message: "Voice bio not found" });
		}

		res.status(200).json({ message: "Voice bio deleted successfully" });
	} catch (error) {
		console.error("Error deleting voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Update voice bio by ID (authenticated)
router.put("/:id", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { audio_url, duration, transcript } = req.body;

		// Check ownership
		const { data: existingBio, error: ownershipError } = await supabase
			.from("voice_bios")
			.select("user_id")
			.eq("id", id)
			.single();

		if (ownershipError || !existingBio) {
			return res.status(404).json({ message: "Voice bio not found" });
		}

		// Check if user owns this bio
		if (existingBio.user_id !== req.user.id) {
			return res
				.status(403)
				.json({ message: "Not authorized to update this voice bio" });
		}

		// Validate if data provided
		if (audio_url) {
			const urlRegex = /^https?:\/\/.+/;
			if (!urlRegex.test(audio_url)) {
				return res.status(400).json({ message: "Invalid audio URL format" });
			}
		}

		if (duration !== undefined) {
			if (typeof duration !== "number" || duration <= 0) {
				return res
					.status(400)
					.json({ message: "Duration must be a positive number" });
			}
		}

		if (transcript && transcript.length > 1000) {
			return res
				.status(400)
				.json({ message: "Transcript must be 1000 characters or less" });
		}

		// Update voice bio
		const { data, error } = await supabase
			.from("voice_bios")
			.update({
				...(audio_url && { audio_url }),
				...(duration !== undefined && { duration }),
				...(transcript !== undefined && { transcript }),
				updated_at: new Date().toISOString(),
			})
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		res.status(200).json(data);
	} catch (error) {
		console.error("Error updating voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Delete voice bio by ID (authenticated)
router.delete("/:id", authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;

		// Check ownership
		const { data: existingBio, error: ownershipError } = await supabase
			.from("voice_bios")
			.select("user_id")
			.eq("id", id)
			.single();

		if (ownershipError || !existingBio) {
			return res.status(404).json({ message: "Voice bio not found" });
		}

		// Check if user owns this bio
		if (existingBio.user_id !== req.user.id) {
			return res
				.status(403)
				.json({ message: "Not authorized to delete this voice bio" });
		}

		// Delete voice bio
		const { error } = await supabase.from("voice_bios").delete().eq("id", id);

		if (error) throw error;

		res.status(200).json({ message: "Voice bio deleted successfully" });
	} catch (error) {
		console.error("Error deleting voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// ===== TEST ROUTES (for testing purposes) =====
router.get("/test", (req, res) => {
	res.json({ route: "voiceBios" });
});

router.post("/test", (req, res) => {
	res.json({ route: "voiceBios" });
});

module.exports = router;
