import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface AvatarProps {
  userId: string;
  size?: number;
  avatarUrl?: string | null;
  onPress?: () => void;
  displayName?: string;
}

/**
 * A unified Avatar component that handles loading errors gracefully
 * and provides consistent fallback behavior across platforms
 */
export const Avatar = ({ 
  userId, 
  size = 32, 
  avatarUrl = null, 
  onPress,
  displayName
}: AvatarProps) => {
  // State to track if the avatar image failed to load
  const [imageError, setImageError] = useState(false);
  
  // Generate the content based on whether we have a valid avatar URL
  const content = (avatarUrl && !imageError) ? (
    <Image
      source={{ uri: avatarUrl }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
      onError={() => {
        console.log(`Error loading avatar for user: ${userId}`);
        setImageError(true); // Mark this image as failed
      }}
      // Use ui-avatars.com API to generate default avatars on the fly
      defaultSource={Platform.OS === 'ios' ? { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || userId)}&background=6B2FBC&color=fff` } : undefined}
    />
  ) : (
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
        {displayName ? displayName.charAt(0).toUpperCase() : 
         userId ? userId.charAt(0).toUpperCase() : 'U'}
      </Text>
    </View>
  );
  
  // If onPress is provided, wrap the content in a TouchableOpacity
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
