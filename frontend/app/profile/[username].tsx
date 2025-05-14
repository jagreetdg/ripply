import React, { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import {
	View,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Text,
	TouchableOpacity,
	Animated,
	RefreshControl,
} from "react-native";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { VoiceNotesList } from "../../components/profile/VoiceNotesList";
import {
	getUserProfileByUsername,
	getUserVoiceNotes,
	getUserSharedVoiceNotes,
	getFollowerCount,
	getFollowingCount,
} from "../../services/api/userService";
import { getVoiceBio } from "../../services/api/voiceBioService";
import { UserNotFound } from "../../components/common/UserNotFound";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { FollowButton } from "../../components/profile/FollowButton";

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
	const { user: currentUser } = useUser();
	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [isOwnProfile, setIsOwnProfile] = useState(false);
	const [activeTab, setActiveTab] = useState("voice-notes"); // "voice-notes" or "shared"
	const [sharedVoiceNotes, setSharedVoiceNotes] = useState<VoiceNote[]>([]);
	const [loadingShared, setLoadingShared] = useState(false);

	// Handler for pull-to-refresh
	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchUserData();

			// Also explicitly refresh follower and following counts
			if (userProfile) {
				console.log("Explicitly refreshing follower and following counts");
				const followers = await getFollowerCount(userProfile.id);
				const following = await getFollowingCount(userProfile.id);
				setFollowerCount(followers);
				setFollowingCount(following);
			}
		} catch (error) {
			console.error("Error refreshing data:", error);
		} finally {
			setRefreshing(false);
		}
	};
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
	const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
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
			const progress = Math.max(
				0,
				Math.min(
					1,
					(value - (COLLAPSE_THRESHOLD - COLLAPSE_RANGE)) / COLLAPSE_RANGE
				)
			);

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

	useEffect(() => {
		if (currentUser && userProfile) {
			setIsOwnProfile(currentUser.username === userProfile.username);
		}
	}, [currentUser, userProfile]);

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
			if (
				typeof profileData === "object" &&
				"id" in profileData &&
				"username" in profileData
			) {
				const typedProfile = profileData as UserProfile;
				setUserProfile(typedProfile);

				// Fetch user voice notes using the user ID from the profile
				const voiceNotesData = await getUserVoiceNotes(typedProfile.id);

				if (Array.isArray(voiceNotesData)) {
					setVoiceNotes(voiceNotesData);
				} else {
					setVoiceNotes([]);
				}

				// Fetch shared voice notes
				setLoadingShared(true);
				try {
					const sharedVoiceNotesData = await getUserSharedVoiceNotes(
						typedProfile.id
					);
					if (Array.isArray(sharedVoiceNotesData)) {
						setSharedVoiceNotes(sharedVoiceNotesData);
					} else {
						setSharedVoiceNotes([]);
					}
				} catch (sharedError) {
					console.error("Error fetching shared voice notes:", sharedError);
					setSharedVoiceNotes([]);
				} finally {
					setLoadingShared(false);
				}

				// Fetch follower and following counts
				const followers = await getFollowerCount(typedProfile.id);
				const following = await getFollowingCount(typedProfile.id);
				setFollowerCount(followers);
				setFollowingCount(following);

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
			if (error.name === "UserNotFoundError") {
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
		<View style={[styles.container]}>
			{/* Status bar background to prevent content from showing behind it */}
			<View style={[styles.statusBarBackground, { height: insets.top }]} />
			<Stack.Screen
				options={{
					// Hide the default header when we're using our custom collapsible header
					headerShown: false,
				}}
			/>
			{/* Always render the collapsed header as an overlay with animated opacity */}
			<Animated.View
				style={[
					styles.fixedHeader,
					{
						opacity: collapsedHeaderOpacity,
						top: 0, // Start from the very top of the screen
					},
				]}
			>
				{/* Status bar spacer inside the header */}
				<View style={{ height: insets.top }} />
				<ProfileHeader
					userId={userProfile.id}
					username={userProfile.username}
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
						userId={userProfile.id}
						username={userProfile.username}
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

				{/* Tabs to switch between original voice notes and shared content */}
				<View style={styles.tabContainer}>
					<TouchableOpacity
						style={[
							styles.tabButton,
							activeTab === "voice-notes" && styles.activeTabButton,
						]}
						onPress={() => setActiveTab("voice-notes")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "voice-notes" && styles.activeTabText,
							]}
						>
							Voice Notes
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.tabButton,
							activeTab === "shared" && styles.activeTabButton,
						]}
						onPress={() => setActiveTab("shared")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "shared" && styles.activeTabText,
							]}
						>
							Reposts
						</Text>
					</TouchableOpacity>
				</View>

				{/* Voice Notes List */}
				{activeTab === "voice-notes" ? (
					voiceNotes.length === 0 ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>No voice notes yet</Text>
						</View>
					) : (
						<VoiceNotesList
							userId={userProfile.id}
							username={userProfile.username}
							displayName={userProfile.display_name}
							voiceNotes={voiceNotes}
							onRefresh={handleRefresh}
						/>
					)
				) : loadingShared ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="small" color="#6B2FBC" />
					</View>
				) : sharedVoiceNotes.length === 0 ? (
					<View style={styles.emptyState}>
						<Text style={styles.emptyText}>No reposts yet</Text>
					</View>
				) : (
					<VoiceNotesList
						userId={userProfile.id}
						username={userProfile.username}
						displayName={userProfile.display_name}
						voiceNotes={sharedVoiceNotes}
						onRefresh={handleRefresh}
						isSharedList={true}
					/>
				)}
			</Animated.ScrollView>

			{/* Floating action button for creating voice note */}
			<TouchableOpacity
				style={[styles.floatingActionButton, { bottom: insets.bottom + 16 }]}
				onPress={() => router.push("/create")}
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
		backgroundColor: "#FFFFFF",
		zIndex: 101, // Higher than the header
	},
	fixedHeader: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 100,
		backgroundColor: "#FFFFFF",
		shadowColor: "#000",
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
	followButtonContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: "center",
	},
	editProfileButtonInline: {
		backgroundColor: "#6B2FBC",
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		minWidth: 100,
	},
	buttonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
	},
	floatingActionButton: {
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
	tabContainer: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#EFEFEF",
		marginBottom: 8,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	activeTabButton: {
		borderBottomColor: "#6B2FBC",
	},
	tabText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#888",
	},
	activeTabText: {
		color: "#6B2FBC",
		fontWeight: "600",
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		padding: 50,
	},
	emptyText: {
		fontSize: 16,
		color: "#888",
	},
});
