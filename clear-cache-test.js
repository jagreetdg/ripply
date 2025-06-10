// This script simulates what the frontend should be doing
const axios = require("axios");

const REMOTE_URL = "https://ripply-backend.onrender.com";
const TEST_USER_ID = "7b92c915-c931-4792-ada1-da94fcb6104d";

async function testFrontendFlow() {
	console.log("🔄 Simulating Frontend API Flow");
	console.log("===============================");

	// Test the exact endpoint the frontend calls
	const endpoint = `${REMOTE_URL}/api/voice-notes/feed/${TEST_USER_ID}`;
	console.log(`📞 Testing endpoint: ${endpoint}`);

	try {
		// This will fail due to auth, but let's see the error
		const response = await axios.get(endpoint, {
			headers: {
				"Content-Type": "application/json",
				// Frontend would include auth token here
			},
		});

		console.log("❌ Unexpected success - should require auth");
		console.log(
			"Response data:",
			JSON.stringify(response.data.slice(0, 2), null, 2)
		);
	} catch (error) {
		if (error.response?.status === 401) {
			console.log("✅ Expected: 401 Authentication required");
			console.log(
				"   This means the endpoint is working but requires valid auth"
			);
		} else {
			console.log(`❌ Unexpected error: ${error.response?.status}`);
			console.log("Error details:", error.response?.data || error.message);
		}
	}

	// Let's also test the global feed endpoint to compare
	console.log("\n🌍 Testing global feed endpoint...");
	try {
		const globalResponse = await axios.get(`${REMOTE_URL}/api/voice-notes`, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		console.log(
			"❌ Global feed worked without auth (this might be the fallback)"
		);
		console.log(`   Returned ${globalResponse.data.length} items`);

		if (globalResponse.data.length > 0) {
			console.log("\n📋 First 2 global feed items:");
			globalResponse.data.slice(0, 2).forEach((item, index) => {
				console.log(
					`   ${index + 1}. ID: ${item.id} - "${item.title}" - is_shared: ${
						item.is_shared
					} - user: ${item.users?.username}`
				);
			});
		}
	} catch (error) {
		if (error.response?.status === 401) {
			console.log("✅ Global feed also requires auth");
		} else {
			console.log(`❌ Global feed error: ${error.response?.status}`);
			console.log("Error details:", error.response?.data || error.message);
		}
	}
}

testFrontendFlow();
