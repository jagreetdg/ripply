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
import { checkShareStatus } from "../../services/api";
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

	// Add logging to debug feed items
	useEffect(() => {
		if (feedItems.length > 0) {
			console.log(`[DEBUG] FeedContent received ${feedItems.length} items`);

			// Check for original vs shared posts
			const sharedItems = feedItems.filter((item) => item.isShared === true);
			const originalItems = feedItems.filter((item) => item.isShared === false);

			console.log(
				`[DEBUG] Feed breakdown - Original: ${originalItems.length}, Shared: ${sharedItems.length}`
			);

			if (originalItems.length === 0) {
				console.log("[DEBUG] WARNING: No original posts in feed!");
			}

			// Log a sample of each type if available
			if (originalItems.length > 0) {
				console.log(
					"[DEBUG] Sample original post:",
					originalItems[0].id,
					originalItems[0].userId,
					originalItems[0].isShared
				);
			}

			if (sharedItems.length > 0) {
				console.log(
					"[DEBUG] Sample shared post:",
					sharedItems[0].id,
					sharedItems[0].userId,
					sharedItems[0].isShared
				);
			}
		}
	}, [feedItems]);

	// Add state to track which voice notes the current user has shared
	const [sharedStatusMap, setSharedStatusMap] = useState<
		Record<string, boolean>
	>({});

	// Fetch share status for all voice notes
	useEffect(() => {
		const checkShareStatuses = async () => {
			if (!currentUser?.id || feedItems.length === 0) return;

			console.log(`Checking share status for ${feedItems.length} feed items`);
			const statusMap: Record<string, boolean> = {};

			// Check each voice note
			for (const item of feedItems) {
				try {
					const isShared = await checkShareStatus(
						item.voiceNote.id,
						currentUser.id
					);
					statusMap[item.voiceNote.id] = isShared;
					console.log(
						`Voice note ${item.voiceNote.id} is shared by current user: ${isShared}`
					);
				} catch (error) {
					console.error(
						`Error checking share status for ${item.voiceNote.id}:`,
						error
					);
					statusMap[item.voiceNote.id] = false;
				}
			}

			setSharedStatusMap(statusMap);
		};

		checkShareStatuses();
	}, [feedItems, currentUser?.id]);

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
					isShared={sharedStatusMap[item.voiceNote.id] || false}
					sharedBy={item.sharedBy}
					showRepostAttribution={item.isShared === true}
					onUserProfilePress={() =>
						onUserProfilePress(item.userId, item.username)
					}
					onPlayPress={() => onPlayVoiceNote(item.voiceNote.id, item.userId)}
				/>
			</View>
		),
		[sharedStatusMap, onUserProfilePress, onPlayVoiceNote]
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
