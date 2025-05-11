/**
 * Utility functions for handling default profile and cover images
 */

// Default profile image colors
const PROFILE_COLORS = [
	"#6B2FBC", // Purple
	"#2F80ED", // Blue
	"#F2994A", // Orange
	"#27AE60", // Green
	"#EB5757", // Red
];

/**
 * Generate a color based on user ID for consistent coloring
 * @param {string} userId - User ID
 * @returns {string} - Hex color code
 */
export const getColorFromUserId = (userId) => {
	if (!userId) return PROFILE_COLORS[0];

	// Use the sum of character codes to determine color index
	const charSum = userId
		.split("")
		.reduce((sum, char) => sum + char.charCodeAt(0), 0);
	return PROFILE_COLORS[charSum % PROFILE_COLORS.length];
};

/**
 * Get the default cover photo URL
 * @returns {string} - URL to default cover image
 */
export const getDefaultCoverPhoto = () => {
	// Return a light purple gradient background
	return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23E6D9FF;stop-opacity:1" /><stop offset="100%" style="stop-color:%23C4A5FF;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="400" fill="url(%23grad)" /></svg>';
};

/**
 * Get the first letter of a username or display name
 * @param {string} name - Username or display name
 * @returns {string} - First letter (uppercase)
 */
export const getInitial = (name) => {
	if (!name) return "U";
	return name.charAt(0).toUpperCase();
};
