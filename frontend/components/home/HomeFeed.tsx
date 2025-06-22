import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
	RefreshControl,
	ScrollView,
} from "react-native";
import { FeedItem } from "./FeedItem";
import { getAllVoiceNotes, getPersonalizedFeed } from "../../services/api";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import { Feather } from "@expo/vector-icons";
import { formatTimeAgo } from "../../utils/timeUtils";

// Empty array for when no feed items are available
const EMPTY_FEED: any[] = [];

export function HomeFeed() {
	const [feedItems, setFeedItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [feedType, setFeedType] = useState<"personalized" | "all">(
		"personalized"
	);
	const [refreshing, setRefreshing] = useState(false);
	const router = useRouter();
	const { user } = useUser();

	// Fetch feed data from the backend
	const fetchFeedData = async (feedTypeToFetch = feedType) => {
		try {
			setLoading(true);
			let voiceNotesData;

			if (__DEV__) {
				console.log(
					`Feed fetch: user=${
						user?.id
					}, feedType=${feedTypeToFetch}, hasUser=${!!user}`
				);
			}

			if (user && feedTypeToFetch === "personalized") {
				// If user is logged in and wants personalized feed
				voiceNotesData = await getPersonalizedFeed(user.id);
				if (__DEV__) {
					console.log("Fetched personalized feed for user:", user.id);
				}
			} else {
				// Otherwise get the global feed
				voiceNotesData = await getAllVoiceNotes();
				if (__DEV__) {
					console.log("Fetched global feed");
				}
			}

			// Transform the voice notes into feed items
			const transformedFeed = voiceNotesData.map((note: any) => {
				// Determine if this is a shared voice note
				const isShared = note.is_shared || false;

				// Process the shared_by information properly
				let sharedByInfo = null;
				if (isShared && note.shared_by) {
					sharedByInfo = {
						id: note.shared_by.id || "",
						username: note.shared_by.username || "",
						displayName: note.shared_by.display_name || "User",
						avatarUrl: note.shared_by.avatar_url || null,
					};
				}

				return {
					id: note.id,
					userId: note.user_id, // Original creator's ID
					userName: note.users?.username || "",
					displayName: note.users?.display_name || "User",
					userAvatar: note.users?.avatar_url,
					timePosted: formatTimeAgo(
						isShared ? note.shared_at : note.created_at
					),
					isShared: isShared,
					sharedBy: sharedByInfo,
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
				};
			});

			setFeedItems(transformedFeed);
			setError(null);
		} catch (err) {
			console.error("Error fetching feed data:", err);
			setError("Failed to load feed");
			setFeedItems(EMPTY_FEED);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	// Handle pull-to-refresh
	const handleRefresh = () => {
		setRefreshing(true);
		fetchFeedData();
	};

	// Toggle between personalized and all feeds
	const toggleFeedType = () => {
		const newFeedType = feedType === "personalized" ? "all" : "personalized";
		setFeedType(newFeedType);
		fetchFeedData(newFeedType);
	};

	// Initial fetch
	useEffect(() => {
		fetchFeedData();
	}, [user]);

	// Handle navigation to user profile
	const handleProfilePress = (userId: string) => {
		if (userId) {
			router.push({
				pathname: "/profile/[username]",
				params: { username: userId },
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
				{user ? (
					<TouchableOpacity
						onPress={toggleFeedType}
						style={styles.feedTypeToggle}
					>
						<Text style={styles.feedTitle}>
							{feedType === "personalized" ? "Following" : "For You"}
						</Text>
						<Feather
							name="chevron-down"
							size={16}
							color="#6B2FBC"
							style={styles.toggleIcon}
						/>
					</TouchableOpacity>
				) : (
					<Text style={styles.feedTitle}>For You</Text>
				)}
				<View style={styles.underline} />
			</View>

			<ScrollView
				style={styles.scrollView}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={["#6B2FBC"]}
						tintColor="#6B2FBC"
					/>
				}
			>
				{feedItems.length === 0 ? (
					<View style={styles.emptyContainer}>
						{user && feedType === "personalized" ? (
							<>
								<Text style={styles.emptyText}>Your feed is empty</Text>
								<Text style={styles.emptySubtext}>
									Follow users to see their voice notes here
								</Text>
								<TouchableOpacity
									style={styles.switchFeedButton}
									onPress={toggleFeedType}
								>
									<Text style={styles.switchFeedButtonText}>
										View global feed
									</Text>
								</TouchableOpacity>
							</>
						) : (
							<>
								<Text style={styles.emptyText}>No voice notes found</Text>
								<Text style={styles.emptySubtext}>
									Check back later for new content
								</Text>
							</>
						)}
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
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	scrollView: {
		flex: 1,
	},
	centerContent: {
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: "#666",
	},
	errorText: {
		fontSize: 16,
		color: "#ff3b30",
		textAlign: "center",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		marginTop: 100,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginBottom: 20,
	},
	feedHeader: {
		paddingVertical: 12,
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E1E1E1",
	},
	feedTypeToggle: {
		flexDirection: "row",
		alignItems: "center",
	},
	feedTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333333",
	},
	toggleIcon: {
		marginLeft: 5,
	},
	underline: {
		marginTop: 8,
		width: 40,
		height: 3,
		backgroundColor: "#6B2FBC",
		borderRadius: 1.5,
	},
	switchFeedButton: {
		marginTop: 16,
		paddingVertical: 8,
		paddingHorizontal: 16,
		backgroundColor: "#6B2FBC",
		borderRadius: 20,
	},
	switchFeedButtonText: {
		color: "#FFFFFF",
		fontWeight: "600",
	},
});
