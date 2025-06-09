/**
 * Format a date as a relative time string like Twitter (e.g. "2h", "5m", "46s", or date)
 * @param date - The date to format
 * @returns Formatted relative time
 */
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