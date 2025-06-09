// Utility functions for VoiceNotesList component

export const formatRelativeTime = (date: Date): string => {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	// Less than 1 minute - show seconds
	if (diffInSeconds < 60) {
		return `${diffInSeconds}s`;
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
		month: 'short', 
		day: 'numeric'
	};
	
	// If it's from a different year, include the year
	if (date.getFullYear() !== now.getFullYear()) {
		options.year = 'numeric';
	}
	
	return date.toLocaleDateString('en-US', options);
};

export const normalizeCount = (value: any): number => {
	// If it's already a number, return it
	if (typeof value === "number") {
		return value;
	}

	// If it's an object with a count property
	if (value && typeof value === "object") {
		// Handle {count: number}
		if (typeof value.count === "number") {
			return value.count;
		}

		// Handle arrays of objects with count
		if (Array.isArray(value) && value.length > 0) {
			if (typeof value[0].count === "number") {
				return value[0].count;
			}
			// Try to use the array length as a fallback
			return value.length;
		}
	}

	// Try to parse it as a number if it's a string
	if (typeof value === "string") {
		const parsed = parseInt(value, 10);
		if (!isNaN(parsed)) {
			return parsed;
		}
	}

	// Fallback to 0 for undefined, null, or unparseable formats
	return 0;
};

export const normalizePlaysCount = (plays: any): number => {
	return normalizeCount(plays);
}; 