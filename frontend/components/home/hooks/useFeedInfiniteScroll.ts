import { useCallback } from 'react';

interface InfiniteScrollProps {
  hasMoreData: boolean;
  loadingMore: boolean;
  onLoadMore: () => Promise<void>;
}

interface InfiniteScrollState {
  handleEndReached: () => void;
  shouldShowFooterLoader: boolean;
}

export const useFeedInfiniteScroll = ({
  hasMoreData,
  loadingMore,
  onLoadMore,
}: InfiniteScrollProps): InfiniteScrollState => {
  
  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasMoreData && !loadingMore) {
      console.log('[INFINITE_SCROLL] Reached end, loading more...');
      onLoadMore();
    }
  }, [hasMoreData, loadingMore, onLoadMore]);

  const shouldShowFooterLoader = loadingMore;

  return {
    handleEndReached,
    shouldShowFooterLoader,
  };
}; 