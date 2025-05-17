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
	ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../../components/profile/VoiceNoteCard";
import { HomeHeader } from "../../components/home/HomeHeader";
import { useUser } from "../../context/UserContext";
// Import all required functions from voiceNoteService
import {
	getVoiceNotes,
	getPersonalizedFeed,
	recordPlay,
} from "../../services/api/voiceNoteService";
import { ENDPOINTS, apiRequest } from "../../services/api/config";

const HEADER_HEIGHT = 60; // Header height

// Define the VoiceNote interface
interface VoiceNote {
	id: string;
	title: string;
	duration: number;
	likes: number | { count: number }[];
	comments: number | { count: number }[];
	plays: number | { count: number }[];
	shares?: number;
	backgroundImage?: string | null;
	background_image?: string | null;
	tags?: string[];
	user_id?: string;
	created_at?: string;
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

// Empty array for when no voice notes are available
const EMPTY_FEED: VoiceNote[] = [];

export default function HomeScreen() {
	console.log("[DEBUG] Home - Component rendering");
	const scrollY = useRef(new Animated.Value(0)).current;
	const [refreshing, setRefreshing] = useState(false);
	// Add ScrollView reference with any type to allow scrollTo method
	const scrollViewRef = useRef<any>(null);
	const { user: currentUser } = useUser();
	const [diagnosticData, setDiagnosticData] = useState<any>(null);
	const [runningDiagnostics, setRunningDiagnostics] = useState(false);

	// Scroll to top function to pass to the header
	const scrollToTop = () => {
		scrollViewRef.current?.scrollTo({ y: 0, animated: true });
	};

	// Effect to track mounting/unmounting
	useEffect(() => {
		console.log("[DEBUG] Home - Component mounted");

		// Get current URL in web environment
		if (Platform.OS === "web" && typeof window !== "undefined") {
			console.log("[DEBUG] Home - Current URL:", window.location.href);
		}

		return () => {
			console.log("[DEBUG] Home - Component unmounting");
		};
	}, []);

	// Handler for pull-to-refresh
	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchVoiceNotes();
		} finally {
			setRefreshing(false);
		}
	};
	const [loading, setLoading] = useState(true);
	// Define interface for feed items
	interface FeedItem {
		id: string;
		userId: string;
		displayName: string;
		username: string;
		userAvatar: string | null;
		timePosted: string;
		isShared: boolean;
		sharedBy?: {
			id: string;
			username: string;
			displayName: string;
			avatarUrl: string | null;
		} | null;
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
			users?: {
				id: string;
				username: string;
				display_name: string;
				avatar_url: string | null;
			};
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

	// Diagnostic function to check follow data
	const runFollowDiagnostics = async () => {
		if (!currentUser?.id) {
			console.log("[DIAGNOSTIC] Cannot run diagnostics, no user logged in");
			return;
		}

		try {
			setRunningDiagnostics(true);
			console.log(
				"[DIAGNOSTIC] Running follow diagnostics for user:",
				currentUser.id
			);

			// Call the diagnostic endpoints
			const followResponse = await apiRequest(
				`${ENDPOINTS.VOICE_NOTES}/diagnostic/follows/${currentUser.id}`
			);
			const feedTraceResponse = await apiRequest(
				`${ENDPOINTS.VOICE_NOTES}/diagnostic/feed/${currentUser.id}`
			);

			// Check if user is following anyone
			const isFollowingAnyone = followResponse?.follows?.length > 0;
			console.log(
				`[DIAGNOSTIC] User is following anyone: ${isFollowingAnyone}`
			);
			console.log(
				`[DIAGNOSTIC] User follows ${
					followResponse?.follows?.length || 0
				} users`
			);

			// Check if feed correctly filters by followed users
			const totalPosts = feedTraceResponse?.totalPostsCount || 0;
			const filteredPosts = feedTraceResponse?.filteredPostsCount || 0;
			console.log(
				`[DIAGNOSTIC] Total posts: ${totalPosts}, Filtered posts: ${filteredPosts}`
			);

			// Compile diagnostic data
			const diagnoseResult = {
				userCheck: {
					userId: currentUser.id,
					isLoggedIn: true,
					username: currentUser.username,
				},
				followData: followResponse,
				feedTrace: feedTraceResponse,
				summary: {
					isFollowingAnyone,
					shouldHaveEmptyFeed: !isFollowingAnyone,
					followingCount: followResponse?.follows?.length || 0,
					postsAvailable: totalPosts,
					postsFromFollowedUsers: filteredPosts,
					potentialIssues: [] as string[],
				},
			};

			// Identify potential issues
			if (isFollowingAnyone && filteredPosts === 0) {
				(diagnoseResult.summary.potentialIssues as string[]).push(
					"User follows people but no posts from them are available"
				);
			}

			if (!isFollowingAnyone && filteredPosts > 0) {
				(diagnoseResult.summary.potentialIssues as string[]).push(
					"User doesn't follow anyone but still gets filtered posts"
				);
			}

			setDiagnosticData(diagnoseResult);
			console.log(
				"[DIAGNOSTIC] Completed diagnostics:",
				JSON.stringify(diagnoseResult.summary)
			);

			return diagnoseResult;
		} catch (error) {
			console.error("[DIAGNOSTIC] Error running diagnostics:", error);
		} finally {
			setRunningDiagnostics(false);
		}
	};

	// Add diagnostic trigger after component mounts
	useEffect(() => {
		// Wait a bit before running diagnostics
		if (currentUser?.id) {
			const timer = setTimeout(() => {
				runFollowDiagnostics();
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, [currentUser]);

	// Fetch voice notes from the API
	const fetchVoiceNotes = useCallback(async () => {
		setLoading(true);
		try {
			let data;

			// If diagnostics were run, log the findings
			if (diagnosticData) {
				console.log("[DIAGNOSTIC] Fetching with diagnostic data available");
				console.log(
					"[DIAGNOSTIC] Following count:",
					diagnosticData.summary.followingCount
				);
				console.log(
					"[DIAGNOSTIC] Should have empty feed:",
					diagnosticData.summary.shouldHaveEmptyFeed
				);
			}

			// Check if user is logged in
			if (currentUser?.id) {
				// Fetch personalized feed for logged in users
				console.log("Fetching personalized feed for user:", currentUser.id);
				data = await getPersonalizedFeed(currentUser.id);
				console.log(
					"Personalized feed data:",
					Array.isArray(data) ? `Array with ${data.length} items` : typeof data,
					data && data.length > 0
						? `First item user_id: ${data[0].user_id}`
						: "Empty array"
				);
			} else {
				// Fallback to all voice notes if user is not logged in
				console.log("No user logged in, fetching general feed");
				data = await getVoiceNotes();
			}

			if (!Array.isArray(data)) {
				console.error("Expected array of voice notes but got:", typeof data);
				setFeedItems([]);
				setError("Invalid data format received from server");
				return;
			}

			// If we have diagnostic data, validate if the posts are from followed users
			if (diagnosticData && currentUser?.id && data.length > 0) {
				const followingIds =
					diagnosticData.followData?.follows?.map(
						(f: { id: string }) => f.id
					) || [];

				// Check if any posts are from users not followed
				const unfollowedPosts = data.filter((item) => {
					// For regular posts, check if the creator is followed
					if (!item.is_shared) {
						return !followingIds.includes(item.user_id);
					}

					// For shared posts, check if the sharer is followed
					// If shared_by exists and has an id field, use that to check
					if (item.shared_by && item.shared_by.id) {
						return !followingIds.includes(item.shared_by.id);
					}

					// If we can't determine the sharer, treat as unfollowed
					return true;
				});

				if (unfollowedPosts.length > 0) {
					console.error(
						"[DIAGNOSTIC] CRITICAL ERROR: Found posts from unfollowed users!",
						unfollowedPosts.map((p) => ({
							id: p.id,
							user_id: p.user_id,
							is_shared: p.is_shared,
							shared_by_id: p.shared_by?.id,
						}))
					);
				} else {
					console.log(
						"[DIAGNOSTIC] All posts are from followed users, as expected"
					);
				}
			}

			// Transform backend data format to match our frontend component expectations
			const transformedData = data.map((item) => {
				// Determine if this is a shared voice note (repost)
				const isShared = !!item.is_shared;

				// Get sharer info if available
				const sharerInfo =
					isShared && item.shared_by
						? {
								id: item.shared_by.id,
								username: item.shared_by.username || "",
								displayName: item.shared_by.display_name || "User",
								avatarUrl: item.shared_by.avatar_url,
						  }
						: null;

				return {
					id: item.id,
					userId: item.user_id,
					displayName: item.users?.display_name || "User",
					username: item.users?.username || "",
					userAvatar: item.users?.avatar_url,
					timePosted:
						isShared && item.shared_at
							? new Date(item.shared_at).toLocaleDateString()
							: new Date(item.created_at).toLocaleDateString(),
					isShared,
					sharedBy: sharerInfo,
					voiceNote: {
						id: item.id,
						duration: item.duration,
						title: item.title,
						likes: item.likes?.[0]?.count || 0,
						comments: item.comments?.[0]?.count || 0,
						plays: item.plays?.[0]?.count || 0,
						shares: item.shares || 0,
						backgroundImage: item.background_image,
						tags: item.tags || [],
						// Include the users object from the API response
						users: item.users,
					},
				};
			});

			setFeedItems(transformedData);
			setError(null);
		} catch (err) {
			console.error("Error fetching voice notes:", err);
			setError("Failed to load voice notes. Please try again.");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [currentUser, diagnosticData]);

	// Initial data fetch
	useEffect(() => {
		fetchVoiceNotes();
	}, [fetchVoiceNotes]);

	const handleNewVoiceNote = () => {
		// TODO: Implement voice note recording
		console.log("New voice note");
		// Navigate to recording screen when implemented
	};

	// Helper function to check if a string is a UUID
	const isUUID = (id: string): boolean => {
		const uuidPattern =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidPattern.test(id);
	};

	// Handle user profile navigation
	const handleUserProfilePress = useCallback(
		(userId: string, username?: string) => {
			if (username) {
				// If we have a username, use that for navigation (preferred)
				console.log("Navigating to profile by username:", username);
				router.push({
					pathname: "/profile/[username]",
					params: { username },
				});
			} else if (userId && isUUID(userId)) {
				// Fallback to userId if username is not available
				console.log("Navigating to user profile with UUID:", userId);
				router.push({
					pathname: "/[userId]",
					params: { userId },
				});
			} else {
				// If no valid userId or username is provided, navigate to a default profile
				console.warn("No valid user identifier for navigation");
				router.push("/profile/user");
			}
		},
		[router]
	);

	// Handle playing a voice note
	const handlePlayVoiceNote = useCallback(
		async (voiceNoteId: string, userId: string) => {
			try {
				// Record the play in the backend
				await recordPlay(voiceNoteId, userId);
			} catch (err) {
				console.error("Error recording play:", err);
			}
		},
		[recordPlay]
	);

	// Header shadow animation
	const headerShadowOpacity = scrollY.interpolate({
		inputRange: [0, 20],
		outputRange: [0, 0.3],
		extrapolate: "clamp",
	});

	return (
		<View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
			{/* Status bar background to prevent content from showing behind it */}
			<View style={[styles.statusBarBackground, { height: insets.top }]} />
			{/* Fixed Header */}
			<Animated.View
				style={[
					styles.header,
					{
						height: HEADER_HEIGHT + (Platform.OS === "ios" ? 0 : insets.top),
						paddingTop: Platform.OS === "ios" ? 0 : insets.top,
						shadowOpacity: headerShadowOpacity,
						// Position header at the very top of the screen
						top: 0,
					},
				]}
			>
				{/* Status bar spacer inside the header */}
				{Platform.OS === "ios" && <View style={{ height: insets.top }} />}
				<HomeHeader onLogoPress={scrollToTop} />
			</Animated.View>

			{/* Scrollable content */}
			<Animated.ScrollView
				ref={scrollViewRef}
				style={styles.scrollView}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingTop:
							HEADER_HEIGHT + (Platform.OS === "ios" ? insets.top : 0),
					},
				]}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor="#6B2FBC"
						colors={["#6B2FBC"]}
						progressBackgroundColor="#FFFFFF"
					/>
				}
			>
				{/* Feed header removed as requested */}

				{loading && !refreshing ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#6B2FBC" />
						<Text style={styles.loadingText}>Loading voice notes...</Text>
					</View>
				) : error ? (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>{error}</Text>
						<TouchableOpacity
							style={styles.retryButton}
							onPress={fetchVoiceNotes}
						>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View style={styles.feedContent}>
						{feedItems.length > 0 ? (
							feedItems.map((item) => (
								<View key={item.id} style={styles.feedItem}>
									<VoiceNoteCard
										key={item.id}
										voiceNote={item.voiceNote}
										userId={item.userId}
										displayName={item.displayName}
										username={item.username}
										userAvatarUrl={item.userAvatar}
										timePosted={item.timePosted}
										voiceNoteUsers={item.voiceNote.users}
										isShared={item.isShared}
										sharedBy={item.sharedBy}
										showRepostAttribution={true}
										onUserProfilePress={() =>
											handleUserProfilePress(item.userId, item.username)
										}
										onPlayPress={() =>
											handlePlayVoiceNote(
												item.voiceNote.id,
												currentUser?.id || ""
											)
										}
									/>
								</View>
							))
						) : (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>
									{currentUser?.id
										? "No posts from users you follow yet. Try following more users!"
										: "No voice notes found"}
								</Text>
								{currentUser?.id && (
									<TouchableOpacity
										style={styles.discoverButton}
										onPress={() => router.push("/search")}
									>
										<Text style={styles.discoverButtonText}>
											Discover Users
										</Text>
									</TouchableOpacity>
								)}
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
	statusBarBackground: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		zIndex: 101, // Higher than the header
	},
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF", // White background to match the screenshot
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: "#666",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "#ff3b30",
		textAlign: "center",
		marginBottom: 16,
	},
	retryButton: {
		backgroundColor: "#6B2FBC",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
	},
	retryButtonText: {
		color: "white",
		fontWeight: "bold",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
	},
	emptyText: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
	},
	scrollView: {
		flex: 1,
		backgroundColor: "#FFFFFF", // White background to match the screenshot
	},
	scrollContent: {
		flexGrow: 1,
		// Base padding is handled inline to account for dynamic insets
	},
	header: {
		position: "absolute",
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		zIndex: 100,
		borderBottomWidth: 1,
		borderBottomColor: "#E1E1E1",
		// Only show shadow at the bottom
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
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
		width: 40,
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
		flex: 1,
		alignItems: "center",
	},
	logoText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#6B2FBC",
	},
	searchButton: {
		padding: 4,
		width: 40,
	},
	feedHeader: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		flexDirection: "column",
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
	discoverButton: {
		backgroundColor: "#6B2FBC",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		marginTop: 10,
	},
	discoverButtonText: {
		color: "white",
		fontWeight: "bold",
	},
});
