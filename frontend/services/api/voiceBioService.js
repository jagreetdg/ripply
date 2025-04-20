/**
 * Voice Bio service for handling voice bio-related API calls
 */
import { ENDPOINTS, apiRequest } from './config';

/**
 * Get voice bio for a user
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<Object>} - Voice bio data
 */
export const getVoiceBio = async (userId) => {
  try {
    // Only proceed if userId is a valid UUID
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      try {
        const response = await apiRequest(`${ENDPOINTS.VOICE_BIOS}/${userId}`);
        return response.data || null;
      } catch (apiError) {
        // Handle specific API errors
        if (apiError.code === 'PGRST116') {
          // This is normal - just means the user doesn't have a voice bio
          return null;
        }
        // Re-throw other errors
        throw apiError;
      }
    }
    return null;
  } catch (error) {
    // Only log errors that aren't expected
    if (error.code !== 'PGRST116') {
      console.error('Error fetching voice bio:', error);
    }
    return null;
  }
};

/**
 * Create or update a voice bio
 * @param {string} userId - User ID
 * @param {Object} voiceBioData - Voice bio data
 * @param {string} voiceBioData.audio_url - URL to the audio file
 * @param {number} voiceBioData.duration - Duration in seconds
 * @param {string} voiceBioData.transcript - Optional transcript
 * @returns {Promise<Object>} - Updated voice bio data
 */
export const createOrUpdateVoiceBio = async (userId, voiceBioData) => {
  return apiRequest(`${ENDPOINTS.VOICE_BIOS}/${userId}`, {
    method: 'POST',
    body: JSON.stringify(voiceBioData),
  });
};

/**
 * Delete a voice bio
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteVoiceBio = async (userId) => {
  return apiRequest(`${ENDPOINTS.VOICE_BIOS}/${userId}`, {
    method: 'DELETE',
  });
};
