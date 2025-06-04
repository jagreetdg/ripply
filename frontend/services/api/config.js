/**
 * API configuration for the Ripply app
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// API base URL - use environment variable or fallback
const API_URL =
	(typeof process !== "undefined" &&
		process.env &&
		process.env.NEXT_PUBLIC_API_URL) ||
	"https://ripply-backend.onrender.com/api";

// Token storage key
const TOKEN_KEY = "@ripply_auth_token";

// Detect platform and environment
const isPhysicalDevice = Platform.OS === "ios" || Platform.OS === "android";

// API endpoints
const ENDPOINTS = {
	AUTH: "/auth",
	USERS: "/users",
	VOICE_NOTES: "/voice-notes",
	AUDIO: "/audio",
	MEDIA: "/media",
	TAGS: "/tags",
	SEARCH: "/search",
	FEED: "/feed",
	NOTIFICATIONS: "/notifications",
};

// Default request headers
const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json",
};

// Network timeout settings
const NETWORK_CONFIG = {
	timeout: 60000, // 60 seconds timeout
	retries: 1, // Number of retry attempts
	retryDelay: 1000, // Delay between retries
};

/**
 * Make an API request with proper error handling, timeout, and retry logic
 * Automatically includes authentication headers if a token is available
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - Response data
 */
const apiRequest = async (endpoint, options = {}) => {
	let lastError = null;

	// Debug log for API request
	console.log(`Making API request to: ${API_URL}${endpoint}`, options);

	// Try multiple times with the Render backend URL
	for (let attempt = 0; attempt <= NETWORK_CONFIG.retries; attempt++) {
		try {
			// If this is a retry, wait before trying again
			if (attempt > 0) {
				await new Promise((resolve) =>
					setTimeout(resolve, NETWORK_CONFIG.retryDelay)
				);
				console.log(`Retry attempt ${attempt} for ${endpoint}`);
			}

			const url = `${API_URL}${endpoint}`;
			const headers = { ...DEFAULT_HEADERS, ...options.headers };

			// Automatically include authentication header if token exists
			// Skip for auth endpoints to avoid circular dependencies
			if (
				!endpoint.includes("/api/auth/login") &&
				!endpoint.includes("/api/auth/register")
			) {
				try {
					const token = await AsyncStorage.getItem(TOKEN_KEY);
					if (token) {
						headers.Authorization = `Bearer ${token}`;
						console.log(`[AUTH] Including Bearer token for ${endpoint}`);
					} else {
						console.log(`[AUTH] No token found for ${endpoint}`);
					}
				} catch (tokenError) {
					console.warn(
						`[AUTH] Error retrieving token for ${endpoint}:`,
						tokenError
					);
				}
			}

			// Create AbortController for timeout
			const controller = new AbortController();
			const effectiveTimeout =
				Platform.OS === "ios" && !isPhysicalDevice
					? NETWORK_CONFIG.timeout * 1.5
					: NETWORK_CONFIG.timeout;

			const timeoutId = setTimeout(() => {
				controller.abort();
			}, effectiveTimeout);

			try {
				const response = await fetch(url, {
					...options,
					headers,
					signal: controller.signal,
				});

				clearTimeout(timeoutId); // Clear the timeout

				// Check if the response is successful
				if (!response.ok) {
					// Special handling for specific 404 errors
					if (response.status === 404) {
						// For user endpoints, return null instead of throwing an error
						if (
							endpoint.includes("/users/username/") ||
							endpoint.includes("/users/")
						) {
							return null;
						}

						// For likes/check and shares/check endpoints, return a default response
						if (endpoint.includes("/likes/check")) {
							return { isLiked: false };
						}

						if (endpoint.includes("/shares/check")) {
							return { isShared: false };
						}
					}

					// Handle authentication errors
					if (response.status === 401) {
						console.warn(`[AUTH] Authentication failed for ${endpoint}`);
						// Clear invalid token
						try {
							await AsyncStorage.removeItem(TOKEN_KEY);
							console.log("[AUTH] Cleared invalid token");

							// If this is a share or like request that failed auth, notify the user (improved UX)
							if (endpoint.includes("/share") || endpoint.includes("/like")) {
								throw new Error(
									"Authentication required. Please sign in again."
								);
							}
						} catch (clearError) {
							console.warn("[AUTH] Error clearing invalid token:", clearError);
						}
					}

					const errorData = await response.json().catch(() => ({}));
					const errorMessage =
						errorData.message ||
						`Request failed with status ${response.status}`;

					// Enhanced logging for API errors
					console.error(`[API ERROR] ${endpoint} failed:`, {
						status: response.status,
						message: errorMessage,
						details: errorData,
					});

					throw new Error(errorMessage);
				}

				// Parse the response as JSON
				const data = await response.json();
				return data;
			} catch (innerError) {
				clearTimeout(timeoutId); // Make sure to clear the timeout
				throw innerError; // Re-throw to be caught by the outer try/catch
			}
		} catch (error) {
			lastError = error;

			// If we've tried all attempts, throw the last error
			if (attempt >= NETWORK_CONFIG.retries) {
				throw (
					lastError || new Error("API request failed after all retry attempts")
				);
			}
		}
	}

	// This should never be reached due to the throws above, but just in case
	throw lastError || new Error("API request failed after all retry attempts");
};

/**
 * Get the API URL with correct environment handling
 * @returns {string} - The API URL
 */
export function getApiUrl() {
	return API_URL;
}

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} - The full URL
 */
export function getFullApiUrl(endpoint) {
	return `${API_URL}${endpoint}`;
}

// Function to log API requests when in development
const logApiRequest = (endpoint, options = {}) => {
	if (process.env.NODE_ENV !== "production") {
		console.log(
			`🌐 API Request: ${API_URL}${endpoint}`,
			options.method || "GET"
		);
	}
};

export { ENDPOINTS, apiRequest };
