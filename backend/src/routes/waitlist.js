const express = require("express");
const router = express.Router();

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = process.env.BREVO_LIST_ID;
const BREVO_BASE_URL = "https://api.brevo.com/v3";

/**
 * Subscribe email to waitlist via Brevo API
 * POST /api/waitlist/subscribe
 */
router.post("/subscribe", async (req, res) => {
	try {
		const { email, attributes = {} } = req.body;

		// Validate email
		if (!email || !isValidEmail(email)) {
			return res.status(400).json({
				success: false,
				error: "Please provide a valid email address.",
			});
		}

		// Check if API key is configured
		if (!BREVO_API_KEY) {
			console.warn("Brevo API key not configured");
			return res.status(500).json({
				success: false,
				error: "Email service not configured. Please contact support.",
			});
		}

		// Prepare contact data for Brevo
		const contactData = {
			email,
			attributes: {
				SOURCE: "Ripply Waitlist",
				SIGNUP_DATE: new Date().toISOString().split("T")[0],
				SIGNUP_TIME: new Date().toISOString(),
				...attributes,
			},
			listIds: BREVO_LIST_ID ? [parseInt(BREVO_LIST_ID)] : undefined,
			updateEnabled: true,
		};

		console.log("Adding contact to Brevo:", email);

		// Call Brevo API
		const response = await fetch(`${BREVO_BASE_URL}/contacts`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"api-key": BREVO_API_KEY,
			},
			body: JSON.stringify(contactData),
		});

		const data = await response.json();

		if (response.ok) {
			console.log("Successfully added contact to Brevo:", email);
			return res.json({ success: true });
		} else {
			// Handle duplicate contact error
			if (data.code === "duplicate_parameter") {
				console.log("Contact already exists, updating:", email);
				return await updateContact(email, contactData.attributes, res);
			}

			console.error("Brevo API error:", data);
			return res.status(response.status).json({
				success: false,
				error: data.message || "Failed to subscribe. Please try again.",
			});
		}
	} catch (error) {
		console.error("Waitlist subscription error:", error);
		return res.status(500).json({
			success: false,
			error: "Internal server error. Please try again later.",
		});
	}
});

/**
 * Update existing contact in Brevo
 * PUT /api/waitlist/update/:email
 */
router.put("/update/:email", async (req, res) => {
	try {
		const { email } = req.params;
		const { attributes = {} } = req.body;

		if (!BREVO_API_KEY) {
			return res.status(500).json({
				success: false,
				error: "Email service not configured.",
			});
		}

		const updateData = {
			attributes: {
				SOURCE: "Ripply Waitlist",
				SIGNUP_DATE: new Date().toISOString().split("T")[0],
				SIGNUP_TIME: new Date().toISOString(),
				...attributes,
			},
			listIds: BREVO_LIST_ID ? [parseInt(BREVO_LIST_ID)] : undefined,
		};

		const response = await fetch(
			`${BREVO_BASE_URL}/contacts/${encodeURIComponent(email)}`,
			{
				method: "PUT",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"api-key": BREVO_API_KEY,
				},
				body: JSON.stringify(updateData),
			}
		);

		if (response.ok) {
			console.log("Successfully updated contact in Brevo:", email);
			return res.json({ success: true });
		} else {
			const data = await response.json();
			console.error("Brevo update error:", data);
			return res.status(response.status).json({
				success: false,
				error: data.message || "Failed to update subscription.",
			});
		}
	} catch (error) {
		console.error("Waitlist update error:", error);
		return res.status(500).json({
			success: false,
			error: "Internal server error.",
		});
	}
});

/**
 * Helper function to update contact (used internally)
 */
async function updateContact(email, attributes, res) {
	try {
		const updateData = {
			attributes,
			listIds: BREVO_LIST_ID ? [parseInt(BREVO_LIST_ID)] : undefined,
		};

		const response = await fetch(
			`${BREVO_BASE_URL}/contacts/${encodeURIComponent(email)}`,
			{
				method: "PUT",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"api-key": BREVO_API_KEY,
				},
				body: JSON.stringify(updateData),
			}
		);

		if (response.ok) {
			console.log("Successfully updated contact in Brevo:", email);
			return res.json({ success: true });
		} else {
			const data = await response.json();
			console.error("Brevo update error:", data);
			return res.status(response.status).json({
				success: false,
				error: data.message || "Failed to update subscription.",
			});
		}
	} catch (error) {
		console.error("Update contact error:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to update subscription.",
		});
	}
}

/**
 * Validate email format
 */
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

module.exports = router;
