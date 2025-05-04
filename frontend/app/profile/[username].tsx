import React, { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, TouchableOpacity, Animated, RefreshControl } from "react-native";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { VoiceNotesList } from "../../components/profile/VoiceNotesList";
import { getUserProfileByUsername, getUserVoiceNotes } from "../../services/api/userService";
import { getVoiceBio } from "../../services/api/voiceBioService";
import { UserNotFound } from "../../components/common/UserNotFound";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";

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
  const [refreshing, setRefreshing] = useState(false);

  // Handler for pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
    } finally {
      setRefreshing(false);
    }
  }
  // Get username from URL params
  const params = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useUser(); // Get the current logged-in user
  
  const [username, setUsername] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false); // Flag to check if viewing own profile
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Create animated values for smooth transitions
  const headerHeight = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const collapsedHeaderOpacity = useRef(new Animated.Value(0)).current;
  
  // Add a listener to scrollY to update header collapse state
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      // Calculate progress of collapse (0 to 1)
      const COLLAPSE_THRESHOLD = 120;
      const COLLAPSE_RANGE = 40;
      
      // Calculate progress between 0 and 1 based on scroll position
      const progress = Math.max(0, Math.min(1, (value - (COLLAPSE_THRESHOLD - COLLAPSE_RANGE)) / COLLAPSE_RANGE));
      
      // Update the animated values based on progress
      headerOpacity.setValue(1 - progress);
      collapsedHeaderOpacity.setValue(progress);
      
      // Update the collapsed state for conditional logic
      setIsHeaderCollapsed(progress > 0.5);
    });
    
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY]);
  
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

  // Check if this is the current user's profile
  useEffect(() => {
    if (currentUser && username) {
      setIsOwnProfile(currentUser.username === username);
    } else {
      setIsOwnProfile(false);
    }
  }, [currentUser, username]);

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
      
      // Fix TypeScript error by properly typing the response
      setUserProfile(profileData as UserProfile);
      
      // Fetch user's voice notes
      const voiceNotesData = await getUserVoiceNotes((profileData as UserProfile).id);
      setVoiceNotes(voiceNotesData || []);
      
      // Fetch user's voice bio if available
      try {
        const voiceBioData = await getVoiceBio((profileData as UserProfile).id);
        setVoiceBio(voiceBioData as VoiceBio);
      } catch (error) {
        console.log('No voice bio found or error fetching voice bio');
        setVoiceBio(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserNotFound(true);
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
        <Text style={styles.errorText}>Could not load user profile. Please try again.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Status bar background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      
      {/* Fixed header that appears when scrolled */}
      <Animated.View 
        style={[
          styles.fixedHeader, 
          { 
            opacity: collapsedHeaderOpacity,
            top: insets.top,
            height: 60, // Fixed height for the collapsed header
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: '100%' }}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{userProfile.display_name}</Text>
          
          {/* Show edit profile button if this is the user's own profile */}
          {isOwnProfile && (
            <TouchableOpacity 
              style={{ marginLeft: 'auto', padding: 8 }}
              onPress={() => router.push('/profile/edit')}
            >
              <Feather name="edit" size={20} color="#6B2FBC" />
            </TouchableOpacity>
          )}
        </View>
        <ProfileHeader
          userId={userProfile.username}
          displayName={userProfile.display_name}
          avatarUrl={userProfile.avatar_url}
          coverPhotoUrl={userProfile.cover_photo_url}
          bio={userProfile.bio || undefined}
          isVerified={userProfile.is_verified}
          isCollapsed={true}
          postCount={voiceNotes.length}
          isOwnProfile={isOwnProfile}
        />
      </Animated.View>
      
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={8}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6B2FBC"
            colors={["#6B2FBC"]}
          />
        }
      >
        {/* Always render the expanded header with animated opacity */}
        <Animated.View style={{ opacity: headerOpacity }}>
          {/* Add padding at the top to account for status bar */}
          <View style={{ paddingTop: insets.top }} />
          <ProfileHeader
            userId={userProfile.username}
            displayName={userProfile.display_name}
            avatarUrl={userProfile.avatar_url}
            coverPhotoUrl={userProfile.cover_photo_url}
            bio={userProfile.bio || undefined}
            isVerified={userProfile.is_verified}
            isCollapsed={false}
            postCount={voiceNotes.length}
            isOwnProfile={isOwnProfile}
          />
        </Animated.View>
      
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
          username={userProfile.username}
          displayName={userProfile.display_name}
          voiceNotes={voiceNotes}
        />
      </Animated.ScrollView>

      {/* Add edit profile button if this is the user's own profile */}
      {isOwnProfile && (
        <TouchableOpacity 
          style={[styles.editProfileButton, { bottom: insets.bottom + 16 }]}
          onPress={() => router.push('/profile/edit')}
        >
          <Feather name="edit-2" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 101, // Higher than the header
  },
  fixedHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    // Remove any top padding from the scroll view itself
    paddingTop: 0,
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
  },
  editProfileButton: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6B2FBC",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
