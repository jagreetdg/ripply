import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, ImageSourcePropType } from 'react-native';

interface PulsatingLogoProps {
  source: ImageSourcePropType;
  size: number;
  pulseColor?: string;
  pulseDuration?: number;
  pulseIntensity?: number;
}

export default function PulsatingLogo({
  source,
  size,
  pulseColor = '#6B2FBC',
  pulseDuration = 2000,
  pulseIntensity = 1.2,
}: PulsatingLogoProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: pulseIntensity,
          duration: pulseDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulseDuration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Create subtle rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: pulseDuration * 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: pulseDuration * 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [pulseAnim, rotateAnim, pulseDuration, pulseIntensity]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <View style={styles.container}>
      {/* Pulsating background */}
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 1.5 / 2,
            backgroundColor: pulseColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      
      {/* Logo */}
      <Animated.View
        style={{
          transform: [{ rotate }],
        }}
      >
        <Image
          source={source}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    opacity: 0.2,
  },
});
