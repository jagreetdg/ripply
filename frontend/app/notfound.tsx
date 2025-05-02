import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom 404 Not Found page for handling all unmatched routes
 * This is used as a central error page for invalid routes and URLs
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoHome = () => {
    router.replace('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.patternTop} />
        <View style={styles.patternBottom} />
        
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Feather name="compass" size={80} color="#6B2FBC" />
          </View>
        </View>
        
        <Text style={styles.title}>Page Not Found</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.message}>
          Looks like you've wandered off the path. The page you're looking for doesn't exist.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  patternTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(107, 47, 188, 0.05)',
    zIndex: -1,
  },
  patternBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(107, 47, 188, 0.08)',
    zIndex: -1,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(107, 47, 188, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(107, 47, 188, 0.2)',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6B2FBC',
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(107, 47, 188, 0.3)',
    borderRadius: 2,
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#555',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6B2FBC',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#6B2FBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '70%',
    maxWidth: 250,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    width: '70%',
    maxWidth: 250,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
