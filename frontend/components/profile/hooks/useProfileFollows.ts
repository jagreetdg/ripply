import { useState, useCallback } from 'react';

interface ProfileFollowsState {
  followerCount: number;
  followingCount: number;
  showFollowersPopup: boolean;
  showFollowingPopup: boolean;
}

interface ProfileFollowsActions {
  setFollowerCount: (count: number) => void;
  setFollowingCount: (count: number) => void;
  updateFollowerCount: (isFollowing: boolean, updatedCount?: number) => void;
  setShowFollowersPopup: (show: boolean) => void;
  setShowFollowingPopup: (show: boolean) => void;
  openFollowersPopup: () => void;
  openFollowingPopup: () => void;
  closeFollowersPopup: () => void;
  closeFollowingPopup: () => void;
  initializeCounts: (followerCount: number, followingCount: number) => void;
}

export const useProfileFollows = (): ProfileFollowsState & ProfileFollowsActions => {
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);

  const updateFollowerCount = useCallback((isFollowing: boolean, updatedCount?: number) => {
    if (updatedCount !== undefined) {
      setFollowerCount(updatedCount);
    } else {
      setFollowerCount(prev => isFollowing ? prev + 1 : prev - 1);
    }
  }, []);

  const openFollowersPopup = useCallback(() => {
    console.log('[PROFILE] Opening followers popup');
    setShowFollowersPopup(true);
  }, []);

  const openFollowingPopup = useCallback(() => {
    console.log('[PROFILE] Opening following popup');
    setShowFollowingPopup(true);
  }, []);

  const closeFollowersPopup = useCallback(() => {
    console.log('[PROFILE] Closing followers popup');
    setShowFollowersPopup(false);
  }, []);

  const closeFollowingPopup = useCallback(() => {
    console.log('[PROFILE] Closing following popup');
    setShowFollowingPopup(false);
  }, []);

  const initializeCounts = useCallback((initialFollowerCount: number, initialFollowingCount: number) => {
    setFollowerCount(initialFollowerCount);
    setFollowingCount(initialFollowingCount);
  }, []);

  return {
    // State
    followerCount,
    followingCount,
    showFollowersPopup,
    showFollowingPopup,

    // Actions
    setFollowerCount,
    setFollowingCount,
    updateFollowerCount,
    setShowFollowersPopup,
    setShowFollowingPopup,
    openFollowersPopup,
    openFollowingPopup,
    closeFollowersPopup,
    closeFollowingPopup,
    initializeCounts,
  };
}; 