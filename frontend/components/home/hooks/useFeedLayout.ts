import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

// Define a constant for header height to match the one in home.tsx
const HEADER_HEIGHT = 60;

interface FeedLayoutProps {
  contentInsetTop?: number;
}

interface FeedLayoutState {
  headerPadding: number;
  screenHeight: number;
  headerHeight: number;
}

export const useFeedLayout = ({ 
  contentInsetTop 
}: FeedLayoutProps): FeedLayoutState => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Calculate the padding needed to account for the header
  // Use contentInsetTop if provided, otherwise calculate default
  const headerPadding = contentInsetTop !== undefined 
    ? contentInsetTop 
    : HEADER_HEIGHT + insets.top;

  return {
    headerPadding,
    screenHeight,
    headerHeight: HEADER_HEIGHT,
  };
}; 