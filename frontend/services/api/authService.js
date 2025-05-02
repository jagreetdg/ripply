/**
 * Authentication service for the Ripply app
 */
import { apiRequest } from './config';

// Auth endpoints
const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  CHECK_USERNAME: '/auth/check-username',
  CHECK_EMAIL: '/auth/check-email',
};

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
    const response = await apiRequest(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} - Logged in user data
 */
const loginUser = async (credentials) => {
  try {
    const response = await apiRequest(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
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
    const response = await apiRequest(`${AUTH_ENDPOINTS.CHECK_USERNAME}/${username}`);
    return response;
  } catch (error) {
    console.error('Error checking username availability:', error);
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
    console.error('Error checking email availability:', error);
    throw error;
  }
};

export {
  registerUser,
  loginUser,
  checkUsernameAvailability,
  checkEmailAvailability,
};
