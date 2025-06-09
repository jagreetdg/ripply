/**
 * Core Voice Note API functions
 */
import { ENDPOINTS, apiRequest } from "../config";
import { 
  VoiceNote, 
  CreateVoiceNoteData, 
  UpdateVoiceNoteData,
  FeedParams 
} from "./types/voiceNoteTypes";

/**
 * Get a voice note by ID
 */
export const getVoiceNoteById = async (voiceNoteId: string) => {
  try {
    console.log(`Fetching voice note by ID: ${voiceNoteId}`);
    const response = await apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching voice note ${voiceNoteId}:`, error);
    throw error;
  }
};

/**
 * Create a new voice note
 */
export const createVoiceNote = (voiceNoteData: CreateVoiceNoteData): Promise<VoiceNote> => {
  return apiRequest(ENDPOINTS.VOICE_NOTES, {
    method: "POST",
    body: JSON.stringify(voiceNoteData),
  });
};

/**
 * Update a voice note
 */
export const updateVoiceNote = (voiceNoteId: string, voiceNoteData: any) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
    method: "PUT",
    body: JSON.stringify(voiceNoteData),
  });
};

/**
 * Delete a voice note
 */
export const deleteVoiceNote = (voiceNoteId: string) => {
  return apiRequest(`${ENDPOINTS.VOICE_NOTES}/${voiceNoteId}`, {
    method: "DELETE",
  });
};

/**
 * Get all voice notes (feed)
 */
export const getVoiceNotes = async (params: Record<string, any> = {}) => {
  console.log("Fetching all voice notes with params:", params);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString
    ? `${ENDPOINTS.VOICE_NOTES}?${queryString}`
    : ENDPOINTS.VOICE_NOTES;

  try {
    const response = await apiRequest(endpoint);

    // The backend returns a direct array of voice notes
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log("Unexpected response format for voice notes:", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching all voice notes:", error);
    return [];
  }
};

 