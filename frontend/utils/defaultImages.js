/**
 * Utility functions for handling default profile and cover images
 */
import Colors from '../constants/Colors';

// Default profile image colors
const PROFILE_COLORS = [
	Colors.brand.primary, // Purple
	Colors.brand.googleBlue, // Blue
	Colors.brand.googleYellow, // Orange/Yellow
	Colors.brand.googleGreen, // Green
	Colors.brand.googleRed, // Red
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
	// Return a purple gradient background with circular ripples
	return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%236B2FBC;stop-opacity:1" /><stop offset="50%" style="stop-color:%238B5CF6;stop-opacity:1" /><stop offset="100%" style="stop-color:%23A855F7;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="400" fill="url(%23grad)" /><g opacity="0.3"><circle cx="300" cy="200" r="80" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><circle cx="300" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/><circle cx="300" cy="200" r="160" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><circle cx="600" cy="150" r="60" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><circle cx="600" cy="150" r="90" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/><circle cx="600" cy="150" r="120" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><circle cx="900" cy="250" r="70" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><circle cx="900" cy="250" r="100" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/><circle cx="900" cy="250" r="130" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/></g></svg>';
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
