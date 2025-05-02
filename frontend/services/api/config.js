/**
 * API configuration for the Ripply app
 */
import { Platform } from 'react-native';

// Base URL for the API - deployed to Render
const API_URL = "https://ripply-backend.onrender.com/api";

// Detect platform and environment
const isPhysicalDevice = Platform.OS === 'ios' || Platform.OS === 'android';

// API endpoints
const ENDPOINTS = {
	AUTH: "/auth",
	USERS: "/users",
	VOICE_NOTES: "/voice-notes",
	VOICE_BIOS: "/voice-bios",
	HEALTH: "/health",
};

// Default request headers
const DEFAULT_HEADERS = {
	"Content-Type": "application/json",
};

// Network timeout settings
const NETWORK_CONFIG = {
  timeout: 60000, // 60 seconds timeout
  retries: 1,     // Number of retry attempts
  retryDelay: 1000 // Delay between retries
};

/**
 * Make an API request with proper error handling, timeout, and retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  let lastError = null;
  
  // Try multiple times with the Render backend URL
  for (let attempt = 0; attempt <= NETWORK_CONFIG.retries; attempt++) {
    try {
      // If this is a retry, wait before trying again
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.retryDelay));
        console.log(`Retry attempt ${attempt} for ${endpoint}`);
      }
      
      const url = `${API_URL}${endpoint}`;
      const headers = { ...DEFAULT_HEADERS, ...options.headers };
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const effectiveTimeout = Platform.OS === 'ios' && !isPhysicalDevice ? 
        NETWORK_CONFIG.timeout * 1.5 : NETWORK_CONFIG.timeout;
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, effectiveTimeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear the timeout
        
        // Check if the response is successful
        if (!response.ok) {
          // Special handling for user not found errors
          if (response.status === 404) {
            // For user endpoints, return null instead of throwing an error
            if (endpoint.includes('/users/username/') || endpoint.includes('/users/')) {
              return null;
            }
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Request failed with status ${response.status}`
          );
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
        throw lastError || new Error('API request failed after all retry attempts');
      }
    }
  }
  
  // This should never be reached due to the throws above, but just in case
  throw lastError || new Error('API request failed after all retry attempts');
};

export { API_URL, ENDPOINTS, apiRequest };
