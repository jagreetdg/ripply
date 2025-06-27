/**
 * Test script for new clean interaction API endpoints
 * Tests both local backend and deployed backend on Render
 */

const https = require("https");

// Test configuration
const TEST_CONFIG = {
	production: {
		baseURL: "https://ripply-backend.onrender.com/api",
		name: "Production Backend (Render)",
	},
};

// Test voice note ID (existing one)
const TEST_VOICE_NOTE_ID = "cd9144b7-c3da-4d1f-a755-a18c18466d89";

// Simple HTTP request function
function makeRequest(url, method = "GET", headers = {}) {
	return new Promise((resolve, reject) => {
		const urlObj = new URL(url);
		const options = {
			hostname: urlObj.hostname,
			port: urlObj.port || 443,
			path: urlObj.pathname,
			method: method,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
		};

		const req = https.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({ status: res.statusCode, data: jsonData });
				} catch (e) {
					resolve({ status: res.statusCode, data: data });
				}
			});
		});

		req.on("error", reject);
		req.end();
	});
}

async function testInteractionStatus(baseURL, name) {
	console.log(`\n=== Testing ${name} ===`);

	try {
		console.log(`1. Testing GET interaction status (no auth)...`);
		const response = await makeRequest(
			`${baseURL}/voice-notes/${TEST_VOICE_NOTE_ID}/interaction-status`
		);

		console.log("✅ Status Response:", response);
	} catch (error) {
		console.error("❌ Status Test Failed:", error.message);
	}
}

async function runTests() {
	console.log("🧪 Testing New Clean Interaction API Endpoints");
	console.log(`📍 Test Voice Note ID: ${TEST_VOICE_NOTE_ID}`);

	// Test production environment
	const config = TEST_CONFIG.production;
	try {
		await testInteractionStatus(config.baseURL, config.name);
	} catch (error) {
		console.error(`💥 Failed to test ${config.name}:`, error.message);
	}

	console.log("\n✨ Tests completed!");
}

// Run tests
runTests().catch(console.error);
