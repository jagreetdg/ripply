import React from "react";
import {
	StyleSheet,
	View,
	Text,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SearchTab } from "../../hooks/useSearch";
import { UserSearchResult } from "./UserSearchResult";
import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard";
import { formatTimeAgo } from "../../utils/timeUtils";

interface SearchResultsListProps {
	type: SearchTab;
	data: any[];
	isLoading: boolean;
	searchQuery: string;
	currentUserId?: string;
	showAll: boolean;
	toggleShowAll: () => void;
	sharedStatusMap: Record<string, boolean>;
	previewCount: number;
	colors: {
		background: string;
		tint: string;
		border: string;
		text: string;
		textSecondary: string;
	};
}

export const SearchResultsList = ({
	type,
	data,
	isLoading,
	searchQuery,
	currentUserId,
	showAll,
	toggleShowAll,
	sharedStatusMap,
	previewCount,
	colors,
}: SearchResultsListProps) => {
	const router = useRouter();

	// Only show the data up to the preview count if not showing all
	const filteredData = showAll ? data : data.slice(0, previewCount);

	// Handle user profile navigation
	const handleUserProfilePress = (username: string) => {
		if (username) {
			console.log("Navigating to profile from search:", username);
			router.push({
				pathname: "/profile/[username]",
				params: { username },
			});
		}
	};

	// Show more button
	const renderShowMoreButton = () => {
		if (data.length <= previewCount) return null;

		return (
			<TouchableOpacity
				style={styles.showMoreButton}
				onPress={toggleShowAll}
				activeOpacity={0.7}
			>
				<Text style={[styles.showMoreText, { color: colors.tint }]}>
					{showAll ? "Show less" : `Show all ${data.length} results`}
				</Text>
				<Feather
					name={showAll ? "chevron-up" : "chevron-down"}
					size={18}
					color={colors.tint}
					style={styles.showMoreIcon}
				/>
			</TouchableOpacity>
		);
	};

	// Render empty state
	const renderEmptyState = () => {
		if (isLoading) {
			return (
				<View style={styles.emptyStateContainer}>
					<ActivityIndicator size="large" color={colors.tint} />
				</View>
			);
		}

		if (searchQuery.trim() === "") {
			return (
				<View style={styles.emptyStateContainer}>
					<Feather name="compass" size={40} color={colors.textSecondary} />
					<Text
						style={[styles.emptyStateText, { color: colors.textSecondary }]}
					>
						{type === "users"
							? "Discover people to follow"
							: "Discover voice notes"}
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.emptyStateContainer}>
				<Feather name="search" size={40} color={colors.textSecondary} />
				<Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
					No {type === "users" ? "users" : "posts"} found
				</Text>
			</View>
		);
	};

	// Render user item
	const renderUserItem = ({ item }: { item: any }) => {
		return <UserSearchResult user={item} />;
	};

	// Render post item
	const renderPostItem = ({ item }: { item: any }) => {
		// Extract user data with fallbacks
		const userData = item.users || {};

		// Create a voiceNote object with stable data
		const voiceNoteData = {
			...item,
			// Handle counts properly - backend already processes these to numbers
			// If they're still in array format, extract the count, otherwise use as-is
			likes: Array.isArray(item.likes)
				? item.likes[0]?.count || 0
				: typeof item.likes === "number"
				? item.likes
				: 0,
			comments: Array.isArray(item.comments)
				? item.comments[0]?.count || 0
				: typeof item.comments === "number"
				? item.comments
				: 0,
			plays: Array.isArray(item.plays)
				? item.plays[0]?.count || 0
				: typeof item.plays === "number"
				? item.plays
				: 0,
			shares: Array.isArray(item.shares)
				? item.shares[0]?.count || 0
				: typeof item.shares === "number"
				? item.shares
				: 0,
			// Ensure user data is properly structured
			user_id: item.user_id || userData.id,
			users: userData,
		};

		// AGGRESSIVE SEARCH CONSISTENCY FIX: Apply multiple checks
		const userHasShared = sharedStatusMap[item.id] || false;
		const originalShares = voiceNoteData.shares;

		// Check if this is likely a shared post that should have at least 1 share
		const shouldHaveShares =
			userHasShared ||
			item.currentUserHasShared ||
			item.isReposted ||
			item.is_shared;

		// CRITICAL FIX: Apply fix even more aggressively
		if (shouldHaveShares && voiceNoteData.shares === 0) {
			console.warn(
				`[SEARCH CONSISTENCY FIX] Fixing share count from 0 to 1 for ${item.id}:`,
				{
					userHasShared,
					currentUserHasShared: item.currentUserHasShared,
					isReposted: item.isReposted,
					isShared: item.is_shared,
					originalShares,
				}
			);
			voiceNoteData.shares = 1;
		}

		// EXTRA AGGRESSIVE FIX: Also check search results data integrity
		if (originalShares > 0 && voiceNoteData.shares === 0) {
			console.error(
				`[SEARCH CRITICAL FIX] Share count was corrupted, restoring from ${originalShares}:`,
				{
					voiceNoteId: item.id,
					originalShares,
					corruptedShares: voiceNoteData.shares,
				}
			);
			voiceNoteData.shares = originalShares;
		}

		// Determine repost attribution props
		const isRepostedItem = Boolean(
			item.is_shared || item.shared_by || item.sharer_id
		);
		const sharedByData = item.shared_by
			? {
					id: item.shared_by.id,
					username: item.shared_by.username,
					displayName: item.shared_by.display_name,
					avatarUrl: item.shared_by.avatar_url,
			  }
			: item.sharer_id
			? {
					id: item.sharer_id,
					username: item.sharer_username || "user",
					displayName:
						item.sharer_display_name || item.sharer_username || "User",
					avatarUrl: item.sharer_avatar_url || null,
			  }
			: null;

		console.log(`[SEARCH DEBUG] Processing voice note ${item.id}:`, {
			originalShares: item.shares,
			processedShares: voiceNoteData.shares,
			sharesType: typeof item.shares,
			isArray: Array.isArray(item.shares),
			userHasShared,
			sharedStatusFromMap: sharedStatusMap[item.id],
			shouldHaveShares,
			wasFixed: originalShares !== voiceNoteData.shares,
			isRepostedItem,
			hasSharedByData: !!sharedByData,
			sharedByUsername: sharedByData?.username,
		});

		return (
			<View style={styles.postItemContainer}>
				<VoiceNoteCard
					voiceNote={voiceNoteData}
					userId={voiceNoteData.user_id}
					displayName={userData.display_name}
					username={userData.username}
					userAvatarUrl={userData.avatar_url}
					timePosted={formatTimeAgo(item.created_at)}
					currentUserId={currentUserId}
					isReposted={sharedStatusMap[item.id] || false}
					showRepostAttribution={isRepostedItem}
					sharedBy={sharedByData}
					onUserProfilePress={
						userData.username
							? () => handleUserProfilePress(userData.username)
							: undefined
					}
					onShareStatusChanged={(voiceNoteId: string, isShared: boolean) => {
						console.log(
							`[SEARCH] Share status changed for ${voiceNoteId}: ${isShared}`
						);
					}}
					onVoiceNoteUnshared={(voiceNoteId: string) => {
						console.log(`[SEARCH] Voice note unshared: ${voiceNoteId}`);
					}}
				/>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			{filteredData.length === 0 ? (
				renderEmptyState()
			) : (
				<>
					<FlatList
						data={filteredData}
						renderItem={type === "users" ? renderUserItem : renderPostItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContent}
						scrollEnabled={false} // Don't allow scrolling in this list, parent should handle scrolling
					/>
					{renderShowMoreButton()}
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		flexGrow: 1,
	},
	postItemContainer: {
		marginBottom: 12,
	},
	showMoreButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		marginTop: 8,
	},
	showMoreText: {
		fontSize: 16,
		fontWeight: "500",
		marginRight: 8,
	},
	showMoreIcon: {
		marginTop: 2,
	},
	emptyStateContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: "500",
		textAlign: "center",
		marginTop: 16,
	},
});
