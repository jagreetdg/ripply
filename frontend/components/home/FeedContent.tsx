import React, { useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	TouchableOpacity,
	RefreshControl,
	ScrollView,
	Platform,
	useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard";
import { useTheme } from "../../context/ThemeContext";
import { FeedItem } from "../../hooks/useFeedData";

// Define a constant for header height to match the one in home.tsx
const HEADER_HEIGHT = 60;

interface FeedContentProps {
	feedItems: FeedItem[];
	loading: boolean;
	error: string | null;
	refreshing: boolean;
	onRefresh: () => Promise<void>;
	onUserProfilePress: (userId: string, username?: string) => void;
	onPlayVoiceNote: (voiceNoteId: string, userId: string) => Promise<void>;
	scrollViewRef: React.RefObject<ScrollView>;
	onScroll: any; // Animated.event type
	diagnosticData: any;
	contentInsetTop?: number; // Add optional prop for content inset
}

export function FeedContent({
	feedItems,
	loading,
	error,
	refreshing,
	onRefresh,
	onUserProfilePress,
	onPlayVoiceNote,
	scrollViewRef,
	onScroll,
	diagnosticData,
	contentInsetTop, // Add to props
}: FeedContentProps) {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height } = useWindowDimensions();

	// Calculate the padding needed to account for the header
	// Use contentInsetTop if provided, otherwise calculate default
	const headerPadding =
		contentInsetTop !== undefined
			? contentInsetTop
			: HEADER_HEIGHT + insets.top;

	// Render content with appropriate padding
	const renderContent = () => {
		if (loading) {
			return (
				<View
					style={[
						styles.loadingContainer,
						{ backgroundColor: colors.background, paddingTop: headerPadding },
					]}
				>
					<ActivityIndicator size="large" color={colors.tint} />
					<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
						Loading voice notes...
					</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View
					style={[
						styles.errorContainer,
						{ backgroundColor: colors.background, paddingTop: headerPadding },
					]}
				>
					<Text style={[styles.errorText, { color: colors.error }]}>
						{error}
					</Text>
					<TouchableOpacity
						style={[styles.retryButton, { backgroundColor: colors.tint }]}
						onPress={onRefresh}
					>
						<Text style={[styles.retryButtonText, { color: colors.white }]}>
							Retry
						</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (feedItems.length === 0) {
			return (
				<View
					style={[
						styles.emptyContainer,
						{ backgroundColor: colors.background, paddingTop: headerPadding },
					]}
				>
					<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
						{diagnosticData?.summary?.isFollowingAnyone === false
							? "Your feed is empty because you're not following anyone yet."
							: "No voice notes found. Check back later for new content."}
					</Text>

					{diagnosticData?.summary?.isFollowingAnyone === false && (
						<TouchableOpacity
							style={[styles.discoverButton, { backgroundColor: colors.tint }]}
							onPress={() => router.push("/(tabs)/search")}
						>
							<Text style={[styles.discoverButtonText, { color: colors.card }]}>
								Discover Users
							</Text>
						</TouchableOpacity>
					)}
				</View>
			);
		}

		return (
			<View style={styles.feedContent}>
				{feedItems.map((item) => (
					<View key={item.id} style={styles.feedItem}>
						<VoiceNoteCard
							voiceNote={{
								id: item.voiceNote.id,
								duration: item.voiceNote.duration,
								title: item.voiceNote.title,
								likes: item.voiceNote.likes,
								comments: item.voiceNote.comments,
								plays: item.voiceNote.plays,
								shares: item.voiceNote.shares,
								backgroundImage: item.voiceNote.backgroundImage,
								tags: item.voiceNote.tags,
								users: item.voiceNote.users,
							}}
							userId={item.userId}
							displayName={item.displayName}
							username={item.username}
							userAvatarUrl={item.userAvatar}
							timePosted={item.timePosted}
							isShared={item.isShared}
							sharedBy={item.sharedBy}
							showRepostAttribution={true}
							onUserProfilePress={() =>
								onUserProfilePress(item.userId, item.username)
							}
							onPlayPress={() =>
								onPlayVoiceNote(item.voiceNote.id, item.userId)
							}
						/>
					</View>
				))}
			</View>
		);
	};

	return (
		<ScrollView
			ref={scrollViewRef}
			style={[styles.scrollView, { backgroundColor: colors.background }]}
			contentContainerStyle={[
				styles.scrollContent,
				{ paddingTop: headerPadding, minHeight: height },
			]}
			onScroll={onScroll}
			scrollEventThrottle={16}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					colors={[colors.tint]}
					tintColor={colors.tint}
				/>
			}
		>
			{renderContent()}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
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
		marginBottom: 16,
	},
	retryButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
	},
	retryButtonText: {
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
		textAlign: "center",
	},
	discoverButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		marginTop: 10,
	},
	discoverButtonText: {
		fontWeight: "bold",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	feedContent: {
		padding: 0,
	},
	feedItem: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
});
