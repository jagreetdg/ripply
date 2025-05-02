import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface AudioWaveformProps {
  color?: string;
  secondaryColor?: string;
  barCount?: number;
  height?: number;
  animated?: boolean;
}

export default function AudioWaveform({
  color = '#6B2FBC',
  secondaryColor = '#9D7BC7',
  barCount = 30,
  height = 60,
  animated = true,
}: AudioWaveformProps) {
  // Create animated values for each bar
  const animatedValues = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (animated) {
      // Create animations for each bar
      const animations = animatedValues.map((value, index) => {
        // Random duration between 800ms and 1500ms
        const duration = Math.random() * 700 + 800;
        // Random max height between 0.3 and 1.0
        const toValue = Math.random() * 0.7 + 0.3;
        
        return Animated.sequence([
          Animated.timing(value, {
            toValue,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]);
      });

      // Start looping animations
      const loopedAnimations = animations.map(anim => Animated.loop(anim));
      
      // Start animations with staggered delays
      loopedAnimations.forEach((anim, index) => {
        setTimeout(() => {
          anim.start();
        }, index * 50);
      });

      return () => {
        loopedAnimations.forEach(anim => anim.stop());
      };
    }
  }, [animated, animatedValues]);

  return (
    <View style={[styles.container, { height }]}>
      {animatedValues.map((value, index) => {
        const isEven = index % 2 === 0;
        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: isEven ? color : secondaryColor,
                height: '100%',
                transform: [{ scaleY: value }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    marginVertical: 20,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    transform: [{ scaleY: 0.3 }],
  },
});
