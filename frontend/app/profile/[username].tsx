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
	TouchableWithoutFeedback,
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
import {
	getVoiceNoteById,
	getVoiceNoteStats,
} from "../../services/api/voiceNoteService";
import { UserNotFound } from "../../components/common/UserNotFound";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { FollowButton } from "../../components/profile/FollowButton";
import { FollowersFollowingPopup } from "../../components/profile/FollowersFollowingPopup";
import { useTheme } from "../../context/ThemeContext";

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

// Function to safely extract plays count from various formats
const normalizePlaysCount = (plays: any): number => {
	if (typeof plays === "number") {
		return plays;
	}

	if (plays && typeof plays === "object") {
		// If it's an object with count property
		if (typeof plays.count === "number") {
			return plays.count;
		}

		// If it's an array of objects with count
		if (
			Array.isArray(plays) &&
			plays.length > 0 &&
			typeof plays[0].count === "number"
		) {
			return plays[0].count;
		}
	}

	return 0; // Default to 0 if no valid format is found
};

export default function ProfileByUsernameScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const { user: currentUser } = useUser();
	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [isOwnProfile, setIsOwnProfile] = useState(false);
	const [sharedVoiceNotes, setSharedVoiceNotes] = useState<VoiceNote[]>([]);
	const [loadingShared, setLoadingShared] = useState(false);
	const [combinedVoiceNotes, setCombinedVoiceNotes] = useState<VoiceNote[]>([]);
	const { colors, isDarkMode } = useTheme();

	// Replace the single popup state with separate states
	const [showFollowersPopup, setShowFollowersPopup] = useState(false);
	const [showFollowingPopup, setShowFollowingPopup] = useState(false);

	// Add a ref for the ScrollView to enable scrolling to top programmatically
	const scrollViewRef = useRef<Animated.ScrollView>(null);

	// Handler for pull-to-refresh
	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchUserData();
		} catch (error) {
			console.error("Error refreshing profile data:", error);
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
				let processedVoiceNotes = [];

				// Fetch complete data for each voice note to ensure we have all stats
				if (Array.isArray(voiceNotesData) && voiceNotesData.length > 0) {
					const fetchPromises = voiceNotesData.map(async (note) => {
						try {
							// Get the complete voice note stats
							const stats = await getVoiceNoteStats(note.id);

							// Get the basic note data
							const completeData = await getVoiceNoteById(note.id);

							// Create a complete note with accurate stats
							return {
								...note, // Base note data
								...completeData, // Complete note data
								likes: stats.likes, // Use the accurate stats
								comments: stats.comments,
								plays: stats.plays,
								shares: stats.shares,
								users: note.users, // Preserve user info
							};
						} catch (error) {
							console.error(
								`Error fetching complete data for note ${note.id}:`,
								error
							);
							// Return normalized note as fallback
							return {
								...note,
								likes: typeof note.likes === "number" ? note.likes : 0,
								comments: typeof note.comments === "number" ? note.comments : 0,
								plays: normalizePlaysCount(note.plays),
								shares: typeof note.shares === "number" ? note.shares : 0,
							};
						}
					});

					// Wait for all notes to be fetched
					processedVoiceNotes = await Promise.all(fetchPromises);
					setVoiceNotes(processedVoiceNotes);
				} else {
					setVoiceNotes([]);
					processedVoiceNotes = [];
				}

				// Fetch shared voice notes
				setLoadingShared(true);
				try {
					const sharedVoiceNotesData = await getUserSharedVoiceNotes(
						typedProfile.id
					);
					let processedSharedNotes = [];

					// Fetch complete data for each shared voice note
					if (
						Array.isArray(sharedVoiceNotesData) &&
						sharedVoiceNotesData.length > 0
					) {
						const fetchSharedPromises = sharedVoiceNotesData.map(
							async (note) => {
								try {
									// Get the complete voice note stats
									const stats = await getVoiceNoteStats(note.id);

									// Get the basic note data
									const completeData = await getVoiceNoteById(note.id);

									// Create a complete note with accurate stats
									return {
										...note, // Base note data
										...completeData, // Complete note data
										likes: stats.likes, // Use the accurate stats
										comments: stats.comments,
										plays: stats.plays,
										shares: stats.shares,
										users: note.users, // Preserve user info
										is_shared: true,
										shared_at: note.shared_at,
										shared_by: note.shared_by,
									};
								} catch (error) {
									console.error(
										`Error fetching complete data for shared note ${note.id}:`,
										error
									);
									// Return normalized note as fallback
									return {
										...note,
										likes: typeof note.likes === "number" ? note.likes : 0,
										comments:
											typeof note.comments === "number" ? note.comments : 0,
										plays: normalizePlaysCount(note.plays),
										shares: typeof note.shares === "number" ? note.shares : 0,
										is_shared: true,
									};
								}
							}
						);

						// Wait for all shared notes to be fetched
						processedSharedNotes = await Promise.all(fetchSharedPromises);
						setSharedVoiceNotes(processedSharedNotes);
					} else {
						setSharedVoiceNotes([]);
						processedSharedNotes = [];
					}

					// Combine and sort voice notes and shared posts by date
					const combined = [...processedVoiceNotes, ...processedSharedNotes];

					// Sort by creation/shared date (newest first)
					combined.sort((a, b) => {
						const dateA = a.shared_at
							? new Date(a.shared_at).getTime()
							: new Date(a.created_at).getTime();
						const dateB = b.shared_at
							? new Date(b.shared_at).getTime()
							: new Date(b.created_at).getTime();
						return dateB - dateA;
					});

					setCombinedVoiceNotes(combined);
				} catch (sharedError) {
					console.error("Error fetching shared voice notes:", sharedError);
					setSharedVoiceNotes([]);
					setCombinedVoiceNotes(processedVoiceNotes);
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

	// Update handlers for showing followers and following popups
	const handleFollowersPress = () => {
		setShowFollowersPopup(true);
	};

	const handleFollowingPress = () => {
		setShowFollowingPopup(true);
	};

	// Add a handler for the header click that scrolls to top
	const handleHeaderPress = () => {
		// Scroll to the top with animation
		if (scrollViewRef.current) {
			scrollViewRef.current.scrollTo({ y: 0, animated: true });
		}
	};

	if (loading) {
		return (
			<View
				style={[
					styles.loadingContainer,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={colors.tint} />
			</View>
		);
	}

	if (userNotFound) {
		return <UserNotFound username={username} />;
	}

	if (!userProfile) {
		return (
			<View
				style={[styles.errorContainer, { backgroundColor: colors.background }]}
			>
				<Text style={[styles.errorText, { color: colors.error }]}>
					Failed to load profile data.
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Status bar background to prevent content from showing behind it */}
			<View
				style={[
					styles.statusBarBackground,
					{ height: insets.top, backgroundColor: colors.background },
				]}
			/>
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
						backgroundColor: colors.card,
						shadowColor: isDarkMode ? "#000" : "#000",
					},
				]}
			>
				{/* Add a touchable area over the header for scrolling to top */}
				<TouchableOpacity
					onPress={handleHeaderPress}
					activeOpacity={0.7}
					style={styles.headerTouchArea}
				>
					<View style={styles.headerContent}>
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
					</View>
				</TouchableOpacity>
			</Animated.View>

			<Animated.ScrollView
				ref={scrollViewRef}
				style={[styles.scrollView, { backgroundColor: colors.background }]}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: false }
				)}
				scrollEventThrottle={8}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={colors.tint}
						colors={[colors.tint]}
						progressBackgroundColor={colors.background}
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

				{/* Stats bar */}
				<View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
					<TouchableOpacity
						style={styles.statsItem}
						onPress={handleFollowingPress}
					>
						<Text style={[styles.statsNumber, { color: colors.text }]}>
							{followingCount}
						</Text>
						<Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
							Following
						</Text>
					</TouchableOpacity>
					<View
						style={[styles.statsDivider, { backgroundColor: colors.border }]}
					/>
					<TouchableOpacity style={styles.statsItem}>
						<Text style={[styles.statsNumber, { color: colors.text }]}>
							{voiceNotes.length}
						</Text>
						<Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
							{voiceNotes.length === 1 ? "Note" : "Notes"}
						</Text>
					</TouchableOpacity>
					<View
						style={[styles.statsDivider, { backgroundColor: colors.border }]}
					/>
					<TouchableOpacity
						style={styles.statsItem}
						onPress={handleFollowersPress}
					>
						<Text style={[styles.statsNumber, { color: colors.text }]}>
							{followerCount}
						</Text>
						<Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
							{followerCount === 1 ? "Follower" : "Followers"}
						</Text>
					</TouchableOpacity>
				</View>

				{isOwnProfile ? (
					<View style={styles.followButtonContainer}>
						<TouchableOpacity
							style={[
								styles.editProfileButtonInline,
								{ backgroundColor: colors.tint },
							]}
							onPress={() => router.push("/profile/edit")}
						>
							<Text style={[styles.buttonText, { color: colors.card }]}>
								Edit Profile
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View style={styles.followButtonContainer}>
						<FollowButton
							userId={userProfile.id}
							onFollowChange={(isFollowing, updatedCount) => {
								// Use the accurate server count if available
								if (typeof updatedCount === "number") {
									console.log(
										`Setting follower count to ${updatedCount} from server`
									);
									setFollowerCount(updatedCount);
								} else {
									// Fallback to the old increment/decrement method
									console.log(`Using local calculation for follower count`);
									setFollowerCount((prev) =>
										isFollowing ? prev + 1 : Math.max(0, prev - 1)
									);
								}
							}}
						/>
					</View>
				)}

				{loading || loadingShared ? (
					<View
						style={[
							styles.loadingContainer,
							{ backgroundColor: colors.background },
						]}
					>
						<ActivityIndicator size="small" color={colors.tint} />
					</View>
				) : combinedVoiceNotes.length === 0 ? (
					<View
						style={[styles.emptyState, { backgroundColor: colors.background }]}
					>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No voice notes yet
						</Text>
					</View>
				) : (
					<VoiceNotesList
						userId={userProfile.id}
						username={userProfile.username}
						displayName={userProfile.display_name}
						voiceNotes={combinedVoiceNotes}
						onRefresh={handleRefresh}
						showRepostAttribution={true}
					/>
				)}
			</Animated.ScrollView>

			{/* Floating action button for creating voice note */}
			<TouchableOpacity
				style={[
					styles.floatingActionButton,
					{
						bottom: insets.bottom + 16,
						backgroundColor: colors.tint,
					},
				]}
				onPress={() => router.push("/create")}
			>
				<Feather name="mic" size={24} color={colors.card} />
			</TouchableOpacity>

			{/* Add the followers/following popups */}
			{userProfile && (
				<>
					<FollowersFollowingPopup
						visible={showFollowersPopup}
						userId={userProfile.id}
						onClose={() => setShowFollowersPopup(false)}
						initialTab="followers"
					/>
					<FollowersFollowingPopup
						visible={showFollowingPopup}
						userId={userProfile.id}
						onClose={() => setShowFollowingPopup(false)}
						initialTab="following"
					/>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	statusBarBackground: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 101, // Higher than the header
	},
	fixedHeader: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 100,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 3,
	},
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
		// Remove any top padding from the scroll view itself
		paddingTop: 0,
	},
	headerTitle: {
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
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		textAlign: "center",
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingVertical: 16,
	},
	statsItem: {
		alignItems: "center",
		width: "30%",
	},
	statsNumber: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	statsLabel: {
		fontSize: 14,
	},
	statsDivider: {
		width: 1,
		height: 30,
	},
	followButtonContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: "center",
	},
	editProfileButtonInline: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		minWidth: 100,
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "600",
	},
	floatingActionButton: {
		position: "absolute",
		right: 16,
		width: 56,
		height: 56,
		borderRadius: 28,
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
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		padding: 50,
	},
	emptyText: {
		fontSize: 16,
	},
	headerTouchArea: {
		width: "100%",
		cursor: "pointer", // Add cursor pointer for web
	},
	headerContent: {
		position: "relative", // For positioning the indicator
	},
});
