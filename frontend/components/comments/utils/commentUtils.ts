/**
 * Formats a date string into a human-readable relative time format
 * @param dateString - ISO date string to format
 * @returns Formatted relative time string (e.g., "2m", "1h", "3d", "2024/01/12")
 */
export const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  
  // Less than an hour
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  
  // Less than a day
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  
  // Less than a week
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  // More than 7 days - show Twitter-style date format (YYYY/MM/DD)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};

/**
 * Gets the display name for a user, with fallback handling
 * @param user - User object with optional display_name and username
 * @returns Display name string
 */
export const getUserDisplayName = (user?: {
  display_name?: string;
  username?: string;
}): string => {
  return user?.display_name || user?.username || 'User';
};

/**
 * Gets the first letter of a user's display name for avatar fallback
 * @param displayName - User's display name
 * @returns Uppercase first letter
 */
export const getAvatarFallback = (displayName: string): string => {
  return displayName.charAt(0).toUpperCase();
};

/**
 * Validates comment content
 * @param content - Comment text to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validateCommentContent = (content: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!content.trim()) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }

  if (content.length > 500) {
    return { isValid: false, error: 'Comment cannot exceed 500 characters' };
  }

  return { isValid: true };
};

/**
 * Truncates comment content if it exceeds a certain length
 * @param content - Comment content to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated content with ellipsis if needed
 */
export const truncateComment = (content: string, maxLength: number = 200): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}; 