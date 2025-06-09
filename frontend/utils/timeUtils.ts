/**
 * Time utility functions for consistent timestamp formatting across the app
 */

/**
 * Format a timestamp into Twitter-style relative time format
 * @param timestamp - Date string or Date object
 * @returns Formatted string like "10m", "5hr", "2d", etc.
 */
export const formatTimeAgo = (timestamp: string | Date): string => {
	if (!timestamp) return "";

	const now = new Date();
	const postTime = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
	
	// Check if the date is valid
	if (isNaN(postTime.getTime())) return "";
	
	const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

	// Less than 1 minute - show seconds
	if (diffInSeconds < 60) {
		return `${Math.max(1, diffInSeconds)}s`;
	}

	// Less than 1 hour - show minutes
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m`;
	}

	// Less than 24 hours - show hours
	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h`;
	}

	// Less than 7 days - show days
	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays}d`;
	}

	// More than 7 days - show actual date
	const options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
	};

	// If it's from a different year, include the year
	if (postTime.getFullYear() !== now.getFullYear()) {
		options.year = "numeric";
	}

	return postTime.toLocaleDateString("en-US", options);
};

/**
 * Legacy alias for backward compatibility
 * @deprecated Use formatTimeAgo instead
 */
export const formatRelativeTime = formatTimeAgo; 