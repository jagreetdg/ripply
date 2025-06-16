/**
 * Format a date as a relative time string like Twitter (e.g. "2h", "5m", "46s", or "2024/01/12")
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
  
  // More than 7 days - show Twitter-style date format (YYYY/MM/DD)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
}; 