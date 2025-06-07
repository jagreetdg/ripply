import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { VoiceNotesList } from "../../components/profile/voice-notes-list/VoiceNotesList";
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
import { useTheme } from "../../context/ThemeContext";
import { FollowButton } from "../../components/profile/FollowButton";
import { FollowersFollowingPopup } from "../../components/profile/FollowersFollowingPopup";

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
	audio_url: string;
	created_at: string;
	likes: number;
	comments: number;
	plays: number;
	shares: number;
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	is_shared?: boolean;
	shared_at?: string;
	shared_by?: {
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
		// If it\'s an object with count property
		if (typeof plays.count === "number") {
			return plays.count;
		}

		// If it\'s an array of objects with count
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
	const { colors, isDarkMode } = useTheme();
	const [refreshing, setRefreshing] = useState(false);
	const { user: currentUser } = useUser();
	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [isOwnProfile, setIsOwnProfile] = useState(false);
	const [sharedVoiceNotes, setSharedVoiceNotes] = useState<VoiceNote[]>([]);
	const [loadingShared, setLoadingShared] = useState(false);
	const [combinedVoiceNotes, setCombinedVoiceNotes] = useState<VoiceNote[]>([]);
	const [loadingVoiceNotes, setLoadingVoiceNotes] = useState(true);

	// Replace the single popup state with separate states
	const [showFollowersPopup, setShowFollowersPopup] = useState(false);
	const [showFollowingPopup, setShowFollowingPopup] = useState(false);

	// Add a ref for the ScrollView to enable scrolling to top programmatically
	const scrollViewRef = useRef<ScrollView>(null);

	// No longer need tab state as we're combining voice notes and shared notes

	// Removed tab container as we're combining voice notes and shared notes

	// Add a reference to track if we've just opened a modal
	const recentlyOpenedModalRef = useRef(false);

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
			console.log("Profile: Fetching user data for username:", username);
			setLoadingVoiceNotes(true); // Set loading to true immediately when username changes
			fetchUserData();
		}
	}, [username]);

	// Add effect to refresh when current user changes (e.g., after profile update)
	useEffect(() => {
		if (username && currentUser) {
			console.log(
				"[PROFILE PAGE] Current user changed, refreshing profile data"
			);
			console.log("[PROFILE PAGE] Current user details:", {
				id: currentUser.id,
				username: currentUser.username,
				display_name: currentUser.display_name,
			});
			console.log("[PROFILE PAGE] Profile username:", username);
			fetchUserData();
		}
	}, [currentUser?.username, currentUser?.id]);

	useEffect(() => {
		if (currentUser && userProfile) {
			const isOwner =
				currentUser.username === userProfile.username ||
				currentUser.id === userProfile.id;
			console.log("[PROFILE PAGE] 🔍 Profile ownership check:", {
				currentUserUsername: currentUser.username,
				currentUserId: currentUser.id,
				profileUsername: userProfile.username,
				profileId: userProfile.id,
				usernameMatch: currentUser.username === userProfile.username,
				idMatch: currentUser.id === userProfile.id,
				isOwner,
				previousIsOwnProfile: isOwnProfile,
			});

			if (isOwner !== isOwnProfile) {
				console.log(
					"[PROFILE PAGE] 🔄 Ownership status changed from",
					isOwnProfile,
					"to",
					isOwner
				);
			}

			setIsOwnProfile(isOwner);
		} else {
			console.log("[PROFILE PAGE] ⚠️ Missing data for ownership check:", {
				hasCurrentUser: !!currentUser,
				hasUserProfile: !!userProfile,
			});
		}
	}, [currentUser, userProfile]);

	const fetchUserData = async () => {
		setLoading(true);
		setLoadingVoiceNotes(true);

		try {
			// Reset user not found state
			setUserNotFound(false);

			// Attempt to fetch user profile by username
			const userProfileResponse = (await getUserProfileByUsername(
				username
			)) as unknown as UserProfile;

			if (userProfileResponse && !("error" in userProfileResponse)) {
				// Set user profile data
				setUserProfile(userProfileResponse);

				// Check if this is the current user's profile using both username and ID
				if (currentUser) {
					const isOwner =
						currentUser.username === userProfileResponse.username ||
						currentUser.id === userProfileResponse.id;
					console.log("[DEBUG] Initial profile ownership check:", {
						currentUserUsername: currentUser.username,
						currentUserId: currentUser.id,
						profileUsername: userProfileResponse.username,
						profileId: userProfileResponse.id,
						isOwner,
					});
					setIsOwnProfile(isOwner);
				} else {
					setIsOwnProfile(false);
				}

				// Attempt to fetch voice bio
				const voiceBioResponse = (await getVoiceBio(
					userProfileResponse.id
				)) as unknown as VoiceBio;
				if (voiceBioResponse && !("error" in voiceBioResponse)) {
					setVoiceBio(voiceBioResponse);
				}

				// Fetch follower and following counts
				try {
					const followerCountResponse = await getFollowerCount(
						userProfileResponse.id
					);
					if (typeof followerCountResponse === "number") {
						setFollowerCount(followerCountResponse);
					}

					const followingCountResponse = await getFollowingCount(
						userProfileResponse.id
					);
					if (typeof followingCountResponse === "number") {
						setFollowingCount(followingCountResponse);
					}
				} catch (error) {
					console.error("Error fetching follow counts:", error);
				}

				// Fetch user's voice notes
				try {
					console.log(
						"Profile: Starting to fetch voice notes for user:",
						userProfileResponse.id
					);
					// Always set loading to true before any API calls
					setLoadingVoiceNotes(true);

					// Fetching voice notes
					const voiceNotesResponse = (await getUserVoiceNotes(
						userProfileResponse.id
					)) as unknown as VoiceNote[];
					setVoiceNotes(voiceNotesResponse);
					console.log(
						"Profile: Fetched user voice notes:",
						voiceNotesResponse?.length || 0
					);

					// Fetching shared voice notes
					const sharedVoiceNotesResponse = (await getUserSharedVoiceNotes(
						userProfileResponse.id
					)) as unknown as VoiceNote[];
					setSharedVoiceNotes(sharedVoiceNotesResponse);
					console.log(
						"Profile: Fetched shared voice notes:",
						sharedVoiceNotesResponse?.length || 0
					);

					// Combine both types of voice notes
					const combinedNotes = [
						// Regular voice notes (original posts)
						...(voiceNotesResponse || []).map((note: any) => ({
							...note,
							is_shared: false,
							currentUserHasShared: false,
						})),
						// Reposted voice notes
						...(sharedVoiceNotesResponse || []).map((note: any) => ({
							...note,
							is_shared: true, // Mark as a repost
							currentUserHasShared: true, // If it's in the shared list, the user has reposted it
						})),
					];

					// Sort by date, latest first
					combinedNotes.sort((a: any, b: any) => {
						const dateA = new Date(
							a.is_shared && a.shared_at ? a.shared_at : a.created_at
						);
						const dateB = new Date(
							b.is_shared && b.shared_at ? b.shared_at : b.created_at
						);
						return dateB.getTime() - dateA.getTime();
					});

					// Update the voice notes state - but keep loading true for at least 500ms
					// to ensure loading animation is visible to the user
					console.log(
						"Profile: Setting combinedVoiceNotes with",
						combinedNotes.length,
						"notes"
					);
					setCombinedVoiceNotes(combinedNotes);

					// Always add a small delay to show loading state, even if we have notes
					setTimeout(() => {
						console.log(
							"Profile: Setting loadingVoiceNotes to FALSE after delay"
						);
						setLoadingVoiceNotes(false);
					}, 800);
				} catch (error) {
					console.error("Error fetching voice notes:", error);
					console.log(
						"Profile: Setting combinedVoiceNotes to empty array due to error"
					);
					setCombinedVoiceNotes([]);

					// Set loading to false after a short delay to show loading animation
					console.log(
						"Profile: Keeping loadingVoiceNotes TRUE for delay after error"
					);
					setTimeout(() => {
						console.log(
							"Profile: Setting loadingVoiceNotes to FALSE after error delay"
						);
						setLoadingVoiceNotes(false);
					}, 800);
				}
			} else {
				// User not found
				console.error("User not found");
				setUserNotFound(true);
				setCombinedVoiceNotes([]);

				// Set loading to false after a short delay to show loading animation
				setTimeout(() => {
					setLoadingVoiceNotes(false);
				}, 1500);
			}
		} catch (error: any) {
			// Check if this is a user not found error
			console.error("Error fetching user data:", error);
			if (error.message?.includes("not found") || error.statusCode === 404) {
				setUserNotFound(true);
			}
			setCombinedVoiceNotes([]);

			// Set loading to false after a short delay to show loading animation
			setTimeout(() => {
				setLoadingVoiceNotes(false);
			}, 1500);
		} finally {
			setLoading(false);
		}
	};

	// Update handlers for showing followers and following popups with better safety
	const handleFollowersPress = useCallback(() => {
		// Prevent repeated opening attempts
		if (recentlyOpenedModalRef.current) {
			console.log("[PROFILE] Ignoring rapid follower modal open attempt");
			return;
		}

		console.log("[PROFILE] Opening followers popup");
		recentlyOpenedModalRef.current = true;

		// Clear followers first to ensure a clean render
		if (mounted.current && showFollowingPopup) {
			setShowFollowingPopup(false);
		}

		// Use setTimeout to ensure clean state updates
		setTimeout(() => {
			if (mounted.current) {
				setShowFollowersPopup(true);

				// Reset the recently opened flag after a delay
				setTimeout(() => {
					recentlyOpenedModalRef.current = false;
				}, 1000);
			}
		}, 50);
	}, [showFollowingPopup]);

	const handleFollowingPress = useCallback(() => {
		// Prevent repeated opening attempts
		if (recentlyOpenedModalRef.current) {
			console.log("[PROFILE] Ignoring rapid following modal open attempt");
			return;
		}

		console.log("[PROFILE] Opening following popup");
		recentlyOpenedModalRef.current = true;

		// Clear followers first to ensure a clean render
		if (mounted.current && showFollowersPopup) {
			setShowFollowersPopup(false);
		}

		// Use setTimeout to ensure clean state updates
		setTimeout(() => {
			if (mounted.current) {
				setShowFollowingPopup(true);

				// Reset the recently opened flag after a delay
				setTimeout(() => {
					recentlyOpenedModalRef.current = false;
				}, 1000);
			}
		}, 50);
	}, [showFollowersPopup]);

	const handleCloseFollowersPopup = useCallback(() => {
		console.log("[PROFILE] Closing followers popup");
		setShowFollowersPopup(false);
	}, []);

	const handleCloseFollowingPopup = useCallback(() => {
		console.log("[PROFILE] Closing following popup");
		setShowFollowingPopup(false);
	}, []);

	// Add a mounted ref to track component lifecycle
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

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
				<Text
					style={[
						styles.loadingText,
						{ color: colors.textSecondary, marginTop: 12 },
					]}
				>
					Loading profile...
				</Text>
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
					{
						height: insets.top,
						backgroundColor: colors.background,
					},
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
						shadowColor: colors.shadow,
						// Remove the solid background to allow BlurView to work
					},
				]}
			>
				{/* Status bar spacer */}
				<View style={{ height: insets.top }} />
				{/* Collapsed header with scroll-to-top functionality */}
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
					onHeaderPress={handleHeaderPress} // Pass scroll-to-top handler
				/>
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
				<View
					style={[
						styles.statsContainer,
						{ backgroundColor: colors.background },
					]}
				>
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
					<View
						style={[
							styles.followButtonContainer,
							{ backgroundColor: colors.background },
						]}
					>
						<TouchableOpacity
							style={[
								styles.editProfileButtonInline,
								{ backgroundColor: "#7B3DD2" },
							]}
							onPress={() => router.push("/profile/edit")}
						>
							<Text style={[styles.buttonText, { color: colors.white }]}>
								Edit Profile
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View
						style={[
							styles.followButtonContainer,
							{ backgroundColor: colors.background },
						]}
					>
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

				{loading ? (
					<View
						style={[
							styles.loadingContainer,
							{ backgroundColor: colors.background },
						]}
					>
						<ActivityIndicator size="large" color={colors.tint} />
						<Text
							style={[
								styles.loadingText,
								{ color: colors.textSecondary, marginTop: 12 },
							]}
						>
							Loading profile...
						</Text>
					</View>
				) : (
					// Always use VoiceNotesList which has its own proper loading states
					<>
						{/* Add logging using a self-executing function */}
						{(() => {
							console.log("Profile: Passing to VoiceNotesList:", {
								voiceNotesCount: combinedVoiceNotes.length,
								loadingNotesValue: loadingVoiceNotes,
							});
							return null;
						})()}
						<VoiceNotesList
							userId={userProfile.id}
							username={userProfile.username}
							displayName={userProfile.display_name}
							voiceNotes={combinedVoiceNotes}
							onRefresh={handleRefresh}
							showRepostAttribution={true}
							isOwnProfile={isOwnProfile}
							loadingNotes={loadingVoiceNotes}
						/>
					</>
				)}
			</Animated.ScrollView>

			{/* Floating action button for creating voice note */}
			<TouchableOpacity
				style={[
					styles.floatingActionButton,
					{
						bottom: insets.bottom + 16,
						backgroundColor: colors.tint,
						shadowColor: colors.shadow,
					},
				]}
				onPress={() => router.push("/create")}
			>
				<Feather name="mic" size={24} color={colors.white} />
			</TouchableOpacity>

			{/* Render modals only when they are needed */}
			{userProfile && showFollowersPopup && (
				<FollowersFollowingPopup
					key={`followers-popup-${userProfile.id}`}
					visible={showFollowersPopup}
					userId={userProfile.id}
					onClose={handleCloseFollowersPopup}
					initialTab="followers"
				/>
			)}
			{userProfile && showFollowingPopup && (
				<FollowersFollowingPopup
					key={`following-popup-${userProfile.id}`}
					visible={showFollowingPopup}
					userId={userProfile.id}
					onClose={handleCloseFollowingPopup}
					initialTab="following"
				/>
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
		zIndex: 9, // Just below the header
	},
	fixedHeader: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 10,
		// Improved shadow for semi-translucent header
		shadowOffset: { width: 0, height: 1 },
		shadowRadius: 3,
		shadowOpacity: 0.2,
		elevation: 4,
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
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		zIndex: 1000,
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
	loadingText: {
		fontSize: 14,
	},
	// Removed tab container styles as we're combining voice notes and shared notes
});
