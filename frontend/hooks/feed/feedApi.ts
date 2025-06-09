/**
 * Feed API interactions
 * Handles all API calls related to feed data
 */
import {
  getVoiceNotes,
  getPersonalizedFeed,
  recordPlay
} from '../../services/api';
import { formatVoiceNote } from './feedUtils';
import { FeedItem } from './types';

/**
 * Fetch feed data for a user or guest
 * @param userId - The current user ID, or null for guest
 * @param diagnosticInfo - Optional diagnostic data for logging
 * @returns Array of formatted feed items
 */
export const fetchFeedData = async (
  userId: string | null | undefined,
  diagnosticInfo?: any
): Promise<FeedItem[]> => {
  try {
    let data;

    // If diagnostics were run, log the findings
    if (diagnosticInfo) {
      console.log("[DIAGNOSTIC] Fetching with diagnostic data available");
      console.log(
        "[DIAGNOSTIC] Following count:",
        diagnosticInfo.summary.followingCount
      );
      console.log(
        "[DIAGNOSTIC] Should have empty feed:",
        diagnosticInfo.summary.shouldHaveEmptyFeed
      );
    }

    // Check if user is logged in
    if (userId) {
      // Fetch personalized feed for logged in users
      console.log("Fetching personalized feed for user:", userId);
      data = await getPersonalizedFeed(userId);
    } else {
      // Fetch public feed for guests
      console.log("Fetching public feed for guest");
      data = await getVoiceNotes();
    }

    if (data && Array.isArray(data)) {
      // Format the data
      return data.map(formatVoiceNote);
    } else {
      console.log("Unexpected data format from API:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching feed data:", error);
    throw error;
  }
};

/**
 * Record a play of a voice note
 * @param voiceNoteId - ID of the voice note
 * @param userId - ID of the user playing the note
 */
export const trackVoiceNotePlay = async (
  voiceNoteId: string,
  userId: string
): Promise<void> => {
  try {
    // Record the play in the backend
    await recordPlay(voiceNoteId, userId);
  } catch (error) {
    console.error("Error recording play:", error);
  }
}; 