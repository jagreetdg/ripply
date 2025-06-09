/**
 * Feed data hook - Legacy compatibility layer
 * This file re-exports the refactored feed hook for backward compatibility
 */

// Re-export all types and the main hook from the refactored feed module
export * from './feed';

// For backward compatibility, re-export useFeed as useFeedData
import { useFeed } from './feed';
export const useFeedData = useFeed; 