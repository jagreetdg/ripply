import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { FeedItem } from "./FeedItem";
import { getVoiceNotes } from "../../services/api/voiceNoteService";
import { useRouter } from "expo-router";

// Empty array for when no feed items are available
const EMPTY_FEED: any[] = [];

export function HomeFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch feed data from the backend
  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true);
        const voiceNotesData = await getVoiceNotes();
        console.log('Fetched voice notes for feed:', voiceNotesData);
        
        // Transform the voice notes into feed items
        const transformedFeed = voiceNotesData.map((note: any) => ({
          id: note.id,
          userId: note.user_id,
          userName: note.users?.display_name || "User",
          userAvatar: note.users?.avatar_url,
          timePosted: formatTimeAgo(note.created_at),
          voiceNote: {
            id: note.id,
            duration: note.duration || 60,
            title: note.title,
            likes: note.likes || 0,
            comments: note.comments || 0,
            plays: note.plays || 0,
            shares: note.shares || 0,
            backgroundImage: note.background_image || null,
          },
        }));
        
        setFeedItems(transformedFeed);
        setError(null);
      } catch (err) {
        console.error('Error fetching feed data:', err);
        setError('Failed to load feed');
        setFeedItems(EMPTY_FEED);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string): string => {
    if (!timestamp) return '';
    
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Handle navigation to user profile
  const handleProfilePress = (userId: string) => {
    if (userId) {
      router.push({
        pathname: '/profile',
        params: { userId }
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6B2FBC" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>For You</Text>
        <View style={styles.underline} />
      </View>

      {feedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No voice notes found</Text>
          <Text style={styles.emptySubtext}>Follow users to see their voice notes here</Text>
        </View>
      ) : (
        feedItems.map((item) => (
          <FeedItem 
            key={item.id} 
            item={item} 
            onProfilePress={() => handleProfilePress(item.userId)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
});
