import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	TouchableOpacity,
	Text,
	RefreshControl,
	ScrollView,
	FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "./VoiceNoteCard";
import { Feather } from "@expo/vector-icons";
import {
	recordShare,
	recordPlay,
	getVoiceNoteById,
	getVoiceNoteStats,
} from "../../services/api/voiceNoteService";

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
	showRepostAttribution?: boolean;
}

// Empty array for when no voice notes are available
const EMPTY_VOICE_NOTES: VoiceNote[] = [];

// Function to normalize any stats count (likes, comments, plays, shares)
const normalizeCount = (value: any): number => {
	// If it's already a number, return it
	if (typeof value === "number") {
		return value;
	}

	// If it's an object with a count property
	if (value && typeof value === "object") {
		// Handle {count: number}
		if (typeof value.count === "number") {
			return value.count;
		}

		// Handle arrays of objects with count
		if (Array.isArray(value) && value.length > 0) {
			if (typeof value[0].count === "number") {
				return value[0].count;
			}
			// Try to use the array length as a fallback
			return value.length;
		}
	}

	// Try to parse it as a number if it's a string
	if (typeof value === "string") {
		const parsed = parseInt(value, 10);
		if (!isNaN(parsed)) {
			return parsed;
		}
	}

	// Fallback to 0 for undefined, null, or unparseable formats
	return 0;
};

// Function to normalize plays count (keeping for backward compatibility)
const normalizePlaysCount = (plays: any): number => {
	return normalizeCount(plays);
};

export function VoiceNotesList({
	userId,
	username,
	displayName,
	voiceNotes = [],
	onPlayVoiceNote,
	onRefresh,
	isSharedList = false,
	showRepostAttribution = false,
}: VoiceNotesListProps) {
	const router = useRouter();
	// State for refresh control
	const [refreshing, setRefreshing] = useState(false);
	// State for voice notes
	const [localVoiceNotes, setLocalVoiceNotes] =
		useState<VoiceNote[]>(voiceNotes);
	// State for loading status
	const [loadingNotes, setLoadingNotes] = useState(false);

	// Use the provided displayName or default to "User"
	const userDisplayName = displayName || "User";

	// Update local state when props change
	useEffect(() => {
		setLocalVoiceNotes(voiceNotes);
	}, [voiceNotes]);

	// Fetch latest data for each reposted voice note
	useEffect(() => {
		const fetchRepostedNotesData = async () => {
			// Only proceed if we have voice notes and any of them are reposts
			if (!voiceNotes.length || !voiceNotes.some((note) => note.is_shared))
				return;

			setLoadingNotes(true);

			try {
				// Create a new array to store updated voice notes
				let updatedNotes = [...voiceNotes];

				// Process reposted notes
				for (let i = 0; i < updatedNotes.length; i++) {
					const note = updatedNotes[i];
					if (note.is_shared) {
						try {
							// Fetch the latest data for this note
							const response = await getVoiceNoteById(note.id);
							// Type assertion for the response
							const latestData = response as unknown as VoiceNote;

							if (latestData) {
								// Update the stats while preserving the repost information
								updatedNotes[i] = {
									...note,
									likes:
										typeof latestData.likes === "number" ? latestData.likes : 0,
									comments:
										typeof latestData.comments === "number"
											? latestData.comments
											: 0,
									// Ensure plays is a number to prevent [object Object] display issue
									plays:
										typeof latestData.plays === "number"
											? latestData.plays
											: latestData.plays &&
											  typeof (latestData.plays as any).count === "number"
											? (latestData.plays as any).count
											: 0,
									shares:
										typeof latestData.shares === "number"
											? latestData.shares
											: 0,
								};
							}
						} catch (err) {
							console.error(
								`Error fetching data for reposted note ${note.id}:`,
								err
							);
						}
					}
				}

				// Update the state with fresh data
				setLocalVoiceNotes(updatedNotes);
			} catch (error) {
				console.error("Error fetching reposted notes data:", error);
			} finally {
				setLoadingNotes(false);
			}
		};

		fetchRepostedNotesData();
	}, [voiceNotes]);

	// Add an effect to directly fetch stats for each voice note
	useEffect(() => {
		const fetchAllVoiceNoteStats = async () => {
			if (!localVoiceNotes || localVoiceNotes.length === 0) return;

			console.log("VoiceNotesList: Fetching stats for all voice notes");

			// Create a new array to store updated voice notes
			const updatedNotes = [...localVoiceNotes];
			let hasUpdates = false;

			// Process each voice note
			for (let i = 0; i < updatedNotes.length; i++) {
				const note = updatedNotes[i];
				console.log(`Before fetch - Note ${note.id} stats:`, {
					likes: note.likes,
					comments: note.comments,
					plays: note.plays,
					normalizedPlays: normalizePlaysCount(note.plays),
					shares: note.shares,
				});

				try {
					// Get fresh stats for this note
					const stats = await getVoiceNoteStats(note.id);
					console.log(`After fetch - Note ${note.id} stats from API:`, stats);

					// Check if we got different values than what we already have
					if (
						stats.likes !== note.likes ||
						stats.comments !== note.comments ||
						stats.plays !== normalizePlaysCount(note.plays) ||
						stats.shares !== note.shares
					) {
						console.log(`Updating stats for note ${note.id}`);
						// Update the note with fresh stats
						updatedNotes[i] = {
							...note,
							likes: stats.likes,
							comments: stats.comments,
							plays: stats.plays,
							shares: stats.shares,
						};
						hasUpdates = true;
					}
				} catch (error) {
					console.error(`Error fetching stats for note ${note.id}:`, error);
				}
			}

			// Only update state if we actually got different values
			if (hasUpdates) {
				console.log("Updating local state with fresh stats");
				setLocalVoiceNotes(updatedNotes);
			} else {
				console.log("No stats updates needed");
			}
		};

		fetchAllVoiceNoteStats();
	}, [localVoiceNotes.length]); // Only re-run if the number of notes changes

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
								? {
										...vn,
										plays: response.data.playCount,
								  }
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

	// Use provided voice notes or empty array
	const displayVoiceNotes =
		localVoiceNotes && localVoiceNotes.length > 0
			? localVoiceNotes
			: EMPTY_VOICE_NOTES;

	return (
		<View style={styles.container}>
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
				<View style={styles.separatorDot} />
				<View style={styles.separatorLine} />
			</View>

			{displayVoiceNotes.length === 0 ? (
				<View style={styles.emptyStateContainer}>
					<Feather name="mic-off" size={48} color="#ccc" />
					<Text style={styles.emptyStateText}>No voice notes yet</Text>
					<Text style={styles.emptyStateSubtext}>
						Voice notes you create will appear here
					</Text>
				</View>
			) : (
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							tintColor="#6B2FBC"
							colors={["#6B2FBC"]}
						/>
					}
				>
					<View style={styles.content}>
						{displayVoiceNotes.map((item) => {
							// Calculate time since posting
							const timeAgo = formatRelativeTime(new Date(item.created_at));

							// For shared items, use the shared timestamp
							const displayTimestamp =
								item.is_shared && item.shared_at
									? formatRelativeTime(new Date(item.shared_at))
									: timeAgo;

							// Get the creator info
							const creatorId = item.users?.id || item.user_id || userId;
							const creatorDisplayName =
								item.users?.display_name || userDisplayName;
							const creatorUsername =
								item.users?.username || username || "user";
							const creatorAvatarUrl = item.users?.avatar_url || null;

							// Determine if we should show repost attribution
							const isRepost =
								(isSharedList || showRepostAttribution) && item.is_shared;

							// Get the username of who reposted this voice note
							const repostedByUsername = item.shared_by?.username || username;

							return (
								<View key={item.id} style={styles.cardContainer}>
									{/* Show repost attribution if needed */}
									{isRepost && (
										<View style={styles.repostAttribution}>
											<Text style={styles.repostText}>
												<Text style={styles.repostIcon}>↻</Text> Reposted by{" "}
												<Text style={styles.repostUsername}>
													@{repostedByUsername}
												</Text>
											</Text>
										</View>
									)}
									<VoiceNoteCard
										voiceNote={{
											...item,
											backgroundImage:
												item.backgroundImage || item.background_image || null,
											// Ensure all stats are proper numbers to prevent [object Object] display
											likes: normalizeCount(item.likes),
											comments: normalizeCount(item.comments),
											plays: normalizeCount(item.plays),
											shares: normalizeCount(item.shares),
										}}
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
						})}
					</View>
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	separatorContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: "#EEEEEE",
	},
	separatorDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#6B2FBC",
		marginHorizontal: 8,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 20,
	},
	cardContainer: {
		marginBottom: 16,
	},
	emptyStateContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 60,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#666",
		marginTop: 16,
	},
	emptyStateSubtext: {
		fontSize: 14,
		color: "#999",
		marginTop: 8,
		textAlign: "center",
		paddingHorizontal: 32,
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
