import React, { useRef, useCallback, useState, useEffect } from "react";
import { useLocalSearchParams, Stack } from "expo-router";
import {
	View,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Text,
	Animated,
	RefreshControl,
	TouchableOpacity,
} from "react-native";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { VoiceNotesList } from "../../components/profile/voice-notes-list/VoiceNotesList";
import { UserNotFound } from "../../components/common/UserNotFound";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { FollowersFollowingPopup } from "../../components/profile/FollowersFollowingPopup";
import { useUser } from "../../context/UserContext";
import {
	getUserProfileByUsername,
	getUserVoiceNotes,
	getUserSharedVoiceNotes,
} from "../../services/api";
import ProfileStats from "./components/ProfileStats";
import ProfileActionButton from "./components/ProfileActionButton";
import ProfileFloatingActionButton from "./components/ProfileFloatingActionButton";

export default function ProfileByUsernameScreen() {
	const { colors } = useTheme();
	const params = useLocalSearchParams<{ username: string }>();
	const insets = useSafeAreaInsets();
	const scrollViewRef = useRef<ScrollView>(null);
	const { user: currentUser } = useUser();

	// Profile data state
	const [userProfile, setUserProfile] = useState<any>(null);
	const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [userNotFound, setUserNotFound] = useState(false);
	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [showFollowersPopup, setShowFollowersPopup] = useState(false);
	const [showFollowingPopup, setShowFollowingPopup] = useState(false);
	const [loadingVoiceNotes, setLoadingVoiceNotes] = useState(false);

	// Animation state
	const scrollY = useRef(new Animated.Value(0)).current;
	const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

	// Animation values
	const headerOpacity = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [1, 0],
		extrapolate: "clamp",
	});

	const collapsedHeaderOpacity = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [0, 1],
		extrapolate: "clamp",
	});

	// Computed values
	const isOwnProfile = currentUser?.username === params.username;
	const combinedVoiceNotes = voiceNotes;

	// Load profile data
	const loadProfileData = useCallback(
		async (isRefreshing = false) => {
			if (!params.username) return;

			try {
				if (!isRefreshing) setLoading(true);

				// Load user profile
				const profile = await getUserProfileByUsername(params.username);
				if (!profile) throw new Error("Profile not found");
				setUserProfile(profile);

				// Load follower/following counts separately since they're not in the profile response
				console.log("Loading follower/following counts for user:", profile.id);
				try {
					const [followerCountData, followingCountData] = await Promise.all([
						fetch(
							`https://ripply-backend.onrender.com/api/users/${profile.id}/follower-count`
						).then((res) => res.json()),
						fetch(
							`https://ripply-backend.onrender.com/api/users/${profile.id}/following-count`
						).then((res) => res.json()),
					]);

					console.log("Follower count response:", followerCountData);
					console.log("Following count response:", followingCountData);

					setFollowerCount(followerCountData?.count || 0);
					setFollowingCount(followingCountData?.count || 0);
				} catch (countError) {
					console.error(
						"Error fetching follower/following counts:",
						countError
					);
					// Set to 0 if can't fetch counts
					setFollowerCount(0);
					setFollowingCount(0);
				}

				// Load voice notes and shared notes
				setLoadingVoiceNotes(true);
				const [notes, sharedNotes] = await Promise.all([
					getUserVoiceNotes(profile.id),
					getUserSharedVoiceNotes(profile.id),
				]);

				// Combine and sort by creation time (shared notes by shared_at, regular by created_at)
				const allNotes = [...notes, ...sharedNotes].sort((a, b) => {
					const dateA =
						a.is_shared && a.shared_at
							? new Date(a.shared_at)
							: new Date(a.created_at);
					const dateB =
						b.is_shared && b.shared_at
							? new Date(b.shared_at)
							: new Date(b.created_at);
					return dateB.getTime() - dateA.getTime(); // Newest first
				});

				setVoiceNotes(allNotes);
				setLoadingVoiceNotes(false);

				setUserNotFound(false);
			} catch (error) {
				console.error("Error loading profile:", error);
				setUserNotFound(true);
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[params.username]
	);

	// Handle refresh
	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		await loadProfileData(true);
	}, [loadProfileData]);

	// Update follower count
	const updateFollowerCount = useCallback(
		(isFollowing: boolean, updatedCount?: number) => {
			if (updatedCount !== undefined) {
				setFollowerCount(updatedCount);
			} else {
				setFollowerCount((prev) => (isFollowing ? prev + 1 : prev - 1));
			}
		},
		[]
	);

	// Load data on mount
	useEffect(() => {
		loadProfileData();
	}, [loadProfileData]);

	// Create profileData and animations objects for compatibility
	const profileData = {
		userProfile,
		voiceNotes,
		loading,
		refreshing,
		userNotFound,
		followerCount,
		followingCount,
		showFollowersPopup,
		showFollowingPopup,
		loadingVoiceNotes,
		isOwnProfile,
		combinedVoiceNotes,
		handleRefresh,
		updateFollowerCount,
		setShowFollowersPopup,
		setShowFollowingPopup,
		setIsHeaderCollapsed,
	};

	const animations = {
		scrollY,
		headerOpacity,
		collapsedHeaderOpacity,
	};

	// Handler for the header click that scrolls to top
	const handleHeaderPress = useCallback(() => {
		if (scrollViewRef.current) {
			scrollViewRef.current.scrollTo({ y: 0, animated: true });
		}
	}, []);

	// Popup handlers
	const handleFollowersPress = useCallback(() => {
		console.log("[PROFILE] Opening followers popup");
		profileData.setShowFollowersPopup(true);
	}, [profileData.setShowFollowersPopup]);

	const handleFollowingPress = useCallback(() => {
		console.log("[PROFILE] Opening following popup");
		profileData.setShowFollowingPopup(true);
	}, [profileData.setShowFollowingPopup]);

	const handleCloseFollowersPopup = useCallback(() => {
		console.log("[PROFILE] Closing followers popup");
		profileData.setShowFollowersPopup(false);
	}, [profileData.setShowFollowersPopup]);

	const handleCloseFollowingPopup = useCallback(() => {
		console.log("[PROFILE] Closing following popup");
		profileData.setShowFollowingPopup(false);
	}, [profileData.setShowFollowingPopup]);

	// Loading state
	if (profileData.loading) {
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

	// User not found state
	if (profileData.userNotFound) {
		return <UserNotFound username={params.username || ""} />;
	}

	// Error state
	if (!profileData.userProfile) {
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
			{/* Status bar background */}
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
					headerShown: false,
				}}
			/>

			{/* Collapsed header overlay */}
			<Animated.View
				style={[
					styles.fixedHeader,
					{
						opacity: animations.collapsedHeaderOpacity,
						top: 0,
						shadowColor: colors.shadow,
					},
				]}
			>
				<View style={{ height: insets.top }} />
				<ProfileHeader
					userId={profileData.userProfile.id}
					username={profileData.userProfile.username}
					displayName={profileData.userProfile.display_name}
					avatarUrl={profileData.userProfile.avatar_url}
					coverPhotoUrl={profileData.userProfile.cover_photo_url}
					bio={profileData.userProfile.bio || undefined}
					isVerified={profileData.userProfile.is_verified}
					isCollapsed={true}
					postCount={profileData.voiceNotes.length}
					isOwnProfile={profileData.isOwnProfile}
					onHeaderPress={handleHeaderPress}
				/>
			</Animated.View>

			{/* Main scroll view */}
			<Animated.ScrollView
				ref={scrollViewRef}
				style={[styles.scrollView, { backgroundColor: colors.background }]}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: animations.scrollY } } }],
					{ useNativeDriver: false }
				)}
				scrollEventThrottle={8}
				refreshControl={
					<RefreshControl
						refreshing={profileData.refreshing}
						onRefresh={profileData.handleRefresh}
						tintColor={colors.tint}
						colors={[colors.tint]}
					/>
				}
			>
				{/* Expanded header */}
				<Animated.View style={{ opacity: animations.headerOpacity }}>
					<View style={{ paddingTop: insets.top }} />
					<ProfileHeader
						userId={profileData.userProfile.id}
						username={profileData.userProfile.username}
						displayName={profileData.userProfile.display_name}
						avatarUrl={profileData.userProfile.avatar_url}
						coverPhotoUrl={profileData.userProfile.cover_photo_url}
						bio={profileData.userProfile.bio || undefined}
						isVerified={profileData.userProfile.is_verified}
						isCollapsed={false}
						postCount={profileData.voiceNotes.length}
						isOwnProfile={profileData.isOwnProfile}
					/>
				</Animated.View>

				{/* Stats */}
				<ProfileStats
					followerCount={followerCount}
					voiceNotesCount={voiceNotes.length}
					followingCount={followingCount}
					onFollowersPress={() => setShowFollowersPopup(true)}
					onFollowingPress={() => setShowFollowingPopup(true)}
				/>

				{/* Action button */}
				<ProfileActionButton
					isOwnProfile={profileData.isOwnProfile}
					userId={profileData.userProfile.id}
					onFollowChange={profileData.updateFollowerCount}
				/>

				{/* Voice notes list */}
				<VoiceNotesList
					userId={profileData.userProfile.id}
					username={profileData.userProfile.username}
					displayName={profileData.userProfile.display_name}
					voiceNotes={profileData.combinedVoiceNotes}
					onRefresh={profileData.handleRefresh}
					showRepostAttribution={true}
					isOwnProfile={profileData.isOwnProfile}
					loadingNotes={profileData.loadingVoiceNotes}
				/>
			</Animated.ScrollView>

			{/* Floating action button */}
			<ProfileFloatingActionButton />

			{/* Modals */}
			{profileData.userProfile && profileData.showFollowersPopup && (
				<FollowersFollowingPopup
					key={`followers-popup-${profileData.userProfile.id}`}
					visible={profileData.showFollowersPopup}
					userId={profileData.userProfile.id}
					onClose={handleCloseFollowersPopup}
					initialTab="followers"
				/>
			)}
			{profileData.userProfile && profileData.showFollowingPopup && (
				<FollowersFollowingPopup
					key={`following-popup-${profileData.userProfile.id}`}
					visible={profileData.showFollowingPopup}
					userId={profileData.userProfile.id}
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
		zIndex: 9,
	},
	fixedHeader: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 10,
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
		paddingTop: 0,
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
	loadingText: {
		fontSize: 14,
	},
});
