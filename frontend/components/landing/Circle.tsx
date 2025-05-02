import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Easing, ViewStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CircleProps {
  size: number;
  position: {
    top: number;
    left: number;
  };
  delay?: number;
  duration?: number;
  color?: string;
}

export default function Circle({
  size,
  position,
  delay = 0,
  duration = 10000,
  color = '#6B2FBC',
}: CircleProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    // Start animation after delay
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.3,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.1,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: position.top,
          left: position.left,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    zIndex: 0,
  },
});
