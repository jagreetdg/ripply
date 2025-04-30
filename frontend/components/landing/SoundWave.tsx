import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SoundWaveProps {
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
  barWidth?: number;
  barGap?: number;
  color?: string;
  speed?: number;
  opacity?: number;
}

export default function SoundWave({
  barCount = 12,
  minHeight = 10,
  maxHeight = 40,
  barWidth = 4,
  barGap = 6,
  color = '#6B2FBC',
  speed = 800,
  opacity = 0.7,
}: SoundWaveProps) {
  const bars = useRef<Animated.Value[]>([]);
  
  // Initialize animated values
  useEffect(() => {
    bars.current = Array(barCount).fill(0).map(() => new Animated.Value(minHeight));
    
    // Start the animation
    animateBars();
    
    return () => {
      // Cleanup animations
      bars.current.forEach(bar => bar.stopAnimation());
    };
  }, []);
  
  const animateBars = () => {
    // Create animations for each bar with random heights
    const animations = bars.current.map((bar, index) => {
      const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      const randomDuration = speed + Math.random() * 300;
      
      return Animated.sequence([
        Animated.timing(bar, {
          toValue: randomHeight,
          duration: randomDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(bar, {
          toValue: minHeight,
          duration: randomDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]);
    });
    
    // Run all animations in parallel and loop
    Animated.loop(
      Animated.stagger(100, animations)
    ).start();
  };
  
  const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
  
  return (
    <View style={[styles.container, { width: totalWidth }]}>
      {bars.current.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: bar,
              backgroundColor: color,
              opacity: opacity,
              marginRight: index < barCount - 1 ? barGap : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 50,
  },
  bar: {
    borderRadius: 2,
  },
});
