const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");
const { authenticateToken } = require("../middleware/auth");

// Get voice bio for a user (alternative route)
router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// Get voice bio from the voice_bios table without using .single()
		const { data, error } = await supabase
			.from("voice_bios")
			.select("*")
			.eq("user_id", userId);

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
			console.log(`Voice bio not found for user ID: ${userId}`);
			return res.status(404).json({ message: "Voice bio not found" });
		}

		// Return the first voice bio found (should be only one)
		const voiceBio = data[0];

		res.status(200).json(voiceBio);
	} catch (error) {
		console.error("Error fetching voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Get voice bio for a user
router.get("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

		// Get voice bio from the voice_bios table without using .single()
		const { data, error } = await supabase
			.from("voice_bios")
			.select("*")
			.eq("user_id", userId);

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
			console.log(`Voice bio not found for user ID: ${userId}`);
			return res.status(404).json({ message: "Voice bio not found" });
		}

		// Return the first voice bio found (should be only one)
		const voiceBio = data[0];

		res.status(200).json(voiceBio);
	} catch (error) {
		console.error("Error fetching voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Create or update voice bio (authenticated)
router.post("/", authenticateToken, async (req, res) => {
	try {
		const { user_id, audio_url, duration, transcript } = req.body;

		if (!user_id || !audio_url || !duration) {
			return res
				.status(400)
				.json({ message: "User ID, audio URL and duration are required" });
		}

		// Check if user exists
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("id")
			.eq("id", user_id)
			.single();

		if (userError || !userData) {
			return res.status(404).json({ message: "User not found" });
		}

		// Check if voice bio already exists
		const { data: existingBio, error: bioError } = await supabase
			.from("voice_bios")
			.select("id")
			.eq("user_id", user_id)
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

		res.status(200).json(result.data);
	} catch (error) {
		console.error("Error creating/updating voice bio:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Create or update voice bio (by user ID in URL)
router.post("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
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

// Delete voice bio
router.delete("/:userId", async (req, res) => {
	try {
		const { userId } = req.params;

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

module.exports = router;
