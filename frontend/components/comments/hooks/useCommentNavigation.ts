import { useRouter } from 'expo-router';

interface CommentNavigationActions {
  handleProfilePress: (userId: string, username?: string) => void;
  navigateToProfile: (username: string) => void;
}

interface CommentNavigationProps {
  onClose: () => void;
}

export const useCommentNavigation = ({
  onClose,
}: CommentNavigationProps): CommentNavigationActions => {
  const router = useRouter();

  const navigateToProfile = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleProfilePress = (userId: string, username?: string) => {
    if (username) {
      navigateToProfile(username);
      // Close the modal after navigation
      onClose();
    } else {
      console.warn('Cannot navigate to profile: username not provided');
    }
  };

  return {
    handleProfilePress,
    navigateToProfile,
  };
}; 