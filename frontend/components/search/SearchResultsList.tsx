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
		// The backend now provides a consistent and complete data structure.
		// We can trust the item and pass it directly with minimal processing.
		const voiceNoteData = {
			...item,
			likes: item.likes || 0,
			comments: item.comments || 0,
			plays: item.plays || 0,
			shares: item.shares || 0,
			tags: item.tags || [],
		};

		const sharedByData = item.shared_by
			? {
					id: item.shared_by.id,
					username: item.shared_by.username,
					displayName: item.shared_by.display_name,
					avatarUrl: item.shared_by.avatar_url,
			  }
			: null;

		return (
			<View style={styles.postItemContainer}>
				<VoiceNoteCard
					voiceNote={voiceNoteData}
					userId={voiceNoteData.user_id}
					displayName={voiceNoteData.users?.display_name}
					username={voiceNoteData.users?.username}
					userAvatarUrl={voiceNoteData.users?.avatar_url}
					timePosted={formatTimeAgo(item.created_at)}
					currentUserId={currentUserId}
					isReposted={voiceNoteData.user_has_shared}
					showRepostAttribution={!!sharedByData}
					sharedBy={sharedByData}
					onUserProfilePress={
						voiceNoteData.users?.username
							? () => handleUserProfilePress(voiceNoteData.users.username)
							: undefined
					}
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
