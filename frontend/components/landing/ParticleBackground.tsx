import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  size: number;
  opacity: Animated.Value;
  color: string;
}

interface ParticleBackgroundProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

export default function ParticleBackground({
  count = 25,
  colors = ['#6B2FBC', '#9D7BC7', '#D4C1EC', '#8A4FD1'],
  minSize = 3,
  maxSize = 8,
  speed = 15000,
}: ParticleBackgroundProps) {
  const particles = useRef<Particle[]>([]);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Create particles
    particles.current = Array.from({ length: count }, (_, i) => {
      const size = Math.random() * (maxSize - minSize) + minSize;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        id: i,
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(Math.random() * height),
        size,
        opacity: new Animated.Value(Math.random() * 0.5 + 0.1),
        color,
      };
    });

    // Start animations
    startAnimations();

    return () => {
      // Clean up animations
      animationsRef.current.forEach(anim => anim.stop());
    };
  }, []);

  const startAnimations = () => {
    const animations: Animated.CompositeAnimation[] = [];

    particles.current.forEach(particle => {
      // Create random destination points
      const destX = Math.random() * width;
      const destY = Math.random() * height;
      const duration = speed + Math.random() * 5000;

      // Create position animation
      const positionAnim = Animated.parallel([
        Animated.timing(particle.x, {
          toValue: destX,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: destY,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]);

      // Create opacity animation
      const opacityAnim = Animated.sequence([
        Animated.timing(particle.opacity, {
          toValue: Math.random() * 0.5 + 0.1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: Math.random() * 0.3 + 0.05,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]);

      // Combine animations
      const combinedAnim = Animated.parallel([positionAnim, opacityAnim]);
      
      // Loop animation
      const loopAnim = Animated.loop(combinedAnim);
      
      // Start animation
      loopAnim.start();
      
      // Store animation reference for cleanup
      animations.push(loopAnim);
    });

    animationsRef.current = animations;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
  },
});
