/**
 * Voice Note service for handling voice note-related API calls
 */
import { ENDPOINTS, apiRequest } from './config';

/**
 * Get all voice notes (feed)
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of voice notes
 */
export const getVoiceNotes = async (params = {}) => {
  console.log('Fetching all voice notes with params:', params);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `${ENDPOINTS.VOICE_NOTES}?${queryString}` : ENDPOINTS.VOICE_NOTES;
  const response = await apiRequest(endpoint);
  
  // The backend returns data in a nested structure with pagination
  // Extract just the voice notes array from the response
  const voiceNotes = response.data || [];
  
  // Log the data structure to help debug
  console.log('Voice notes data structure sample:', 
    voiceNotes.length > 0 ? JSON.stringify(voiceNotes[0], null, 2) : 'No voice notes');
  
  // Ensure each voice note has proper user data
  return voiceNotes.map(note => {
    // If the note already has user data, use it
    if (note.users && note.users.display_name) {
      return note;
    }
    
    // If not, add a placeholder
    return {
      ...note,
      users: note.users || {
        id: note.user_id,
        username: 'user',
        display_name: 'User',
        avatar_url: null
      }
    };
  });
};

/**
 * Get a voice note by ID
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Voice note data
 */
export const getVoiceNoteById = (voiceNoteId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`);
};

/**
 * Create a new voice note
 * @param {Object} voiceNoteData - Voice note data
 * @returns {Promise<Object>} - Created voice note
 */
export const createVoiceNote = (voiceNoteData) => {
  return apiRequest(ENDPOINTS.VOICE_NOTES, {
    method: 'POST',
    body: JSON.stringify(voiceNoteData),
  });
};

/**
 * Update a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {Object} voiceNoteData - Voice note data to update
 * @returns {Promise<Object>} - Updated voice note
 */
export const updateVoiceNote = (voiceNoteId, voiceNoteData) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
    method: 'PUT',
    body: JSON.stringify(voiceNoteData),
  });
};

/**
 * Delete a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteVoiceNote = (voiceNoteId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
    method: 'DELETE',
  });
};

/**
 * Like a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Like data
 */
export const likeVoiceNote = (voiceNoteId, userId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

/**
 * Unlike a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Response data
 */
export const unlikeVoiceNote = (voiceNoteId, userId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/unlike`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

/**
 * Add a comment to a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} - Created comment
 */
export const addComment = (voiceNoteId, commentData) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
};

/**
 * Get comments for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Array>} - List of comments
 */
export const getComments = (voiceNoteId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/comments`);
};

/**
 * Record a play for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Play data
 */
export const recordPlay = (voiceNoteId, userId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/play`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

/**
 * Get voice notes by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of voice notes
 */
export const getUserVoiceNotes = (userId) => {
  return apiRequest(`${ENDPOINTS.USERS}/${userId}/voice-notes`);
};

/**
 * Record a share for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @param {string} userId - ID of user sharing the voice note
 * @returns {Promise<Object>} - Share data with updated count
 */
export const recordShare = async (voiceNoteId, userId) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/share`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

/**
 * Get share count for a voice note
 * @param {string} voiceNoteId - Voice note ID
 * @returns {Promise<Object>} - Share count data
 */
export const getShareCount = async (voiceNoteId) => {
  const response = await apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}/shares`);
  return response.data?.shareCount || 0;
};
