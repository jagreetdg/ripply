// Function to safely extract plays count from various formats
export const normalizePlaysCount = (plays: any): number => {
	if (typeof plays === "number") {
		return plays;
	}

	if (plays && typeof plays === "object") {
		// If it's an object with count property
		if (typeof plays.count === "number") {
			return plays.count;
		}

		// If it's an array of objects with count
		if (
			Array.isArray(plays) &&
			plays.length > 0 &&
			typeof plays[0].count === "number"
		) {
			return plays[0].count;
		}
	}

	return 0; // Default to 0 if no valid format is found
}; 