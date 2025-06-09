import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

// Define notification types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  type:
    | "like"
    | "comment"
    | "follow"
    | "mention"
    | "repost"
    | "new_content"
    | "milestone"
    | "trending";
  message: string;
  user: User;
  voiceNoteTitle?: string;
  voiceNoteId?: string;
  comment?: string;
  timeAgo: string;
  read: boolean;
  milestone?: {
    type: "followers" | "plays" | "likes";
    count: number;
  };
}

// Sample notifications data (in a real app, this would come from an API)
const dummyNotifications: Notification[] = [
  {
    id: "1",
    type: "like",
    message: "liked your voice note",
    user: {
      id: "user1",
      username: "john_doe",
      displayName: "John Doe",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    voiceNoteId: "vn123",
    voiceNoteTitle: "My thoughts on climate change",
    timeAgo: "5m",
    read: false,
  },
  {
    id: "2",
    type: "milestone",
    message: "Congrats! Your voice note reached a milestone",
    user: {
      id: "system",
      username: "ripply",
      displayName: "Ripply",
      avatarUrl: null,
    },
    voiceNoteId: "vn124",
    voiceNoteTitle: "Morning meditation routine",
    timeAgo: "1h",
    read: false,
    milestone: {
      type: "plays",
      count: 1000,
    },
  },
  {
    id: "3",
    type: "comment",
    message: "commented on your voice note",
    user: {
      id: "user2",
      username: "sara_smith",
      displayName: "Sara Smith",
      avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    voiceNoteId: "vn125",
    voiceNoteTitle: "Weekend travels",
    comment:
      "Great trip! Where was this? I've been looking for new places to explore this summer. The scenery looks amazing!",
    timeAgo: "2h",
    read: false,
  },
  {
    id: "4",
    type: "trending",
    message: "Your voice note is trending!",
    user: {
      id: "system",
      username: "ripply",
      displayName: "Ripply",
      avatarUrl: null,
    },
    voiceNoteId: "vn126",
    voiceNoteTitle: "How I learned to code in 30 days",
    timeAgo: "3h",
    read: false,
  },
  {
    id: "5",
    type: "follow",
    message: "started following you",
    user: {
      id: "user3",
      username: "mike_jones",
      displayName: "Mike Jones",
      avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    timeAgo: "5h",
    read: true,
  },
  {
    id: "6",
    type: "mention",
    message: "mentioned you in a voice note",
    user: {
      id: "user4",
      username: "lisa_parker",
      displayName: "Lisa Parker",
      avatarUrl: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    voiceNoteId: "vn127",
    voiceNoteTitle: "Podcast recommendations for my friend @user",
    timeAgo: "6h",
    read: true,
  },
  {
    id: "7",
    type: "repost",
    message: "reposted your voice note",
    user: {
      id: "user5",
      username: "david_miller",
      displayName: "David Miller",
      avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
    },
    voiceNoteId: "vn128",
    voiceNoteTitle: "My favorite songs this month",
    timeAgo: "12h",
    read: true,
  },
  {
    id: "8",
    type: "like",
    message: "and 5 others liked your voice note",
    user: {
      id: "user6",
      username: "emily_wilson",
      displayName: "Emily Wilson",
      avatarUrl: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    voiceNoteId: "vn129",
    voiceNoteTitle: "Morning thoughts",
    timeAgo: "1d",
    read: true,
  },
  {
    id: "9",
    type: "milestone",
    message: "Your account reached 100 followers!",
    user: {
      id: "system",
      username: "ripply",
      displayName: "Ripply",
      avatarUrl: null,
    },
    timeAgo: "2d",
    read: true,
    milestone: {
      type: "followers",
      count: 100,
    },
  },
  {
    id: "10",
    type: "comment",
    message: "replied to a comment on your voice note",
    user: {
      id: "user7",
      username: "alex_cooper",
      displayName: "Alex Cooper",
      avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    voiceNoteId: "vn130",
    voiceNoteTitle: "Why I switched careers",
    comment:
      "I had the same experience! It's definitely worth taking the risk when you're passionate about something new.",
    timeAgo: "3d",
    read: true,
  },
  {
    id: "11",
    type: "new_content",
    message: "shared a new voice note you might like",
    user: {
      id: "user8",
      username: "taylor_swift",
      displayName: "Taylor Swift",
      avatarUrl: "https://randomuser.me/api/portraits/women/90.jpg",
    },
    voiceNoteId: "vn131",
    voiceNoteTitle: "New song breakdown",
    timeAgo: "4d",
    read: true,
  },
  {
    id: "12",
    type: "follow",
    message: "and 3 others started following you",
    user: {
      id: "user9",
      username: "james_bond",
      displayName: "James Bond",
      avatarUrl: "https://randomuser.me/api/portraits/men/90.jpg",
    },
    timeAgo: "5d",
    read: true,
  },
];

export const useNotifications = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
  const [refreshing, setRefreshing] = useState(false);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    // In a real app, this would call an API
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
    console.log("Marking all notifications as read");
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback((notification: Notification) => {
    // In a real app, this would navigate to the relevant content
    console.log("Notification pressed:", notification.id);

    if (notification.type === "follow") {
      router.push(`/profile/${notification.user.username}`);
    } else if (notification.voiceNoteId && notification.voiceNoteTitle) {
      // This would navigate to the voice note in a real app
      console.log(`Navigate to voice note: ${notification.voiceNoteTitle}`);
    }

    // Mark the notification as read
    setNotifications(prevNotifications => 
      prevNotifications.map(item => 
        item.id === notification.id 
          ? { ...item, read: true } 
          : item
      )
    );
  }, [router]);

  // Handle user profile press
  const handleUserPress = useCallback((username: string) => {
    router.push(`/profile/${username}`);
  }, [router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      // In a real app, this would fetch new notifications from the API
      setRefreshing(false);
    }, 1000);
  }, []);

  return {
    notifications,
    refreshing,
    markAllAsRead,
    handleNotificationPress,
    handleUserPress,
    handleRefresh
  };
}; 