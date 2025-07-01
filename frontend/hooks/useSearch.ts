import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

// Import services
import {
  searchUsers,
  searchVoiceNotes,
  getTrendingSearches,
  getDiscoveryPosts,
  getDiscoveryUsers,
} from '../services/api';
import { checkShareStatus } from '../services/api';
import { UserSearchResult } from "../services/api/modules/userRelationshipsApi";
import { VoiceNote } from "../components/voice-note-card/VoiceNoteCardTypes";

export type SearchTab = 'users' | 'posts';

interface UseSearchProps {
  initialSearchQuery?: string;
  initialTab?: SearchTab;
  userId?: string;
  onSearchComplete?: () => void;
}

export interface SearchResult {
  type: "user" | "voiceNote";
  data: UserSearchResult | VoiceNote;
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load discovery content for empty search state
  const loadDiscoveryContent = async (tab: SearchTab, forceReload = false) => {
    console.log('loadDiscoveryContent called', { tab, forceReload, userId, isLoadingDiscovery, discoveryContentLoaded });
    
    if (!userId) {
      console.log('loadDiscoveryContent: No userId, returning');
      return;
    }

    // Check if content is already loaded and we're not forcing a reload
    if (!forceReload && discoveryContentLoaded[tab]) {
      console.log('loadDiscoveryContent: Content already loaded for tab', tab);
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoadingDiscovery) {
      console.log('loadDiscoveryContent: Already loading, returning');
      return;
    }

    console.log('loadDiscoveryContent: Starting to load content for tab', tab);
    setIsLoadingDiscovery(true);
    setIsLoading(true);
    
    try {
      if (tab === 'posts') {
        // Load discovery posts (personalized popular posts)
        console.log('loadDiscoveryContent: Fetching discovery posts');
        const posts = await getDiscoveryPosts(userId);
        console.log('loadDiscoveryContent: Received discovery posts', posts?.length || 0);
        if (posts && posts.length > 0) {
          console.log('loadDiscoveryContent: First discovery post structure:', {
            id: posts[0].id,
            title: posts[0].title,
            likes: posts[0].likes,
            comments: posts[0].comments,
            plays: posts[0].plays,
            shares: posts[0].shares,
            tags: posts[0].tags,
            hasInteractionCounts: typeof posts[0].likes === 'number' && typeof posts[0].comments === 'number'
          });
        }
        setDiscoveryPosts(posts || []);
        setDiscoveryContentLoaded((prev) => ({ ...prev, posts: true }));
      } else if (tab === 'users') {
        // Load discovery users (trending creators)
        console.log('loadDiscoveryContent: Fetching discovery users');
        const users = await getDiscoveryUsers(userId);
        console.log('loadDiscoveryContent: Received discovery users', users?.length || 0);
        setTrendingUsers(users || []);
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
    console.log('[SEARCH DEBUG] performSearch called:', { tab, query, userId });
    
    if (query.trim() === '') {
      console.log('[SEARCH DEBUG] Empty query, clearing results and loading discovery content');
      setUserResults([]);
      setPostResults([]);
      setResults([]);
      // Load discovery content when search is cleared
      loadDiscoveryContent(tab);
      return;
    }

    console.log('[SEARCH DEBUG] Starting search...');
    setIsLoading(true);
    setError(null);

    try {
      let users: UserSearchResult[] = [];
      let posts: any[] = [];

      if (tab === 'users') {
        console.log('[SEARCH DEBUG] Searching users...');
        users = await searchUsers(query);
        setUserResults(users);
        console.log('[SEARCH DEBUG] User search completed:', users.length, 'results');
      }

      if (tab === 'posts') {
        console.log('[SEARCH DEBUG] Searching posts...');
        posts = await searchVoiceNotes(query, userId);
        setPostResults(posts);
        console.log('[SEARCH DEBUG] Post search completed:', posts.length, 'results');
      }

      // Combine results
      const combinedResults: SearchResult[] = [
        ...(tab === 'users' ? users : []).map(user => ({ type: "user" as const, data: user })),
        ...(tab === 'posts' ? posts : []).map(voiceNote => ({ type: "voiceNote" as const, data: voiceNote }))
      ];

      console.log('[SEARCH DEBUG] Combined results:', combinedResults.length, 'total');
      setResults(combinedResults);
    } catch (err) {
      console.error("[SEARCH DEBUG] Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
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
      setResults([]);
      // Only load discovery content if not already loaded
      loadDiscoveryContent(activeTab, false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: SearchTab) => {
    // Don't do anything if it's already the active tab
    if (tab === activeTab) return;

    console.log('useSearch: Tab change', { from: activeTab, to: tab, searchQuery, userId });
    setActiveTab(tab);

    // If search query exists, perform search
    if (searchQuery.trim().length > 0) {
      console.log('useSearch: Performing search for new tab', { tab, searchQuery });
      performSearch(tab, searchQuery);
    } else {
      // Load discovery content when no search query - only if not already loaded
      console.log('useSearch: Loading discovery content for new tab', { tab, userId });
      loadDiscoveryContent(tab, false);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setUserResults([]);
    setPostResults([]);
    setResults([]);
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

  // Fetch share status for discovery posts (default posts view)
  useEffect(() => {
    const checkDiscoveryShareStatuses = async () => {
      if (!userId || !discoveryPosts.length) return;

      console.log('[SEARCH DEBUG] Checking share statuses for discovery posts:', discoveryPosts.length);
      const statusMap: Record<string, boolean> = {};

      // Check each discovery post
      for (const post of discoveryPosts) {
        try {
          const isShared = await checkShareStatus(post.id, userId);
          statusMap[post.id] = isShared;
          console.log(`[SEARCH DEBUG] Discovery post ${post.id} share status:`, isShared);
        } catch (error) {
          console.error(`Error checking share status for discovery post ${post.id}:`, error);
          statusMap[post.id] = false;
        }
      }

      setSharedStatusMap(statusMap);
      console.log('[SEARCH DEBUG] Discovery posts share status map updated:', statusMap);
    };

    checkDiscoveryShareStatuses();
  }, [discoveryPosts, userId]);

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
    results,
    error,
  };
}; 