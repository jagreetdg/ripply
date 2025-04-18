import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Text,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../../components/profile/VoiceNoteCard";
import { getVoiceNotes, recordPlay } from "../../services/api/voiceNoteService";

const HEADER_HEIGHT = 60; // Header height

// Fallback mock data for the feed (will be replaced with API data)
const MOCK_FEED_ITEMS = [
  {
    id: "1",
    userId: "@sarah_music",
    userName: "Sarah",
    userAvatar: null,
    timePosted: "2h",
    voiceNote: {
      id: "1",
      duration: 120,
      title: "🎵 New song idea - let me know what you think!",
      likes: 2341,
      comments: 156,
      plays: 15723,
      shares: 432,
      backgroundImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
      tags: ["music", "songwriting", "acoustic", "indie", "newmusic"],
    },
  },
  {
    id: "2",
    userId: "@mike_thoughts",
    userName: "Mike",
    userAvatar: null,
    timePosted: "4h",
    voiceNote: {
      id: "2",
      duration: 45,
      title: "Quick life update ✨",
      likes: 892,
      comments: 73,
      plays: 3421,
      shares: 127,
      backgroundImage: null,
      tags: ["life", "update", "personal", "journey"],
    },
  },
  {
    id: "3",
    userId: "@travel_junkie",
    userName: "Emma",
    userAvatar: null,
    timePosted: "5h",
    voiceNote: {
      id: "3",
      duration: 90,
      title: "🌊 Ocean sounds from my morning walk",
      likes: 1243,
      comments: 87,
      plays: 5632,
      shares: 231,
      backgroundImage: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0",
      tags: ["travel", "ocean", "nature", "sounds", "morning", "walk"],
    },
  },
  {
    id: "4",
    userId: "@podcast_pro",
    userName: "James",
    userAvatar: null,
    timePosted: "7h",
    voiceNote: {
      id: "4",
      duration: 180,
      title: "Thoughts on the latest tech trends 💻",
      likes: 1876,
      comments: 134,
      plays: 7821,
      shares: 342,
      backgroundImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
      tags: ["tech", "trends", "ai", "innovation", "future", "gadgets", "review"],
    },
  },
  {
    id: "5",
    userId: "@mindfulness_coach",
    userName: "Lily",
    userAvatar: null,
    timePosted: "9h",
    voiceNote: {
      id: "5",
      duration: 60,
      title: "2-minute guided meditation for stress 🧘‍♀️",
      likes: 3241,
      comments: 98,
      plays: 12453,
      shares: 876,
      backgroundImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
      tags: ["meditation", "mindfulness", "wellness", "stress", "relax", "selfcare", "health"],
    },
  },
  {
    id: "6",
    userId: "@book_lover",
    userName: "David",
    userAvatar: null,
    timePosted: "11h",
    voiceNote: {
      id: "6",
      duration: 150,
      title: "My thoughts on that plot twist! 📚 (spoiler alert)",
      likes: 754,
      comments: 92,
      plays: 2341,
      shares: 87,
      backgroundImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
      tags: ["books", "reading", "bookreview", "fiction", "literature", "plottwist", "spoilers"],
    },
  },
  {
    id: "7",
    userId: "@coffee_addict",
    userName: "Sophie",
    userAvatar: null,
    timePosted: "14h",
    voiceNote: {
      id: "7",
      duration: 40,
      title: "The sound of my new espresso machine ☕",
      likes: 987,
      comments: 45,
      plays: 3210,
      shares: 123,
      backgroundImage: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
      tags: ["coffee", "espresso", "sounds", "asmr", "caffeine", "morningroutine"],
    },
  },
  {
    id: "8",
    userId: "@night_owl",
    userName: "Alex",
    userAvatar: null,
    timePosted: "18h",
    voiceNote: {
      id: "8",
      duration: 75,
      title: "Late night thoughts and city sounds 🌃",
      likes: 1432,
      comments: 76,
      plays: 5421,
      shares: 234,
      backgroundImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
      tags: ["night", "city", "urban", "thoughts", "latenight", "ambient", "reflection"],
    },
  },
  {
    id: "9",
    userId: "@fitness_guru",
    userName: "Ryan",
    userAvatar: null,
    timePosted: "22h",
    voiceNote: {
      id: "9",
      duration: 65,
      title: "Motivation for your morning workout 💪",
      likes: 2143,
      comments: 132,
      plays: 8765,
      shares: 543,
      backgroundImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
      tags: ["fitness", "workout", "motivation", "health", "exercise", "gym", "morning", "strength"],
    },
  },
  {
    id: "10",
    userId: "@food_explorer",
    userName: "Olivia",
    userAvatar: null,
    timePosted: "1d",
    voiceNote: {
      id: "10",
      duration: 110,
      title: "The sounds of this amazing street food market 🍜",
      likes: 1876,
      comments: 143,
      plays: 6543,
      shares: 321,
      backgroundImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
      tags: ["food", "streetfood", "foodie", "travel", "culinary", "market", "cuisine", "sounds", "experience"],
    },
  },
];

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  // Define interface for feed items
  interface FeedItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string | null;
    timePosted: string;
    voiceNote: {
      id: string;
      duration: number;
      title: string;
      likes: number;
      comments: number;
      plays: number;
      shares: number;
      backgroundImage: string | null;
      tags: string[];
    };
  }

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  // Fetch voice notes from the API
  const fetchVoiceNotes = useCallback(async () => {
    try {
      const data = await getVoiceNotes();
      console.log('Fetched voice notes:', data);
      
      // Transform backend data format to match our frontend component expectations
      const transformedData = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        userName: item.users?.display_name || 'User',
        userAvatar: item.users?.avatar_url,
        timePosted: new Date(item.created_at).toLocaleDateString(),
        voiceNote: {
          id: item.id,
          duration: item.duration,
          title: item.title,
          likes: item.likes?.[0]?.count || 0,
          comments: item.comments?.[0]?.count || 0,
          plays: item.plays?.[0]?.count || 0,
          shares: 0,
          backgroundImage: item.background_image,
          tags: item.tags || [],
        }
      }));
      
      setFeedItems(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching voice notes:', err);
      setError('Failed to load voice notes. Please try again.');
      // Fallback to mock data if API fails
      if (feedItems.length === 0) {
        setFeedItems(MOCK_FEED_ITEMS);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchVoiceNotes();
  };

  const handleNewVoiceNote = () => {
    // TODO: Implement voice note recording
    console.log("New voice note");
    // Navigate to recording screen when implemented
  };

  // Use proper expo-router navigation
  const handleProfilePress = useCallback(() => {
    // Navigate to profile page using tab navigation
    router.push("/(tabs)/profile");
  }, [router]);

  // Handle playing a voice note
  const handlePlayVoiceNote = useCallback(async (voiceNoteId: string, userId: string) => {
    try {
      // Record the play in the backend
      await recordPlay(voiceNoteId, userId);
    } catch (err) {
      console.error('Error recording play:', err);
    }
  }, []);

  // Header shadow animation
  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.3],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <Animated.View
        style={[
          styles.header,
          {
            shadowOpacity: headerShadowOpacity,
            height: HEADER_HEIGHT + insets.top,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <View style={styles.profilePicture}>
              <Text style={styles.profileInitial}>U</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Ripply</Text>
          </View>
          
          <TouchableOpacity style={styles.searchButton}>
            <Feather name="search" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6B2FBC"
            colors={["#6B2FBC"]}
          />
        }
      >
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>For You</Text>
          <View style={styles.underline} />
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B2FBC" />
            <Text style={styles.loadingText}>Loading voice notes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchVoiceNotes}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.feedContent}>
            {feedItems.length > 0 ? (
              feedItems.map((item) => (
                <View key={item.id} style={styles.feedItem}>
                  <VoiceNoteCard 
                    voiceNote={item.voiceNote} 
                    userId={item.userId} 
                    userName={item.userName} 
                    timePosted={item.timePosted} 
                    onPlay={() => handlePlayVoiceNote(item.id, item.userId)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No voice notes found</Text>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={handleNewVoiceNote}
      >
        <Feather name="mic" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6B2FBC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: HEADER_HEIGHT, // Add padding for fixed header
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: "100%",
  },
  profileButton: {
    padding: 4,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6B2FBC",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B2FBC",
  },
  searchButton: {
    padding: 4,
  },
  feedHeader: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E1E1",
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  underline: {
    marginTop: 8,
    width: 40,
    height: 3,
    backgroundColor: "#6B2FBC",
    borderRadius: 1.5,
  },
  feedContent: {
    padding: 0,
  },
  feedItem: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fab: {
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
