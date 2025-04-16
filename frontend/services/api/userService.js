/**
 * User service for handling user-related API calls
 */
import { ENDPOINTS, apiRequest } from './config';

/**
 * Get a user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfile = (userId) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}`);
};

/**
 * Update a user profile
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateUserProfile = (userId, userData) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

/**
 * Follow a user
 * @param {string} userId - ID of user to follow
 * @param {string} followerId - ID of follower
 * @returns {Promise<Object>} - Follow relationship data
 */
export const followUser = (userId, followerId) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/follow`, {
    method: 'POST',
    body: JSON.stringify({ followerId }),
  });
};

/**
 * Unfollow a user
 * @param {string} userId - ID of user to unfollow
 * @param {string} followerId - ID of follower
 * @returns {Promise<Object>} - Response data
 */
export const unfollowUser = (userId, followerId) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/unfollow`, {
    method: 'POST',
    body: JSON.stringify({ followerId }),
  });
};

/**
 * Get followers of a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of followers
 */
export const getUserFollowers = (userId) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/followers`);
};

/**
 * Get users that a user is following
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of followed users
 */
export const getUserFollowing = (userId) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/following`);
};
