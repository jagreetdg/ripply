import React, { useEffect, useState } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { VoiceNotesList } from "../components/profile/VoiceNotesList";
import { getUserProfile, getUserVoiceNotes } from "../services/api/userService";
import { getVoiceBio } from "../services/api/voiceBioService";
import { VoiceBioRecorder } from "../components/profile/VoiceBioRecorder";
import { UserNotFound } from "../components/common/UserNotFound";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Default user ID for the logged-in user (for demo purposes)
const DEFAULT_USER_ID = "d0c028e7-a33c-4d41-a779-5d1e497b12b3"; // Jamie Jones from mock data

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface VoiceNote {
  id: string;
  title: string;
  duration: number;
  likes: number | { count: number }[];
  comments: number | { count: number }[];
  plays: number | { count: number }[];
  users?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface VoiceBio {
  id: string;
  user_id: string;
  duration: number;
  audio_url: string;
  transcript?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfileScreen() {
  // Get userId from URL params if available
  const params = useLocalSearchParams<{ userId: string, username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_USER_ID);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
  const [showVoiceBioRecorder, setShowVoiceBioRecorder] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [usernameNotFound, setUsernameNotFound] = useState<string | undefined>();
  
  const handleBackPress = () => {
    router.back();
  };

  useEffect(() => {
    // If userId is provided in params, use it
    if (params.userId) {
      console.log('Profile tab received userId param:', params.userId);
      setCurrentUserId(params.userId);
    } else {
      // Otherwise use the default (logged-in) user
      console.log('Using default user ID in profile tab');
      setCurrentUserId(DEFAULT_USER_ID);
    }
  }, [params.userId]);

  useEffect(() => {
    fetchUserData();
  }, [currentUserId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Reset user not found state
      setUserNotFound(false);
      setUsernameNotFound(undefined);
      
      // Fetch user profile
      const profileData = await getUserProfile(currentUserId);
      setUserProfile(profileData as UserProfile);

      // Fetch user voice notes
      const voiceNotesData = await getUserVoiceNotes(currentUserId);
      console.log('Voice notes data received:', voiceNotesData);
      
      // Ensure we're properly handling the response structure
      if (voiceNotesData && typeof voiceNotesData === 'object' && 'data' in voiceNotesData) {
        setVoiceNotes(voiceNotesData.data as VoiceNote[]);
      } else if (Array.isArray(voiceNotesData)) {
        setVoiceNotes(voiceNotesData as VoiceNote[]);
      } else {
        console.error('Unexpected voice notes data format:', voiceNotesData);
        setVoiceNotes([]);
      }
      
      // Fetch voice bio
      const voiceBioData = await getVoiceBio(currentUserId);
      setVoiceBio(voiceBioData as VoiceBio | null);
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      
      // Check if this is a user not found error
      if (error.name === 'UserNotFoundError') {
        console.log('User not found error detected');
        setUserNotFound(true);
        // If we have a username in params, use that for the not found message
        setUsernameNotFound(params.username || `user-${currentUserId}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoiceBioUpdated = async () => {
    // Refresh voice bio data
    const voiceBioData = await getVoiceBio(currentUserId);
    setVoiceBio(voiceBioData as VoiceBio | null);
    setShowVoiceBioRecorder(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B2FBC" />
      </View>
    );
  }

  if (userNotFound) {
    return <UserNotFound username={usernameNotFound} />;
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile data.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: userProfile ? userProfile.display_name : "Profile",
          headerTitleStyle: styles.headerTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
        }} 
      />
      <ScrollView style={styles.scrollView}>
        <ProfileHeader
          userId={userProfile.username}
          displayName={userProfile.display_name}
          avatarUrl={userProfile.avatar_url}
          coverPhotoUrl={userProfile.cover_photo_url}
          bio={userProfile.bio || undefined}
          isVerified={userProfile.is_verified}
        />
      
      {/* Stats bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>0</Text>
          <Text style={styles.statsLabel}>Following</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{voiceNotes.length}</Text>
          <Text style={styles.statsLabel}>Notes</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>0</Text>
          <Text style={styles.statsLabel}>Followers</Text>
        </View>
      </View>
      
        <VoiceNotesList
          userId={currentUserId}
          userName={userProfile.username}
          voiceNotes={voiceNotes}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  headerTitle: {
    color: "#6B2FBC",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  statsItem: {
    alignItems: "center",
    width: "30%",
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  statsLabel: {
    fontSize: 14,
    color: "#666",
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#eee",
  }
});
