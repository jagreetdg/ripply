const axios = require("axios");

const BASE_URL = "https://ripply-backend.onrender.com";
const TEST_VOICE_NOTE_ID = "902c87f2-945a-4fca-b5b2-5bda6afd5490"; // Use one of the IDs from the error logs
const TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d"; // Use the user ID from the error logs

async function testEndpoints() {
	console.log("Testing endpoints...");

	try {
		// Test the likes/check endpoint
		console.log("\nTesting /api/voice-notes/:id/likes/check endpoint:");
		const likesCheckUrl = `${BASE_URL}/api/voice-notes/${TEST_VOICE_NOTE_ID}/likes/check?userId=${TEST_USER_ID}`;
		console.log(`GET ${likesCheckUrl}`);

		try {
			const likesResponse = await axios.get(likesCheckUrl);
			console.log("Response status:", likesResponse.status);
			console.log("Response data:", likesResponse.data);
		} catch (error) {
			console.error("Error status:", error.response?.status);
			console.error("Error data:", error.response?.data);
			console.error("Full error:", error.message);
		}

		// Test the shares/check endpoint
		console.log("\nTesting /api/voice-notes/:id/shares/check endpoint:");
		const sharesCheckUrl = `${BASE_URL}/api/voice-notes/${TEST_VOICE_NOTE_ID}/shares/check?userId=${TEST_USER_ID}`;
		console.log(`GET ${sharesCheckUrl}`);

		try {
			const sharesResponse = await axios.get(sharesCheckUrl);
			console.log("Response status:", sharesResponse.status);
			console.log("Response data:", sharesResponse.data);
		} catch (error) {
			console.error("Error status:", error.response?.status);
			console.error("Error data:", error.response?.data);
			console.error("Full error:", error.message);
		}
	} catch (error) {
		console.error("Unexpected error:", error);
	}
}

testEndpoints();
