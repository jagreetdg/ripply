import { useRef, useCallback } from 'react';
import { Animated, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface ProfileAnimationsState {
  scrollY: Animated.Value;
  headerOpacity: Animated.AnimatedInterpolation<number>;
  collapsedHeaderOpacity: Animated.AnimatedInterpolation<number>;
  scrollViewRef: React.RefObject<ScrollView>;
}

interface ProfileAnimationsActions {
  scrollToTop: () => void;
  getScrollEventConfig: () => (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const useProfileAnimations = (): ProfileAnimationsState & ProfileAnimationsActions => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation interpolations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const scrollToTop = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const getScrollEventConfig = useCallback(() => {
    return Animated.event<
      NativeSyntheticEvent<NativeScrollEvent>
    >(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false }
    );
  }, [scrollY]);

  return {
    // State
    scrollY,
    headerOpacity,
    collapsedHeaderOpacity,
    scrollViewRef,

    // Actions
    scrollToTop,
    getScrollEventConfig,
  };
}; 