import { useRouter } from 'expo-router';

interface AboutNavigationState {
  handleGoBack: () => void;
}

export const useAboutNavigation = (): AboutNavigationState => {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return {
    handleGoBack,
  };
}; 