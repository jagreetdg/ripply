import React, { useEffect, useState } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { VoiceNotesList } from "../../components/profile/VoiceNotesList";
import { getUserProfileByUsername, getUserVoiceNotes } from "../../services/api/userService";
import { getVoiceBio } from "../../services/api/voiceBioService";
import { UserNotFound } from "../../components/common/UserNotFound";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function ProfileByUsernameScreen() {
  // Get username from URL params
  const params = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [username, setUsername] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);
  
  const handleBackPress = () => {
    router.back();
  };

  useEffect(() => {
    if (params.username) {
      console.log('[Profile] Received username param:', params.username);
      setUsername(params.username);
    } else {
      console.log('[Profile] No username param received');
    }
  }, [params.username]);

  useEffect(() => {
    if (username) {
      console.log('[Profile] Username set, fetching user data for:', username);
      fetchUserData();
    } else {
      console.log('[Profile] No username set yet');
    }
  }, [username]);

  const fetchUserData = async () => {
    console.log('[Profile] Starting fetchUserData for username:', username);
    setLoading(true);
    try {
      // Reset user not found state
      setUserNotFound(false);
      
      // Fetch user profile by username
      console.log('[Profile] Calling getUserProfileByUsername for:', username);
      const profileData = await getUserProfileByUsername(username);
      console.log('[Profile] Profile data received:', profileData);
      
      if (!profileData) {
        console.log('[Profile] User not found for username:', username);
        setUserNotFound(true);
        setLoading(false);
        return;
      } else {
        console.log('[Profile] Valid profile data found for username:', username);
      }
      
      // Ensure we have a valid user profile object
      if (typeof profileData === 'object' && 'id' in profileData && 'username' in profileData) {
        console.log('[Profile] Profile data is valid with id and username');
        const typedProfile = profileData as UserProfile;
        setUserProfile(typedProfile);
        console.log('[Profile] User profile set to:', typedProfile);
        
        // Fetch user voice notes using the user ID from the profile
        console.log('[Profile] Fetching voice notes for user ID:', typedProfile.id);
        const voiceNotesData = await getUserVoiceNotes(typedProfile.id);
        console.log('[Profile] Voice notes data received:', voiceNotesData);
        
        // Ensure we're properly handling the response structure
        if (voiceNotesData && typeof voiceNotesData === 'object' && 'data' in voiceNotesData) {
          setVoiceNotes(voiceNotesData.data);
        } else if (Array.isArray(voiceNotesData)) {
          setVoiceNotes(voiceNotesData);
        } else {
          console.error('Unexpected voice notes data format:', voiceNotesData);
          setVoiceNotes([]);
        }
        
        // Fetch voice bio
        const voiceBioData = await getVoiceBio(typedProfile.id);
        setVoiceBio(voiceBioData);
      } else {
        console.error('[Profile] Invalid user profile data format:', profileData);
        console.log('[Profile] Profile data type:', typeof profileData);
        console.log('[Profile] Has id property:', 'id' in (profileData || {}));
        console.log('[Profile] Has username property:', 'username' in (profileData || {}));
        setUserNotFound(true);
      }
    } catch (error: any) {
      console.error("[Profile] Error fetching user data:", error);
      console.log("[Profile] Error name:", error.name);
      console.log("[Profile] Error message:", error.message);
      
      // Check if this is a user not found error
      if (error.name === 'UserNotFoundError') {
        console.log('[Profile] User not found error detected');
        setUserNotFound(true);
      }
    } finally {
      console.log('[Profile] Finished fetchUserData, setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B2FBC" />
      </View>
    );
  }

  if (userNotFound) {
    return <UserNotFound username={username} />;
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
          userId={userProfile.id}
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
