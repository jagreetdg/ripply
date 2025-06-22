/**
 * Account verification routes
 */
const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const crypto = require("crypto");
const { authenticateToken } = require("../middleware/auth");

// Request email verification
router.post("/request-verification", authenticateToken, async (req, res) => {
	try {
		// User is already attached to req by authenticateToken middleware
		const user = req.user;

		// Check if user is already verified
		if (user.is_verified) {
			return res.status(400).json({ message: "User is already verified" });
		}

		// Generate verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

		// Store verification token in database
		const { error } = await supabase.from("email_verifications").upsert({
			user_id: user.id,
			token: verificationToken,
			expires_at: tokenExpiry.toISOString(),
		});

		if (error) throw error;

		// Email sending would be implemented here in production
		// For now, verification tokens are available via admin interface

		if (process.env.NODE_ENV === "development") {
			console.log(
				`Verification requested for ${user.email}. Token: ${verificationToken}`
			);
		}

		res.status(200).json({
			message: "Verification email sent",
		});
	} catch (error) {
		console.error("Error requesting verification:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Resend verification email
router.post("/resend-verification", authenticateToken, async (req, res) => {
	try {
		// User is already attached to req by authenticateToken middleware
		const user = req.user;

		// Check if user is already verified
		if (user.is_verified) {
			return res.status(400).json({ message: "User is already verified" });
		}

		// Generate verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

		// Store verification token in database (upsert will replace existing)
		const { error } = await supabase.from("email_verifications").upsert({
			user_id: user.id,
			token: verificationToken,
			expires_at: tokenExpiry.toISOString(),
		});

		if (error) throw error;

		if (process.env.NODE_ENV === "development") {
			console.log(
				`Verification resent for ${user.email}. Token: ${verificationToken}`
			);
		}

		res.status(200).json({
			message: "Verification email sent",
		});
	} catch (error) {
		console.error("Error resending verification:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Verify email with token (GET request with query parameter)
router.get("/verify-email", async (req, res) => {
	try {
		const { token } = req.query;

		if (!token) {
			return res
				.status(400)
				.json({ message: "Verification token is required" });
		}

		// Find the verification token
		const { data: verificationData, error } = await supabase
			.from("email_verifications")
			.select("user_id, expires_at")
			.eq("token", token)
			.single();

		if (error || !verificationData) {
			return res
				.status(400)
				.json({ message: "Invalid or expired verification token" });
		}

		// Check if token is expired
		if (new Date(verificationData.expires_at) < new Date()) {
			return res
				.status(400)
				.json({ message: "Invalid or expired verification token" });
		}

		// Update user's verification status
		const { error: updateError } = await supabase
			.from("users")
			.update({
				is_verified: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", verificationData.user_id);

		if (updateError) throw updateError;

		// Delete the used verification token
		await supabase.from("email_verifications").delete().eq("token", token);

		res.status(200).json({
			message: "Email verified successfully",
			verified: true,
		});
	} catch (error) {
		console.error("Error verifying email:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Verify email with token (POST request with body)
router.post("/verify-email", async (req, res) => {
	try {
		const { token } = req.body;

		if (!token) {
			return res
				.status(400)
				.json({ message: "Verification token is required" });
		}

		// Find the verification token
		const { data: verificationData, error } = await supabase
			.from("email_verifications")
			.select("user_id, expires_at")
			.eq("token", token)
			.single();

		if (error || !verificationData) {
			return res
				.status(400)
				.json({ message: "Invalid or expired verification token" });
		}

		// Check if token is expired
		if (new Date(verificationData.expires_at) < new Date()) {
			return res
				.status(400)
				.json({ message: "Verification token has expired" });
		}

		// Update user's verification status
		const { error: updateError } = await supabase
			.from("users")
			.update({
				is_verified: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", verificationData.user_id);

		if (updateError) throw updateError;

		// Delete the used verification token
		await supabase.from("email_verifications").delete().eq("token", token);

		res.status(200).json({ message: "Email verified successfully" });
	} catch (error) {
		console.error("Error verifying email:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Verify token validity without processing
router.get("/verify-token/:token", async (req, res) => {
	try {
		const { token } = req.params;

		if (!token) {
			return res.status(200).json({ valid: false });
		}

		// Find the verification token
		const { data: verificationData, error } = await supabase
			.from("email_verifications")
			.select("user_id, expires_at")
			.eq("token", token)
			.single();

		if (error || !verificationData) {
			return res.status(200).json({ valid: false });
		}

		// Check if token is expired
		if (new Date(verificationData.expires_at) < new Date()) {
			return res.status(200).json({ valid: false });
		}

		res.status(200).json({ valid: true });
	} catch (error) {
		console.error("Error verifying token:", error);
		res.status(200).json({ valid: false });
	}
});

// ===== TEST ROUTES (for testing purposes) =====
router.get("/test", (req, res) => {
	res.json({ route: "verification" });
});

router.post("/test", (req, res) => {
	res.json({ route: "verification" });
});

module.exports = router;
