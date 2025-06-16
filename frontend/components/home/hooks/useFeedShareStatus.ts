import { useState, useEffect } from 'react';
import { checkShareStatus } from '../../../services/api';
import { FeedItem } from '../../../hooks/useFeedData';

interface ShareStatusState {
  sharedStatusMap: Record<string, boolean>;
  isLoadingShareStatus: boolean;
}

export const useFeedShareStatus = (
  feedItems: FeedItem[],
  currentUserId?: string
): ShareStatusState => {
  const [sharedStatusMap, setSharedStatusMap] = useState<Record<string, boolean>>({});
  const [isLoadingShareStatus, setIsLoadingShareStatus] = useState(false);

  useEffect(() => {
    const checkShareStatuses = async () => {
      if (!currentUserId || feedItems.length === 0) {
        setSharedStatusMap({});
        return;
      }

      setIsLoadingShareStatus(true);
      console.log(`[SHARE_STATUS] Checking share status for ${feedItems.length} feed items`);
      
      const statusMap: Record<string, boolean> = {};

      try {
        // Check each voice note's share status
        for (const item of feedItems) {
          try {
            const isShared = await checkShareStatus(item.voiceNote.id, currentUserId);
            statusMap[item.voiceNote.id] = isShared;
            console.log(
              `[SHARE_STATUS] Voice note ${item.voiceNote.id} is shared by current user: ${isShared}`
            );
          } catch (error) {
            console.error(
              `[SHARE_STATUS] Error checking share status for ${item.voiceNote.id}:`,
              error
            );
            statusMap[item.voiceNote.id] = false;
          }
        }

        setSharedStatusMap(statusMap);
      } catch (error) {
        console.error('[SHARE_STATUS] Error checking share statuses:', error);
        setSharedStatusMap({});
      } finally {
        setIsLoadingShareStatus(false);
      }
    };

    checkShareStatuses();
  }, [feedItems, currentUserId]);

  return {
    sharedStatusMap,
    isLoadingShareStatus,
  };
}; 