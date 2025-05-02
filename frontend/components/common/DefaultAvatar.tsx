import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DefaultAvatarProps {
  userId: string;
  size?: number;
  onPress?: () => void;
}

/**
 * A component that renders a default avatar with the first letter of the user ID
 * Used as a fallback when avatar images fail to load
 */
export const DefaultAvatar = ({ userId, size = 32, onPress }: DefaultAvatarProps) => {
  const content = (
    <View
      style={[
        styles.defaultAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.defaultAvatarText, { fontSize: size * 0.4 }]}>
        {userId ? userId.charAt(0).toUpperCase() : 'U'}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  defaultAvatar: {
    backgroundColor: '#6B2FBC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  defaultAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
});
