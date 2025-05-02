import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
}

export default function Section({
  title,
  subtitle,
  children,
  style,
  dark = false,
}: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, dark && styles.darkTitle]}>{title}</Text>}
      {subtitle && <Text style={[styles.subtitle, dark && styles.darkSubtitle]}>{subtitle}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#6B2FBC',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
    alignSelf: 'center',
    lineHeight: 24,
  },
  darkSubtitle: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
});
