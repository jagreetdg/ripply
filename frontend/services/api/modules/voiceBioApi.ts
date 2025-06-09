/**
 * Voice Bio API functions
 */
import { ENDPOINTS, apiRequest } from '../config';

export interface VoiceBio {
  id: string;
  user_id: string;
  audio_url: string;
  duration: number;
  transcript?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVoiceBioData {
  audio_url: string;
  duration: number;
  transcript?: string;
}

/**
 * Get a user's voice bio
 */
export const getVoiceBio = async (userId: string): Promise<VoiceBio | null> => {
  try {
    const response = await apiRequest(ENDPOINTS.VOICE_BIO(userId));
    return response;
  } catch (error) {
    console.error('Error fetching voice bio:', error);
    return null;
  }
};

/**
 * Create or update a voice bio
 */
export const createOrUpdateVoiceBio = async (
  userId: string, 
  voiceBioData: CreateVoiceBioData
): Promise<VoiceBio> => {
  try {
    const response = await apiRequest(ENDPOINTS.VOICE_BIO(userId), {
      method: 'PUT',
      body: voiceBioData,
    });
    return response;
  } catch (error) {
    console.error('Error creating/updating voice bio:', error);
    throw error;
  }
};

/**
 * Delete a voice bio
 */
export const deleteVoiceBio = async (userId: string): Promise<void> => {
  try {
    await apiRequest(ENDPOINTS.VOICE_BIO(userId), {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting voice bio:', error);
    throw error;
  }
}; 