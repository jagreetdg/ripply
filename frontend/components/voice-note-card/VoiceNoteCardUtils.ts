// Utility functions for VoiceNoteCard component

/**
 * Formats a duration in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * Formats a number for display (e.g., 1000 -> 1.0k)
 * Returns a loading placeholder or "0" for undefined/null values
 */
export const formatNumber = (num: any): string => {
  // Return loading placeholder for undefined
  if (num === undefined) {
    return "-";
  }
  
  // Log unexpected values for debugging
  if (num === null) {
    console.log("formatNumber received null");
    return "0";
  }

  if (typeof num === "object") {
    console.log(
      "formatNumber received an object instead of a number:",
      JSON.stringify(num)
    );
    // Try to extract count from object
    if (num && typeof num.count === "number") {
      return formatNumber(num.count);
    }
    return "0";
  }

  // Convert to number to ensure consistent handling
  const numValue = Number(num);

  // Check if conversion resulted in a valid number
  if (isNaN(numValue)) {
    console.log(`formatNumber received non-numeric value: ${num}`);
    return "0";
  }

  if (numValue >= 1000000) {
    return (numValue / 1000000).toFixed(1) + "m";
  }
  if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + "k";
  }
  return numValue.toString();
};

/**
 * Safely extract plays count from various formats
 */
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