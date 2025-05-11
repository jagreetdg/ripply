/**
 * Utility functions for handling default profile and cover images
 */

// Default profile image colors
const PROFILE_COLORS = [
  '#6B2FBC', // Purple
  '#2F80ED', // Blue
  '#F2994A', // Orange
  '#27AE60', // Green
  '#EB5757', // Red
];

/**
 * Generate a color based on user ID for consistent coloring
 * @param {string} userId - User ID
 * @returns {string} - Hex color code
 */
export const getColorFromUserId = (userId) => {
  if (!userId) return PROFILE_COLORS[0];
  
  // Use the sum of character codes to determine color index
  const charSum = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PROFILE_COLORS[charSum % PROFILE_COLORS.length];
};

/**
 * Get the default cover photo URL
 * @returns {string} - URL to default cover image
 */
export const getDefaultCoverPhoto = () => {
  return 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1200&auto=format&fit=crop';
};

/**
 * Get the first letter of a username or display name
 * @param {string} name - Username or display name
 * @returns {string} - First letter (uppercase)
 */
export const getInitial = (name) => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};
