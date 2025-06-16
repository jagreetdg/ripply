import { useCallback } from 'react';
import { useRouter } from 'expo-router';

interface VoiceNoteNavigationProps {
  onProfilePress?: () => void;
  onUserProfilePress?: () => void;
}

interface NavigationActions {
  handleProfilePress: () => void;
  handleTagPress: (tag: string) => void;
  handlePlaysPress: () => void;
}

export const useVoiceNoteNavigation = ({
  onProfilePress,
  onUserProfilePress,
}: VoiceNoteNavigationProps): NavigationActions => {
  const router = useRouter();

  // Handle profile press
  const handleProfilePress = useCallback(() => {
    if (onProfilePress) {
      onProfilePress();
    } else if (onUserProfilePress) {
      onUserProfilePress();
    }
  }, [onProfilePress, onUserProfilePress]);

  // Handle tag press
  const handleTagPress = useCallback((tag: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { 
        tag: tag,
        searchType: 'tag',
        timestamp: Date.now().toString()
      },
    });
  }, [router]);

  // Handle plays press
  const handlePlaysPress = useCallback(() => {
    // Show plays information or navigate to plays list
    // This could be expanded to show who played the voice note
  }, []);

  return {
    handleProfilePress,
    handleTagPress,
    handlePlaysPress,
  };
}; 