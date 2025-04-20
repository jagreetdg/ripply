import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ProfileScreen from './profile';

export default function UserProfilePage() {
  // Get the userId from the route params
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  
  console.log('User profile page received userId:', userId);
  
  // Helper function to check if a string is a UUID
  const isUUID = (id: string): boolean => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };
  
  // Validate the user ID
  if (!userId || (typeof userId === 'string' && !isUUID(userId))) {
    console.warn('Invalid user ID format received:', userId);
    // Redirect to the user's own profile if the ID is invalid
    // This prevents navigation to non-existent profiles
    router.replace('/(tabs)/profile');
    return null;
  }
  
  // Render the profile screen with the specific user ID
  return <ProfileScreen userId={userId as string} />;
}
