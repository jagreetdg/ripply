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
 * Get voice notes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of voice notes
 */
export const getUserVoiceNotes = async (userId) => {
  console.log('Fetching voice notes for user ID:', userId);
  const response = await apiRequest(`${ENDPOINTS.USERS}/${userId}/voice-notes`);
  
  // The backend returns data in a nested structure with pagination
  // Extract just the voice notes array from the response
  const voiceNotes = response.data || [];
  
  // Get the user data to attach to each voice note
  try {
    const userData = await getUserProfile(userId);
    
    // Attach the user data to each voice note
    return voiceNotes.map(note => ({
      ...note,
      users: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        avatar_url: userData.avatar_url
      }
    }));
  } catch (error) {
    console.error('Error fetching user data for voice notes:', error);
    return voiceNotes;
  }
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

/**
 * Get user profile by username
 * @param {string} username - Username
 * @returns {Promise<Object>} - User profile data
 */
export const getUserProfileByUsername = async (username) => {
  // Remove @ symbol if present
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  const response = await apiRequest(`${ENDPOINTS.USERS}/username/${cleanUsername}`);
  return response.data || null;
};

/**
 * Update user verification status
 * @param {string} userId - User ID
 * @param {boolean} isVerified - Verification status
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserVerificationStatus = async (userId, isVerified) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ is_verified: isVerified }),
  });
};

/**
 * Update user profile photos
 * @param {string} userId - User ID
 * @param {Array} photos - Array of photo objects
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserPhotos = async (userId, photos) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/photos`, {
    method: 'PATCH',
    body: JSON.stringify({ photos }),
  });
};
