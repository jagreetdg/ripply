import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { followUser, unfollowUser, isFollowing } from '../../services/api/userService';

interface FollowButtonProps {
  userId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  style?: any;
}

/**
 * Follow/Unfollow button component
 */
export function FollowButton({ userId, onFollowChange, style }: FollowButtonProps) {
  const { user } = useUser();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if the current user is following the profile user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.id === userId) {
        setLoading(false);
        return;
      }
      
      try {
        const isUserFollowing = await isFollowing(user.id, userId);
        setFollowing(isUserFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkFollowStatus();
  }, [user, userId]);
  
  // Handle follow/unfollow action
  const handlePress = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(userId, user.id);
        setFollowing(false);
      } else {
        await followUser(userId, user.id);
        setFollowing(true);
      }
      
      if (onFollowChange) {
        onFollowChange(!following);
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Don't show the button if viewing own profile or not logged in
  if (!user || user.id === userId) {
    return null;
  }
  
  return (
    <TouchableOpacity 
      style={[styles.button, following ? styles.followingButton : styles.followButton, style]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={following ? '#6B2FBC' : '#FFFFFF'} />
      ) : (
        <Text style={[styles.buttonText, following ? styles.followingText : styles.followText]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  followButton: {
    backgroundColor: '#6B2FBC',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B2FBC',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followText: {
    color: '#FFFFFF',
  },
  followingText: {
    color: '#6B2FBC',
  },
});
