import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../../components/profile/VoiceNoteCard";

const HEADER_HEIGHT = 60; // Header height

// Mock data for the feed
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
    },
  },
];

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleNewVoiceNote = () => {
    // TODO: Implement voice note recording
    console.log("New voice note");
  };

  // Use Link component approach instead of programmatic navigation
  const handleProfilePress = useCallback(() => {
    // Navigate to profile page without using router API directly
    window.location.href = "/profile";
  }, []);

  // Header shadow animation
  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 0.3],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Fixed header */}
      <Animated.View
        style={[
          styles.header,
          {
            shadowOpacity: headerShadowOpacity,
            height: HEADER_HEIGHT,
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
        
        <View style={styles.feedContent}>
          {MOCK_FEED_ITEMS.map((item) => (
            <View key={item.id} style={styles.feedItem}>
              <View style={styles.feedItemHeader}>
                <TouchableOpacity 
                  style={styles.userInfoContainer}
                  onPress={handleProfilePress}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.userName}</Text>
                    <Text style={styles.userId}>{item.userId}</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{item.timePosted}</Text>
                  <TouchableOpacity style={styles.moreButton}>
                    <Feather name="more-horizontal" size={16} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.voiceNoteContainer}>
                <VoiceNoteCard voiceNote={item.voiceNote} />
              </View>
            </View>
          ))}
        </View>
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
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E1E1",
  },
  feedItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6B2FBC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  userInfo: {
    justifyContent: "center",
  },
  userName: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#000000",
  },
  userId: {
    fontSize: 13,
    color: "#666666",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    color: "#666666",
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  voiceNoteContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
