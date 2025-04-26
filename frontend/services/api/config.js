/**
 * API configuration for the Ripply app
 */
import { Platform } from 'react-native';

// Base URL for the API
// Use your computer's local network IP address when testing on physical devices
// For simulators/emulators, you can use special addresses:
// - iOS simulator: http://localhost:3000/api
// - Android emulator: http://10.0.2.2:3000/api

// Detect platform and environment
const isPhysicalDevice = Platform.OS === 'ios' || Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

// Multiple possible API URLs to try (in order of preference)
const API_URLS = {
  // For physical devices - try these in order
  physical: [
    "http://10.100.206.36:3000/api", // Primary local network IP
    "http://192.168.1.1:3000/api",   // Common local network IP
    "https://api.ripply.app/api"     // Production API (if available)
  ],
  // For simulators/emulators
  simulator: {
    ios: "http://localhost:3000/api",
    android: "http://10.0.2.2:3000/api"
  }
};

// Default to the appropriate simulator URL or first physical device URL
let API_URL = isPhysicalDevice 
  ? API_URLS.physical[0]
  : (isIOS ? API_URLS.simulator.ios : API_URLS.simulator.android);

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

// Network timeout settings
const NETWORK_CONFIG = {
  timeout: 30000, // 30 seconds timeout - increased for mobile networks
  retries: 2,     // Number of retry attempts
  retryDelay: 1500 // Delay between retries in ms
};

/**
 * Make an API request with proper error handling, timeout, and retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} - Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  // For physical devices, try multiple API URLs
  const apiUrls = isPhysicalDevice ? API_URLS.physical : [API_URL];
  let lastError = null;
  
  // Try each API URL until one works or we run out of options
  for (let urlIndex = 0; urlIndex < apiUrls.length; urlIndex++) {
    const currentApiUrl = apiUrls[urlIndex];
    
    // Try multiple times with the current URL
    for (let attempt = 0; attempt <= NETWORK_CONFIG.retries; attempt++) {
      try {
        // If this is a retry, wait before trying again
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.retryDelay));
          console.log(`Retry attempt ${attempt} for ${endpoint}`);
        }
        
        if (urlIndex > 0) {
          console.log(`Trying alternative API URL: ${currentApiUrl}`);
        }
        
        const url = `${currentApiUrl}${endpoint}`;
        const headers = { ...DEFAULT_HEADERS, ...options.headers };
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log(`Request timeout after ${NETWORK_CONFIG.timeout}ms for ${url}`);
        }, NETWORK_CONFIG.timeout);
        
        try {
          console.log(`Fetching from ${url}...`);
          const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId); // Clear the timeout
          
          // Check if the response is successful
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message || `Request failed with status ${response.status}`
            );
          }
          
          // Parse the response as JSON
          const data = await response.json();
          
          // If we successfully connected, update the default API_URL for future requests
          if (isPhysicalDevice && API_URL !== currentApiUrl) {
            API_URL = currentApiUrl;
            console.log(`Updated default API URL to: ${API_URL}`);
          }
          
          return data;
        } catch (innerError) {
          clearTimeout(timeoutId); // Make sure to clear the timeout
          throw innerError; // Re-throw to be caught by the outer try/catch
        }
      } catch (error) {
        lastError = error;
        const isTimeout = error.name === 'AbortError';
        const errorType = isTimeout ? 'timeout' : error.message;
        console.warn(`API request attempt ${attempt + 1} failed (${errorType}) for ${apiUrls[urlIndex]}${endpoint}`);
        
        // If we've tried all attempts for this URL, move to the next URL
        if (attempt >= NETWORK_CONFIG.retries) {
          break; // Break the inner loop to try the next URL
        }
      }
    }
    
    // If we've tried all URLs, throw the last error
    if (urlIndex === apiUrls.length - 1) {
      console.error("All API request attempts failed:", lastError);
      throw lastError || new Error('API request failed after all retry attempts');
    }
  }
  
  // This should never be reached due to the throws above, but just in case
  throw lastError || new Error('API request failed after all retry attempts');
};

export { API_URL, ENDPOINTS, apiRequest };
