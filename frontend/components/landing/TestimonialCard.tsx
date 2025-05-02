import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  style?: ViewStyle;
}

export default function TestimonialCard({
  quote,
  name,
  role,
  avatar,
  style,
}: TestimonialCardProps) {
  // Calculate font size based on quote length
  const quoteFontSize = quote.length > 100 ? 14 : quote.length > 70 ? 15 : 16;
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.quoteSymbol}>"</Text>
      <Text style={[styles.quote, { fontSize: quoteFontSize }]}>{quote}</Text>
      <View style={styles.userInfo}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.userText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
    maxWidth: 320,
    marginHorizontal: 8,
    marginBottom: 16,
    position: 'relative',
    height: 220, // Fixed height for all testimonial cards
    justifyContent: 'space-between',
  },
  quoteSymbol: {
    position: 'absolute',
    top: 8,
    left: 16,
    fontSize: 60,
    color: 'rgba(107, 47, 188, 0.2)',
    fontWeight: 'bold',
  },
  quote: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B2FBC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  role: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
