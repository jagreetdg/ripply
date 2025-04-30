import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  Pressable, 
  Animated, 
  ViewStyle, 
  TextStyle,
  Easing,
  View
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AnimatedButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  primary?: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

export default function AnimatedButton({
  text,
  onPress,
  style,
  textStyle,
  primary = true,
  icon,
  iconPosition = 'left',
  disabled = false,
}: AnimatedButtonProps) {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [shadowAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.elastic(1.2)),
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  };

  const buttonStyles = [
    styles.button,
    primary ? styles.primaryButton : styles.secondaryButton,
    disabled && (primary ? styles.disabledPrimaryButton : styles.disabledSecondaryButton),
    style,
  ];

  const textStyles = [
    styles.text,
    primary ? styles.primaryText : styles.secondaryText,
    disabled && styles.disabledText,
    textStyle,
  ];

  const animatedStyles = {
    transform: [{ scale: scaleAnim }],
    shadowOpacity: shadowAnim,
  };

  return (
    <Animated.View style={animatedStyles}>
      <Pressable
        style={buttonStyles}
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        android_ripple={disabled ? undefined : { color: primary ? '#5B27A0' : '#E8DEF8', borderless: false }}
      >
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && (
            <Feather 
              name={icon} 
              size={18} 
              color={primary ? '#fff' : '#FFFFFF'} 
              style={styles.iconLeft} 
            />
          )}
          <Text style={textStyles}>{text}</Text>
          {icon && iconPosition === 'right' && (
            <Feather 
              name={icon} 
              size={18} 
              color={primary ? '#fff' : '#FFFFFF'} 
              style={styles.iconRight} 
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B2FBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6B2FBC',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6B2FBC',
  },
  disabledPrimaryButton: {
    backgroundColor: '#9D7BC7',
  },
  disabledSecondaryButton: {
    borderColor: '#9D7BC7',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  disabledText: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
