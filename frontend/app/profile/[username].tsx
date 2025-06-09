import React, { useRef, useCallback } from "react";
import { useLocalSearchParams, Stack } from "expo-router";
import {
	View,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Text,
	Animated,
	RefreshControl,
} from "react-native";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { VoiceNotesList } from "../../components/profile/voice-notes-list/VoiceNotesList";
import { UserNotFound } from "../../components/common/UserNotFound";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { FollowersFollowingPopup } from "../../components/profile/FollowersFollowingPopup";
import { useProfileData } from "./hooks/useProfileData";
import { useProfileAnimations } from "./hooks/useProfileAnimations";
import {
	ProfileStats,
	ProfileActionButton,
	ProfileFloatingActionButton,
} from "./components";

export default function ProfileByUsernameScreen() {
	const { colors } = useTheme();
	const params = useLocalSearchParams<{ username: string }>();
	const insets = useSafeAreaInsets();
	const scrollViewRef = useRef<ScrollView>(null);

	// Use custom hooks for data and animations
	const profileData = useProfileData(params.username || "");
	const animations = useProfileAnimations(profileData.setIsHeaderCollapsed);

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

				{/* Stats section */}
				<ProfileStats
					followingCount={profileData.followingCount}
					voiceNotesCount={profileData.voiceNotes.length}
					followerCount={profileData.followerCount}
					onFollowingPress={handleFollowingPress}
					onFollowersPress={handleFollowersPress}
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
