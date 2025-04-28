import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UserNotFoundProps {
  username?: string;
}

export const UserNotFound: React.FC<UserNotFoundProps> = ({ username }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoHome = () => {
    router.replace('/');
  };

  const handleSearch = () => {
    router.push('/search');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="user-slash" size={80} color="#6B2FBC" style={styles.icon} />
          <View style={styles.iconBackground} />
        </View>
        
        <Text style={styles.title}>User Not Found</Text>
        
        {username && (
          <Text style={styles.subtitle}>
            We couldn't find a user with the username <Text style={styles.highlight}>{username}</Text>
          </Text>
        )}
        
        <Text style={styles.message}>
          The user may have changed their username or deleted their account.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSearch}>
            <Text style={styles.secondaryButtonText}>Search for Users</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

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
  },
  iconContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconBackground: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F0F0F0',
    zIndex: 0,
  },
  icon: {
    zIndex: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B2FBC',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#6B2FBC',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6B2FBC',
    paddingVertical: 14,
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
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
