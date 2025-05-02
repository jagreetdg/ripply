import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface WaveProps {
  color: string;
  speed: number;
  amplitude: number;
  frequency: number;
  offset: number;
  opacity: number;
}

export default function WaveAnimation({
  color = '#6B2FBC',
  speed = 1000,
  amplitude = 20,
  frequency = 1.5,
  offset = 0,
  opacity = 0.2,
}: WaveProps) {
  const translateX = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [translateX, speed]);

  const renderWave = () => {
    const waveWidth = width * 2;

    return (
      <Animated.View
        style={[
          styles.wave,
          {
            width: waveWidth,
            height: amplitude * 2,
            transform: [
              { translateX },
              { translateY: offset },
            ],
          },
        ]}
      >
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: color,
              opacity: opacity,
              borderRadius: 20,
              transform: [{ scale: 1.2 }],
            }}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {renderWave()}
      <Animated.View
        style={[
          styles.wave,
          {
            width: width * 2,
            height: amplitude * 2,
            transform: [
              { translateX: Animated.add(translateX, new Animated.Value(width)) },
              { translateY: offset },
            ],
          },
        ]}
      >
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: color,
              opacity: opacity,
              borderRadius: 20,
              transform: [{ scale: 1.2 }],
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    height: 200,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
});
