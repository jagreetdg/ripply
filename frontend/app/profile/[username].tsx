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
      setUsername(params.username);
    }
  }, [params.username]);

  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Reset user not found state
      setUserNotFound(false);
      
      // Fetch user profile by username
      const profileData = await getUserProfileByUsername(username);
      
      if (!profileData) {
        setUserNotFound(true);
        setLoading(false);
        return;
      }
      
      // Ensure we have a valid user profile object
      if (typeof profileData === 'object' && 'id' in profileData && 'username' in profileData) {
        const typedProfile = profileData as UserProfile;
        setUserProfile(typedProfile);
        
        // Fetch user voice notes using the user ID from the profile
        const voiceNotesData = await getUserVoiceNotes(typedProfile.id);
        
        if (Array.isArray(voiceNotesData)) {
          setVoiceNotes(voiceNotesData);
        } else {
          setVoiceNotes([]);
        }
        
        // Fetch user voice bio if available
        try {
          const voiceBioData = await getVoiceBio(typedProfile.id);
          if (voiceBioData) {
            setVoiceBio(voiceBioData as VoiceBio);
          }
        } catch (bioError) {
          // Voice bio not found or error fetching it - this is optional
        }
      } else {
        setUserNotFound(true);
      }
    } catch (error: any) {
      // Check if this is a user not found error
      if (error.name === 'UserNotFoundError') {
        setUserNotFound(true);
      }
    } finally {
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
