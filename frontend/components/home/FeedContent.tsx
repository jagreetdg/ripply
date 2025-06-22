import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	TouchableOpacity,
	RefreshControl,
	FlatList,
	Platform,
	useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard";
import { useTheme } from "../../context/ThemeContext";
import { FeedItem } from "../../hooks/useFeedData";
import { useUser } from "../../context/UserContext";

// Define a constant for header height to match the one in home.tsx
const HEADER_HEIGHT = 60;

interface FeedContentProps {
	feedItems: FeedItem[];
	loading: boolean;
	loadingMore: boolean;
	hasMoreData: boolean;
	error: string | null;
	refreshing: boolean;
	onRefresh: () => Promise<void>;
	onLoadMore: () => Promise<void>;
	onUserProfilePress: (userId: string, username?: string) => void;
	onPlayVoiceNote: (voiceNoteId: string, userId: string) => Promise<void>;
	flatListRef: React.RefObject<FlatList>;
	onScroll: any; // Animated.event type
	diagnosticData: any;
	contentInsetTop?: number; // Add optional prop for content inset
}

export function FeedContent({
	feedItems,
	loading,
	loadingMore,
	hasMoreData,
	error,
	refreshing,
	onRefresh,
	onLoadMore,
	onUserProfilePress,
	onPlayVoiceNote,
	flatListRef,
	onScroll,
	diagnosticData,
	contentInsetTop, // Add to props
}: FeedContentProps) {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height } = useWindowDimensions();
	const { user: currentUser } = useUser();

	// Development debugging for feed items
	useEffect(() => {
		if (__DEV__ && feedItems.length > 0) {
			// Check for duplicate IDs in the feed
			const ids = feedItems.map((item) => item.id);
			const uniqueIds = new Set(ids);
			if (ids.length !== uniqueIds.size) {
				console.error(
					`[DEBUG] DUPLICATE KEYS DETECTED! Total items: ${ids.length}, Unique IDs: ${uniqueIds.size}`
				);
			}
		}
	}, [feedItems]);

	// Note: Removed sharedStatusMap state and the performance-heavy useEffect
	// that was making individual API calls for each voice note.
	// Each VoiceNoteCard will handle its own repost status via useVoiceNoteCard hook.

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

		// This will be handled by FlatList
		return null;
	};

	// Handle share status change - no longer needed to maintain local state
	// Each VoiceNoteCard manages its own state via useVoiceNoteCard hook
	const handleShareStatusChanged = useCallback(
		(voiceNoteId: string, isShared: boolean) => {
			if (__DEV__) {
				console.log(
					`[FEED] Share status changed for ${voiceNoteId}: ${isShared}`
				);
			}
		},
		[]
	);

	// Handle voice note unshared - no longer needed to maintain local state
	const handleVoiceNoteUnshared = useCallback((voiceNoteId: string) => {
		if (__DEV__) {
			console.log(`[FEED] Voice note unshared: ${voiceNoteId}`);
		}
	}, []);

	// Render individual feed item for FlatList
	const renderFeedItem = useCallback(
		({ item }: { item: FeedItem }) => (
			<View style={styles.feedItem}>
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
					currentUserId={currentUser?.id}
					sharedBy={item.sharedBy}
					showRepostAttribution={item.isShared === true}
					onUserProfilePress={() =>
						onUserProfilePress(item.userId, item.username)
					}
					onPlayPress={() => onPlayVoiceNote(item.voiceNote.id, item.userId)}
					onShareStatusChanged={handleShareStatusChanged}
					onVoiceNoteUnshared={handleVoiceNoteUnshared}
				/>
			</View>
		),
		[
			onUserProfilePress,
			onPlayVoiceNote,
			currentUser?.id,
			handleShareStatusChanged,
			handleVoiceNoteUnshared,
		]
	);

	// Render footer loading indicator for infinite scroll
	const renderFooter = useCallback(() => {
		if (!loadingMore) return null;

		return (
			<View style={styles.footerLoader}>
				<ActivityIndicator size="small" color={colors.tint} />
				<Text style={[styles.footerText, { color: colors.textSecondary }]}>
					Loading more...
				</Text>
			</View>
		);
	}, [loadingMore, colors.tint, colors.textSecondary]);

	// Handle end reached for infinite scroll
	const handleEndReached = useCallback(() => {
		if (hasMoreData && !loadingMore) {
			console.log("[INFINITE_SCROLL] Reached end, loading more...");
			onLoadMore();
		}
	}, [hasMoreData, loadingMore, onLoadMore]);

	// If there's an error or no data, use the old approach
	if (loading || error || feedItems.length === 0) {
		return (
			<View style={[styles.scrollView, { backgroundColor: colors.background }]}>
				<View
					style={[
						styles.scrollContent,
						{ paddingTop: headerPadding, minHeight: height },
					]}
				>
					{renderContent()}
				</View>
			</View>
		);
	}

	// Use FlatList for infinite scrolling with data
	return (
		<FlatList
			ref={flatListRef}
			data={feedItems}
			renderItem={renderFeedItem}
			keyExtractor={(item) => item.id}
			style={[styles.scrollView, { backgroundColor: colors.background }]}
			contentContainerStyle={{ paddingTop: headerPadding }}
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
			onEndReached={handleEndReached}
			onEndReachedThreshold={0.1} // Trigger when 10% from bottom
			ListFooterComponent={renderFooter}
			removeClippedSubviews={true} // Performance optimization
			maxToRenderPerBatch={10} // Performance optimization
			windowSize={10} // Performance optimization
		/>
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
	footerLoader: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 20,
	},
	footerText: {
		marginLeft: 10,
		fontSize: 14,
	},
});
