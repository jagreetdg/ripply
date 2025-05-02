import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FeatureCardProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
  style?: ViewStyle;
  iconColor?: string;
  index?: number;
}

export default function FeatureCard({
  icon,
  title,
  description,
  style,
  iconColor = '#6B2FBC',
  index = 0,
}: FeatureCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: `${iconColor}20` }]}>
          <Feather name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B2FBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
