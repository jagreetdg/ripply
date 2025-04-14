import React, { useCallback, memo } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../profile/VoiceNoteCard";

interface FeedItemProps {
  item: {
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
    };
  };
}

function FeedItemComponent({ item }: FeedItemProps) {
  const router = useRouter();

  // Use proper expo-router navigation
  const handleProfilePress = useCallback(() => {
    // Navigate to profile page using tab navigation
    router.push("/(tabs)/profile");
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
      
      <View style={styles.content}>
        <VoiceNoteCard voiceNote={item.voiceNote} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E1E1",
  },
  header: {
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});

// Use memo to prevent unnecessary re-renders
export const FeedItem = memo(FeedItemComponent);
