import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Bubble {
  id: number;
  size: number;
  position: Animated.ValueXY;
  opacity: Animated.Value;
  color: string;
  speed: number;
  startPosition: { x: number; y: number };
}

interface FloatingBubblesProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
}

export default function FloatingBubbles({
  count = 15,
  colors = ['#6B2FBC', '#9D7BC7', '#D4C1EC', '#8A4FD1'],
  minSize = 10,
  maxSize = 60,
  minSpeed = 15000,
  maxSpeed = 30000,
}: FloatingBubblesProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const newBubbles: Bubble[] = [];
    
    for (let i = 0; i < count; i++) {
      const size = Math.random() * (maxSize - minSize) + minSize;
      const randomX = Math.random() * width;
      const randomY = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
      
      newBubbles.push({
        id: i,
        size,
        position: new Animated.ValueXY({ x: randomX, y: randomY }),
        opacity: new Animated.Value(Math.random() * 0.4 + 0.1),
        color,
        speed,
        startPosition: { x: randomX, y: randomY },
      });
    }
    
    setBubbles(newBubbles);
  }, []);

  useEffect(() => {
    bubbles.forEach(bubble => {
      const createAnimation = () => {
        const targetX = bubble.startPosition.x + (Math.random() * 200 - 100);
        const targetY = bubble.startPosition.y + (Math.random() * 200 - 100);
        
        // Animate position
        Animated.timing(bubble.position, {
          toValue: { x: targetX, y: targetY },
          duration: bubble.speed,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start(() => createAnimation());
        
        // Animate opacity
        Animated.sequence([
          Animated.timing(bubble.opacity, {
            toValue: Math.random() * 0.4 + 0.1,
            duration: bubble.speed / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bubble.opacity, {
            toValue: Math.random() * 0.4 + 0.1,
            duration: bubble.speed / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]).start();
      };
      
      createAnimation();
    });
  }, [bubbles]);

  return (
    <View style={styles.container} pointerEvents="none">
      {bubbles.map(bubble => (
        <Animated.View
          key={bubble.id}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              backgroundColor: bubble.color,
              opacity: bubble.opacity,
              transform: [
                { translateX: bubble.position.x },
                { translateY: bubble.position.y },
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
    zIndex: -1,
  },
  bubble: {
    position: 'absolute',
  },
});
