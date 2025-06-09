import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

// Import services
import {
  searchUsers,
  searchVoiceNotes,
  getTrendingSearches,
} from '../services/api';
import { checkShareStatus } from '../services/api';

export type SearchTab = 'users' | 'posts';

interface UseSearchProps {
  initialSearchQuery?: string;
  initialTab?: SearchTab;
  userId?: string;
  onSearchComplete?: () => void;
}

export const useSearch = ({
  initialSearchQuery = '',
  initialTab = 'posts',
  userId = '',
  onSearchComplete,
}: UseSearchProps) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [discoveryPosts, setDiscoveryPosts] = useState<any[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  const [discoveryContentLoaded, setDiscoveryContentLoaded] = useState({
    posts: false,
    users: false,
  });
  const [sharedStatusMap, setSharedStatusMap] = useState<Record<string, boolean>>({});

  // Load discovery content for empty search state
  const loadDiscoveryContent = async (tab: SearchTab, forceReload = false) => {
    if (!userId) return;

    // Check if content is already loaded and we're not forcing a reload
    if (!forceReload && discoveryContentLoaded[tab]) {
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoadingDiscovery) {
      return;
    }

    setIsLoadingDiscovery(true);
    setIsLoading(true);
    try {
      if (tab === 'posts') {
        // Load discovery posts (for you feed) - placeholder for now
        setDiscoveryPosts([]);
        setDiscoveryContentLoaded((prev) => ({ ...prev, posts: true }));
      } else if (tab === 'users') {
        // Load trending searches as placeholder for trending users
        const trending = await getTrendingSearches();
        setTrendingUsers(trending || []);
        setDiscoveryContentLoaded((prev) => ({ ...prev, users: true }));
      }
    } catch (error) {
      console.error('Error loading discovery content:', error);
      // Set empty arrays on error
      if (tab === 'posts') {
        setDiscoveryPosts([]);
      } else {
        setTrendingUsers([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingDiscovery(false);
    }
  };

  // Handle search
  const performSearch = async (tab: SearchTab, query: string) => {
    if (query.trim() === '') {
      setUserResults([]);
      setPostResults([]);
      // Load discovery content when search is cleared
      loadDiscoveryContent(tab);
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'users') {
        const users = await searchUsers(query);
        setUserResults(users);
      }

      if (tab === 'posts') {
        const posts = await searchVoiceNotes(query);
        setPostResults(posts);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      if (onSearchComplete) {
        onSearchComplete();
      }
    }
  };

  // Debounced search function to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((tab, query) => {
      performSearch(tab, query);
    }, 300),
    []
  );

  // Handle search query change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Only search if there's at least 1 character
    if (text.trim().length >= 1) {
      debouncedSearch(activeTab, text);
    } else {
      // Clear results and load discovery content if search is empty
      setUserResults([]);
      setPostResults([]);
      // Only load discovery content if not already loaded
      loadDiscoveryContent(activeTab, false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: SearchTab) => {
    // Don't do anything if it's already the active tab
    if (tab === activeTab) return;

    setActiveTab(tab);

    // If search query exists, perform search
    if (searchQuery.trim().length > 0) {
      performSearch(tab, searchQuery);
    } else {
      // Load discovery content when no search query - only if not already loaded
      loadDiscoveryContent(tab, false);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setUserResults([]);
    setPostResults([]);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (searchQuery.trim().length > 0) {
      performSearch(activeTab, searchQuery);
    } else {
      // Force reload discovery content on refresh
      setDiscoveryContentLoaded((prev) => ({ ...prev, [activeTab]: false }));
      loadDiscoveryContent(activeTab, true);
      setIsRefreshing(false);
    }
  };

  // Fetch share status for all displayed posts
  useEffect(() => {
    const checkShareStatuses = async () => {
      if (!userId || !postResults.length) return;

      console.log(`Checking share status for ${postResults.length} search results`);
      const statusMap: Record<string, boolean> = {};

      // Check each post
      for (const post of postResults) {
        try {
          const isShared = await checkShareStatus(post.id, userId);
          statusMap[post.id] = isShared;
        } catch (error) {
          console.error(`Error checking share status for ${post.id}:`, error);
          statusMap[post.id] = false;
        }
      }

      setSharedStatusMap(statusMap);
    };

    checkShareStatuses();
  }, [postResults, userId]);

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    isLoading,
    isRefreshing,
    userResults,
    postResults,
    discoveryPosts,
    trendingUsers,
    sharedStatusMap,
    handleSearchChange,
    handleTabChange,
    handleClearSearch,
    handleRefresh,
    performSearch,
    loadDiscoveryContent,
  };
}; 