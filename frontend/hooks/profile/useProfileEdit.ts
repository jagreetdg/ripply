import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../context/UserContext';
import { updateUserProfile } from '../../services/api/userService';
import { checkUsernameAvailability } from '../../services/api';
import { useGlobalToast } from '../../components/common/Toast';

interface UsernameAvailabilityResponse {
  available: boolean;
}

export const useProfileEdit = () => {
  const { user, refreshUser, setUser } = useUser();
  const { showToast } = useGlobalToast();
  
  // State
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isUsernameEdited, setIsUsernameEdited] = useState(false);
  
  // Photo viewer modal state
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [photoViewerType, setPhotoViewerType] = useState<'profile' | 'cover' | null>(null);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [animationStarted, setAnimationStarted] = useState(false);
  
  // Refs
  const recentlyOpenedModalRef = useRef(false);
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set mounted state on component mount
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  // Initialize form with user data
  useEffect(() => {
    if (!mounted || !user) return;

    setDisplayName(user.display_name || '');
    setBio(user.bio || '');
    setUsername(user.username || '');
    setOriginalUsername(user.username || '');
    setAvatarUrl(user.avatar_url);
    setCoverPhotoUrl(user.cover_photo_url || null);

    // Start entrance animation only on first load
    if (!animationStarted) {
      setAnimationStarted(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user, mounted, animationStarted]);

  // Sync local photo state when user context changes
  useEffect(() => {
    if (!mounted || !user) return;

    if (user.avatar_url !== avatarUrl) {
      console.log('[EDIT PROFILE] Syncing avatar URL from user context:', user.avatar_url);
      setAvatarUrl(user.avatar_url);
    }

    const userCoverPhoto = user.cover_photo_url;
    if (userCoverPhoto !== coverPhotoUrl) {
      console.log('[EDIT PROFILE] Syncing cover photo URL from user context:', userCoverPhoto);
      setCoverPhotoUrl(userCoverPhoto || null);
    }
  }, [user?.avatar_url, user?.cover_photo_url, mounted]);

  // Username validation
  const validateUsername = useCallback(async (newUsername: string) => {
    if (!newUsername.trim()) {
      setUsernameError('Username is required');
      setIsUsernameValid(false);
      return;
    }

    if (newUsername === originalUsername) {
      setUsernameError('');
      setIsUsernameValid(true);
      return;
    }

    if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsUsernameValid(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setIsUsernameValid(false);
      return;
    }

    try {
      setIsCheckingUsername(true);
      const response = await checkUsernameAvailability(newUsername) as UsernameAvailabilityResponse;
      
      if (response.available) {
        setUsernameError('');
        setIsUsernameValid(true);
      } else {
        setUsernameError('Username is already taken');
        setIsUsernameValid(false);
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameError('Error checking username availability');
      setIsUsernameValid(false);
    } finally {
      setIsCheckingUsername(false);
    }
  }, [originalUsername]);

  // Handle username change with debouncing
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
    setIsUsernameEdited(true);
    
    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
    
    // Set new timeout for validation
    usernameTimeoutRef.current = setTimeout(() => {
      validateUsername(text);
    }, 500);
  }, [validateUsername]);

  // Image selection handlers
  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showToast('Error selecting image', 'error');
    }
  };

  const handleSelectCoverPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting cover photo:', error);
      showToast('Error selecting cover photo', 'error');
    }
  };

  // Photo viewer handlers
  const handleOpenPhotoViewer = (type: 'profile' | 'cover') => {
    recentlyOpenedModalRef.current = true;
    setPhotoViewerType(type);
    setPhotoViewerVisible(true);
    
    setTimeout(() => {
      recentlyOpenedModalRef.current = false;
    }, 500);
  };

  const handleClosePhotoViewer = () => {
    setPhotoViewerVisible(false);
    setPhotoViewerType(null);
  };

  const handlePhotoUpdated = (type: 'profile' | 'cover', newUrl: string | null) => {
    if (type === 'profile') {
      setAvatarUrl(newUrl);
    } else {
      setCoverPhotoUrl(newUrl);
    }
  };

  // Update local user data
  const updateLocalUserData = async (updatedUser: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      await refreshUser();
    } catch (error) {
      console.error('Error updating local user data:', error);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user?.id) return;

    if (isUsernameEdited && !isUsernameValid) {
      showToast('Please fix username errors before saving', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        username: username.trim(),
        avatar_url: avatarUrl,
        cover_photo_url: coverPhotoUrl,
      };

      const updatedUser = await updateUserProfile(user.id, updateData);
      
      await updateLocalUserData(updatedUser);
      showToast('Profile updated successfully!', 'success');
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    mounted,
    displayName,
    setDisplayName,
    bio,
    setBio,
    username,
    setUsername,
    avatarUrl,
    coverPhotoUrl,
    isLoading,
    isCheckingUsername,
    usernameError,
    isUsernameValid,
    photoViewerVisible,
    photoViewerType,
    fadeAnim,
    scaleAnim,
    
    // Handlers
    handleUsernameChange,
    handleSelectImage,
    handleSelectCoverPhoto,
    handleOpenPhotoViewer,
    handleClosePhotoViewer,
    handlePhotoUpdated,
    handleSave,
  };
}; 