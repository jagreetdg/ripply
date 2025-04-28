import React, { useEffect } from "react";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { getUserProfile } from "../services/api/userService";

// Default user ID for the logged-in user (for demo purposes)
const DEFAULT_USER_ID = "d0c028e7-a33c-4d41-a779-5d1e497b12b3"; // Jamie Jones from mock data
const DEFAULT_USERNAME = "jamiejones"; // Default username for the logged-in user

export default function ProfileScreen() {
  // Get userId from URL params if available
  const params = useLocalSearchParams<{ userId: string, username: string }>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [username, setUsername] = React.useState<string | null>(null);

  useEffect(() => {
    async function redirectToUsernameProfile() {
      // If username is directly provided, use it
      if (params.username) {
        setUsername(params.username);
        setLoading(false);
        return;
      }
      
      // If userId is provided, look up the username
      if (params.userId) {
        try {
          const profileData = await getUserProfile(params.userId);
          if (profileData && typeof profileData === 'object' && 'username' in profileData) {
            setUsername(String(profileData.username));
          } else {
            // If user not found, use a default
            setUsername(DEFAULT_USERNAME);
          }
        } catch (error) {
          console.error("Error fetching user profile for redirect:", error);
          setUsername(DEFAULT_USERNAME);
        }
      } else {
        // No params, use default
        setUsername(DEFAULT_USERNAME);
      }
      
      setLoading(false);
    }
    
    redirectToUsernameProfile();
  }, [params.userId, params.username]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B2FBC" />
      </View>
    );
  }

  // Redirect to the username-based profile route
  return <Redirect href={`/profile/${username}`} />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  }
});
