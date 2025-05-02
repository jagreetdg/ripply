import React from 'react';
import { View, StyleSheet, Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: any;
}

// Get initial dimensions
const initialDimensions = Dimensions.get('window');

// Define breakpoints
const breakpoints = {
  mobile: 576,
  tablet: 768,
  desktop: 992,
  largeDesktop: 1200,
};

// Calculate initial scale factor based on device height
// This helps ensure content fits on one screen without scrolling
const calculateScaleFactor = (height: number) => {
  // Base height we're designing for
  const baseHeight = 800;
  
  // Calculate scale but keep it within reasonable bounds
  const rawScale = height / baseHeight;
  return Math.max(0.75, Math.min(rawScale, 1.2));
};

export default function ResponsiveLayout({ children, style }: ResponsiveLayoutProps) {
  const [dimensions, setDimensions] = React.useState<ScaledSize>(initialDimensions);
  const [scaleFactor, setScaleFactor] = React.useState(calculateScaleFactor(initialDimensions.height));
  
  React.useEffect(() => {
    // Handle dimension changes (e.g., rotation, window resize)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      setScaleFactor(calculateScaleFactor(window.height));
    });
    
    return () => {
      // Clean up subscription
      subscription.remove();
    };
  }, []);
  
  // Determine layout class based on width
  const getLayoutClass = () => {
    const { width } = dimensions;
    if (width < breakpoints.mobile) return styles.mobile;
    if (width < breakpoints.tablet) return styles.tablet;
    if (width < breakpoints.desktop) return styles.desktop;
    return styles.largeDesktop;
  };
  
  // Apply scale transform to ensure content fits on screen
  const scaleStyle = {
    transform: [{ scale: scaleFactor }],
  };
  
  return (
    <View style={[styles.container, getLayoutClass(), style]}>
      <View style={[styles.content, scaleStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobile: {
    paddingHorizontal: 16,
  },
  tablet: {
    paddingHorizontal: 32,
  },
  desktop: {
    paddingHorizontal: 48,
    maxWidth: 1200,
  },
  largeDesktop: {
    paddingHorizontal: 64,
    maxWidth: 1400,
  },
});
