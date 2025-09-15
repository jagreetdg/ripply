/**
 * Authentication service for the Ripply app
 */
import { apiRequest } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// Storage keys
const TOKEN_KEY = "@ripply_auth_token";
const USER_KEY = "@ripply_user";

// Auth endpoints
const AUTH_ENDPOINTS = {
	REGISTER: "/api/auth/register",
	LOGIN: "/api/auth/login",
	LOGOUT: "/api/auth/logout",
	VERIFY_TOKEN: "/api/auth/verify-token",
	CHECK_USERNAME: "/api/auth/check-username",
	CHECK_EMAIL: "/api/auth/check-email",
};

/**
 * Hash a password client-side before sending to server
 * This adds an extra layer of security during transmission
 * @param {string} password - The plain text password
 * @returns {Promise<string>} - The hashed password
 */
async function hashPasswordForTransport(password) {
	// Create a SHA-256 hash of the password for transport security
	// Note: This is in addition to the bcrypt hashing done on the server
	const hashBuffer = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		password
	);
	return hashBuffer;
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email
 * @param {string} userData.password - Password
 * @param {string} userData.displayName - Display name (optional)
 * @returns {Promise<Object>} - Registered user data
 */
const registerUser = async (userData) => {
	try {
		// Create a copy of userData to avoid modifying the original
		const secureUserData = { ...userData };

		// Hash the password before sending
		if (secureUserData.password) {
			secureUserData.password = await hashPasswordForTransport(
				secureUserData.password
			);
		}

		// Add a timestamp to prevent replay attacks
		secureUserData.timestamp = Date.now();

		const response = await apiRequest(AUTH_ENDPOINTS.REGISTER, {
			method: "POST",
			body: JSON.stringify(secureUserData),
			credentials: "include", // Include cookies in the request
		});

		// Store token and user data in AsyncStorage
		if (response.token) {
			await AsyncStorage.setItem(TOKEN_KEY, response.token);
			await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
		}

		return response;
	} catch (error) {
		console.error("Error registering user:", error);
		throw error;
	}
};

/**
 * Login a user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Password
 * @param {boolean} credentials.rememberMe - Whether to remember the user
 * @returns {Promise<Object>} - Logged in user data
 */
const loginUser = async (credentials) => {
	try {
		console.log("Login attempt with credentials:", {
			email: credentials.email,
			passwordLength: credentials.password?.length,
			rememberMe: credentials.rememberMe,
		});

		// Create a copy of credentials to avoid modifying the original
		const secureCredentials = { ...credentials };

		// Hash the password before sending
		if (secureCredentials.password) {
			secureCredentials.password = await hashPasswordForTransport(
				secureCredentials.password
			);
			console.log("Password hashed for transport");
		}

		// Add a timestamp to prevent replay attacks
		secureCredentials.timestamp = Date.now();

		console.log("Sending login request to:", AUTH_ENDPOINTS.LOGIN);
		const response = await apiRequest(AUTH_ENDPOINTS.LOGIN, {
			method: "POST",
			body: JSON.stringify(secureCredentials),
			credentials: "include", // Include cookies in the request
		});

		console.log("Login response received:", response ? "success" : "empty");

		// Store token and user data in AsyncStorage
		if (response && response.token) {
			await AsyncStorage.setItem(TOKEN_KEY, response.token);
			await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
			console.log("User data stored in AsyncStorage");
		} else {
			console.warn("Login response missing token or user data");
		}

		return response;
	} catch (error) {
		console.error("Error logging in:", error);
		throw error;
	}
};

/**
 * Check if a username is available
 * @param {string} username - Username to check
 * @returns {Promise<Object>} - Availability status
 */
const checkUsernameAvailability = async (username) => {
	try {
		const response = await apiRequest(
			`${AUTH_ENDPOINTS.CHECK_USERNAME}/${username}`
		);
		return response;
	} catch (error) {
		console.error("Error checking username availability:", error);
		throw error;
	}
};

/**
 * Check if an email is available
 * @param {string} email - Email to check
 * @returns {Promise<Object>} - Availability status
 */
const checkEmailAvailability = async (email) => {
	try {
		const response = await apiRequest(`${AUTH_ENDPOINTS.CHECK_EMAIL}/${email}`);
		return response;
	} catch (error) {
		console.error("Error checking email availability:", error);
		throw error;
	}
};

/**
 * Logout the current user
 * @returns {Promise<Object>} - Logout response
 */
const logoutUser = async () => {
	try {
		const token = await AsyncStorage.getItem(TOKEN_KEY);

		// Call the logout endpoint
		const response = await apiRequest(AUTH_ENDPOINTS.LOGOUT, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			credentials: "include", // Include cookies in the request
		});

		// Clear local storage
		await AsyncStorage.removeItem(TOKEN_KEY);
		await AsyncStorage.removeItem(USER_KEY);

		return response;
	} catch (error) {
		console.error("Error logging out:", error);

		// Still clear local storage even if the API call fails
		await AsyncStorage.removeItem(TOKEN_KEY);
		await AsyncStorage.removeItem(USER_KEY);

		throw error;
	}
};

/**
 * Verify the current auth token
 * @returns {Promise<Object>} - User data if token is valid
 */
const verifyToken = async () => {
	try {
		const token = await AsyncStorage.getItem(TOKEN_KEY);

		if (!token) {
			throw new Error("No token found");
		}

		const response = await apiRequest(AUTH_ENDPOINTS.VERIFY_TOKEN, {
			headers: { Authorization: `Bearer ${token}` },
			credentials: "include", // Include cookies in the request
		});

		return response;
	} catch (error) {
		console.error("Error verifying token:", error);
		throw error;
	}
};

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} - User data or null if not authenticated
 */
const getCurrentUser = async () => {
	try {
		const userJson = await AsyncStorage.getItem(USER_KEY);
		return userJson ? JSON.parse(userJson) : null;
	} catch (error) {
		console.error("Error getting current user:", error);
		return null;
	}
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - True if authenticated
 */
const isAuthenticated = async () => {
	try {
		const token = await AsyncStorage.getItem(TOKEN_KEY);
		return !!token;
	} catch (error) {
		console.error("Error checking authentication:", error);
		return false;
	}
};

export {
	registerUser,
	loginUser,
	logoutUser,
	verifyToken,
	getCurrentUser,
	isAuthenticated,
	checkUsernameAvailability,
	checkEmailAvailability,
};
