/**
 * API configuration for the Ripply app
 */

// Base URL for the API
const API_URL = "http://localhost:3000/api";

// API endpoints
const ENDPOINTS = {
	USERS: "/users",
	VOICE_NOTES: "/voice-notes",
	VOICE_BIOS: "/voice-bios",
	HEALTH: "/health",
};

// Default request headers
const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
};

/**
 * Make an API request with proper error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - Response data
 */
const apiRequest = async (endpoint, options = {}) => {
	try {
		const url = `${API_URL}${endpoint}`;
		const headers = { ...DEFAULT_HEADERS, ...options.headers };

		const response = await fetch(url, {
			...options,
			headers,
		});

		// Check if the response is successful
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `Request failed with status ${response.status}`
			);
		}

		// Parse the response as JSON
		return await response.json();
	} catch (error) {
		console.error("API request failed:", error);
		throw error;
	}
};

export { API_URL, ENDPOINTS, apiRequest };
