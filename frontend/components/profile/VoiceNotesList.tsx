import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, RefreshControl, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "./VoiceNoteCard";
import { recordPlay, recordShare } from "../../services/api/voiceNoteService";

// Local implementation of formatRelativeTime
const formatRelativeTime = (date: Date): string => {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return `${diffInSeconds}s ago`;
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 7) {
		return `${diffInDays}d ago`;
	}

	return new Date(date).toLocaleDateString();
};

// Define the VoiceNote interface to match API format
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
	tags?: string[];
	background_image?: string | null;
	backgroundImage?: string | null; // Alternative name for compatibility
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	user_id?: string; // Sometimes included instead of users object
	// Shared information
	is_shared?: boolean;
	shared_at?: string;
	shared_by?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

interface VoiceNotesListProps {
	userId: string;
	username?: string;
	displayName?: string;
	voiceNotes: VoiceNote[];
	onPlayVoiceNote?: (voiceNoteId: string) => void;
	onRefresh?: () => void;
	isSharedList?: boolean;
}

export function VoiceNotesList({
	userId,
	username,
	displayName,
	voiceNotes = [],
	onPlayVoiceNote,
	onRefresh,
	isSharedList = false,
}: VoiceNotesListProps) {
	const router = useRouter();
	// State for refresh control
	const [refreshing, setRefreshing] = useState(false);
	// State for voice notes
	const [localVoiceNotes, setLocalVoiceNotes] =
		useState<VoiceNote[]>(voiceNotes);

	// Use the provided displayName or default to "User"
	const userDisplayName = displayName || "User";

	// Update local state when props change
	useEffect(() => {
		setLocalVoiceNotes(voiceNotes);
	}, [voiceNotes]);

	// Handle refresh
	const handleRefresh = () => {
		if (onRefresh) {
			setRefreshing(true);
			onRefresh();
			setRefreshing(false);
		}
	};

	// Handle play voice note
	const handlePlayVoiceNote = (voiceNoteId: string) => {
		// Call the provided callback if available
		if (onPlayVoiceNote) {
			onPlayVoiceNote(voiceNoteId);
		}

		// Record the play in the backend
		recordPlay(voiceNoteId, userId)
			.then((response: any) => {
				// Update the local state with the new play count
				if (response?.data?.playCount) {
					setLocalVoiceNotes((prev) =>
						prev.map((vn) =>
							vn.id === voiceNoteId
								? { ...vn, plays: response.data.playCount }
								: vn
						)
					);
				}
			})
			.catch((error) => {
				console.error("Error recording play:", error);
			});
	};

	// Handle share voice note
	const handleShareVoiceNote = (voiceNoteId: string) => {
		// Record the share in the backend
		recordShare(voiceNoteId, userId)
			.then((response: any) => {
				// Update the local state with the new share count
				if (typeof response.shareCount === "number") {
					setLocalVoiceNotes((prev) =>
						prev.map((vn) =>
							vn.id === voiceNoteId
								? { ...vn, shares: response.shareCount }
								: vn
						)
					);
				}
			})
			.catch((error) => {
				console.error("Error recording share:", error);
			});
	};

	// Render a voice note card
	const renderVoiceNoteCard = ({ item }: { item: VoiceNote }) => {
		// Calculate time since posting
		const timeAgo = formatRelativeTime(new Date(item.created_at));

		// For shared items, we use the shared timestamp and show who shared it
		const displayTimestamp =
			item.is_shared && item.shared_at
				? formatRelativeTime(new Date(item.shared_at))
				: timeAgo;

		// Get the creator info
		const creatorId = item.users?.id || item.user_id || userId;
		const creatorDisplayName = item.users?.display_name || userDisplayName;
		const creatorUsername = item.users?.username || username || "user";
		const creatorAvatarUrl = item.users?.avatar_url || null;

		// Determine if we should show repost attribution
		const isRepost = isSharedList && item.is_shared;

		// Prepare the voice note with the right properties for VoiceNoteCard
		const normalizedVoiceNote = {
			...item,
			backgroundImage: item.backgroundImage || item.background_image || null,
		};

		return (
			<View style={styles.cardContainer}>
				{/* Show repost attribution if needed */}
				{isRepost && (
					<View style={styles.repostAttribution}>
						<Text style={styles.repostText}>
							<Text style={styles.repostIcon}>↻</Text> Reposted by{" "}
							<Text style={styles.repostUsername}>@{username}</Text>
						</Text>
					</View>
				)}

				<VoiceNoteCard
					voiceNote={normalizedVoiceNote}
					userId={creatorId}
					displayName={creatorDisplayName}
					username={creatorUsername}
					userAvatarUrl={creatorAvatarUrl}
					timePosted={displayTimestamp}
					onPlay={() => handlePlayVoiceNote(item.id)}
					onShare={() => handleShareVoiceNote(item.id)}
					onProfilePress={() => {
						// Use the voice note's username for navigation
						router.push({
							pathname: "/profile/[username]",
							params: { username: creatorUsername },
						});
					}}
					currentUserId={userId}
				/>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			{localVoiceNotes.length === 0 ? (
				<View style={styles.emptyState}>
					<Text style={styles.emptyText}>
						{isSharedList ? "No reposts yet." : "No voice notes yet."}
					</Text>
				</View>
			) : (
				<FlatList
					data={localVoiceNotes}
					renderItem={renderVoiceNoteCard}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							colors={["#6B2FBC"]}
							tintColor="#6B2FBC"
						/>
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8F8F8",
	},
	listContent: {
		paddingBottom: 20,
	},
	cardContainer: {
		marginBottom: 16,
	},
	emptyState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 50,
	},
	emptyText: {
		fontSize: 16,
		color: "#888",
	},
	repostAttribution: {
		paddingHorizontal: 16,
		paddingVertical: 4,
		marginBottom: 4,
	},
	repostText: {
		fontSize: 13,
		color: "#666",
	},
	repostIcon: {
		fontWeight: "bold",
		color: "#4CAF50",
	},
	repostUsername: {
		fontWeight: "600",
		color: "#666",
	},
});
