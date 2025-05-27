import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  Pressable, 
  Animated, 
  ViewStyle, 
  TextStyle,
  Easing,
  View,
  Platform,
  ActivityIndicator
} from 'react-native';

interface SocialAuthButtonProps {
  text?: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function SocialAuthButton({
  text,
  onPress,
  style,
  textStyle,
  icon,
  disabled = false,
  isLoading = false,
}: SocialAuthButtonProps) {
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
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    disabled && styles.disabledText,
    textStyle,
  ];

  const animatedStyles = {
    transform: [{ scale: scaleAnim }],
    shadowOpacity: Platform.OS === 'web' ? shadowAnim : 0.1,
  };

  return (
    <Animated.View style={animatedStyles}>
      <Pressable
        style={({ pressed }) => pressed ? [buttonStyles, { opacity: 0.9 }] : buttonStyles}
        onPress={(isLoading || disabled) ? undefined : onPress}
        onPressIn={(isLoading || disabled) ? undefined : handlePressIn}
        onPressOut={(isLoading || disabled) ? undefined : handlePressOut}
        android_ripple={(isLoading || disabled) ? undefined : { color: '#E8DEF8', borderless: true, radius: -1 }}
      >
        <View style={[styles.contentContainer, !text && styles.iconOnlyContainer]}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#6B2FBC" />
          ) : (
            <>
              <View style={[styles.iconContainer, !text && styles.iconOnlyIconContainer]}>{icon}</View>
              {text && <Text style={textStyles}>{text}</Text>}
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    ...(Platform.OS === 'ios' ? {
      shadowOffset: { width: 0, height: 2 },
    } : {}),
  },
  disabledButton: {
    opacity: 0.7,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    flexShrink: 1,
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
  iconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 4,
  },
  iconOnlyContainer: {
    justifyContent: 'center',
  },
  iconOnlyIconContainer: {
    marginRight: 0,
  },
});
