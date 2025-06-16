import { useEffect } from 'react';
import { FeedItem } from '../../../hooks/useFeedData';

interface FeedAnalyticsState {
  logFeedMetrics: () => void;
}

export const useFeedAnalytics = (
  feedItems: FeedItem[],
  diagnosticData?: any
): FeedAnalyticsState => {
  
  // Log feed composition and metrics
  useEffect(() => {
    if (feedItems.length > 0) {
      console.log(`[FEED_ANALYTICS] FeedContent received ${feedItems.length} items`);

      // Analyze feed composition
      const sharedItems = feedItems.filter((item) => item.isShared === true);
      const originalItems = feedItems.filter((item) => item.isShared === false);

      console.log(
        `[FEED_ANALYTICS] Feed breakdown - Original: ${originalItems.length}, Shared: ${sharedItems.length}`
      );

      // Alert if no original posts
      if (originalItems.length === 0) {
        console.log('[FEED_ANALYTICS] WARNING: No original posts in feed!');
      }

      // Log sample items for debugging
      if (originalItems.length > 0) {
        console.log(
          '[FEED_ANALYTICS] Sample original post:',
          originalItems[0].id,
          originalItems[0].userId,
          originalItems[0].isShared
        );
      }

      if (sharedItems.length > 0) {
        console.log(
          '[FEED_ANALYTICS] Sample shared post:',
          sharedItems[0].id,
          sharedItems[0].userId,
          sharedItems[0].isShared
        );
      }

      // Log diagnostic data if available
      if (diagnosticData) {
        console.log('[FEED_ANALYTICS] Diagnostic data:', {
          summary: diagnosticData.summary,
          isFollowingAnyone: diagnosticData.summary?.isFollowingAnyone,
          totalItems: feedItems.length,
        });
      }
    }
  }, [feedItems, diagnosticData]);

  const logFeedMetrics = () => {
    console.log('[FEED_ANALYTICS] Current feed metrics:', {
      totalItems: feedItems.length,
      originalPosts: feedItems.filter(item => !item.isShared).length,
      sharedPosts: feedItems.filter(item => item.isShared).length,
      uniqueUsers: new Set(feedItems.map(item => item.userId)).size,
      diagnosticSummary: diagnosticData?.summary,
    });
  };

  return {
    logFeedMetrics,
  };
}; 