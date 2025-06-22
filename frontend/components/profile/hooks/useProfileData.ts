import { useState, useCallback } from 'react';
import { getUserProfileByUsername } from '../../../services/api';

export interface ProfileUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  cover_photo_url?: string | null;
  bio?: string | null;
  is_verified?: boolean;
  follower_count: number;
  following_count: number;
}

interface ProfileDataState {
  userProfile: ProfileUser | null;
  loading: boolean;
  userNotFound: boolean;
  error: string | null;
}

interface ProfileDataActions {
  loadProfile: (username: string) => Promise<void>;
  setUserProfile: (profile: ProfileUser | null) => void;
  clearProfile: () => void;
}

export const useProfileData = (): ProfileDataState & ProfileDataActions => {
  const [userProfile, setUserProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (username: string) => {
    if (!username) {
      setError('Username is required');
      setUserNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setUserNotFound(false);

    try {
      const profile = await getUserProfileByUsername(username);
      
      if (!profile) {
        setUserNotFound(true);
        setUserProfile(null);
      } else {
        setUserProfile(profile as unknown as ProfileUser);
        setUserNotFound(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
      setUserNotFound(true);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfile = () => {
    setUserProfile(null);
    setError(null);
    setUserNotFound(false);
    setLoading(false);
  };

  return {
    // State
    userProfile,
    loading,
    userNotFound,
    error,

    // Actions
    loadProfile,
    setUserProfile,
    clearProfile,
  };
}; 