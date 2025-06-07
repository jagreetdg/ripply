import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	StyleSheet,
	View,
	TouchableOpacity,
	Text,
	RefreshControl,
	ScrollView,
	FlatList,
	ActivityIndicator,
	Alert,
	Share,
	Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { VoiceNoteCard } from "../../voice-note-card/VoiceNoteCard";
import { Feather } from "@expo/vector-icons";
import {
	recordShare,
	recordPlay,
	getVoiceNoteById,
	getVoiceNoteStats,
	deleteVoiceNote,
	checkShareStatus,
} from "../../../services/api/voiceNoteService";
import {
	getUserVoiceNotes as getVoiceNotesForUser,
	getUserSharedVoiceNotes as getSharedVoiceNotesForUser,
} from "../../../services/api/userService";
import { useTheme } from "../../../context/ThemeContext";
import { useUser } from "../../../context/UserContext";
import { useBatchRepostStatus } from "../../../hooks/useRepostStatus";

// Import decoupled types, utils, and styles
import { VoiceNote, VoiceNotesListProps } from "./VoiceNotesListTypes";
import {
	formatRelativeTime,
	normalizeCount,
	normalizePlaysCount,
} from "./VoiceNotesListUtils";
import { getStyles } from "./VoiceNotesListStyles";

// Add debugging logs
console.log("VoiceNotesList component is being loaded");

// EMPTY_VOICE_NOTES can remain here or be moved to types, keeping here for now.
const EMPTY_VOICE_NOTES: VoiceNote[] = [];

export function VoiceNotesList({
	userId,
	username,
	displayName,
	voiceNotes = [],
	onPlayVoiceNote,
	onRefresh,
	isSharedList = false,
	showRepostAttribution = false,
	listHeaderComponent,
	isOwnProfile,
	activeTab,
	loadingNotes: externalLoadingNotes = false,
}: VoiceNotesListProps) {
	const router = useRouter();
	const { colors, isDarkMode } = useTheme();
	const { user: currentUser } = useUser();
	// State for refresh control
	const [refreshing, setRefreshing] = useState(false);
	// State for voice notes
	const [localVoiceNotes, setLocalVoiceNotes] =
		useState<VoiceNote[]>(voiceNotes);
	// State for loading status - initialize based on props
	const [loadingNotes, setLoadingNotes] = useState(externalLoadingNotes);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const flatListRef = useRef<FlatList>(null);
	// Add a new loading state for stats after the other states
	const [loadingStats, setLoadingStats] = useState(true);

	// Get styles from the decoupled function
	const styles = getStyles(colors, listHeaderComponent, isDarkMode);

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

	// Update the useEffect to respond to changes in the voiceNotes prop
	useEffect(() => {
		const fetchAllVoiceNoteStats = async () => {
			if (!localVoiceNotes || localVoiceNotes.length === 0) {
				// Make sure to set loading to false when there are no voice notes
				setLoadingStats(false);
				return;
			}

			console.log("VoiceNotesList: Fetching stats for all voice notes");
			setLoadingStats(true);

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

			setLoadingStats(false);
		};

		fetchAllVoiceNoteStats();
	}, [localVoiceNotes.length, voiceNotes]); // Add voiceNotes dependency to trigger when props change

	// Add a new effect that runs when the component comes into focus
	// This ensures that stats are refreshed when navigating back to the profile
	useFocusEffect(
		useCallback(() => {
			// Only run if we have voice notes
			if (localVoiceNotes && localVoiceNotes.length > 0) {
				console.log("VoiceNotesList: Component focused, refreshing stats");
				setLoadingStats(true);

				const refreshVoiceNoteStats = async () => {
					// Create a new array to store updated voice notes
					const updatedNotes = [...localVoiceNotes];
					let hasUpdates = false;

					// Process each voice note
					for (let i = 0; i < updatedNotes.length; i++) {
						const note = updatedNotes[i];
						try {
							// Get fresh stats for this note
							const stats = await getVoiceNoteStats(note.id);
							console.log(`Refreshed stats for note ${note.id}:`, stats);

							// Always update the stats to ensure we have the latest values
							updatedNotes[i] = {
								...note,
								likes: stats.likes,
								comments: stats.comments,
								plays: stats.plays,
								shares: stats.shares,
							};
							hasUpdates = true;
						} catch (error) {
							console.error(
								`Error refreshing stats for note ${note.id}:`,
								error
							);
						}
					}

					// Only update state if we actually got different values
					if (hasUpdates) {
						console.log("Updating local state with fresh stats");
						setLocalVoiceNotes(updatedNotes);
					}

					setLoadingStats(false);
				};

				refreshVoiceNoteStats();
			}
		}, [localVoiceNotes.length])
	);

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

	// Handle share voice note (Native share dialog)
	const handleShare = async (voiceNoteId: string) => {
		try {
			// Fetch the voice note details if needed, or construct URL directly
			// Assuming voiceNoteId is enough to construct the URL and get title
			// This might require fetching the voice note if title isn't available elsewhere
			const voiceNote = localVoiceNotes.find((vn) => vn.id === voiceNoteId);
			const title = voiceNote?.title || "Voice Note from Ripply";

			const voiceNoteUrl = `https://ripply.co/note/${voiceNoteId}`;
			const result = await Share.share({
				message: `Check out this voice note on Ripply: ${voiceNoteUrl}`,
				url: voiceNoteUrl, // for iOS
				title: title, // for Android
			});

			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					// Shared with activity type of result.activityType
					console.log("Shared via:", result.activityType);
				} else {
					// Shared
					console.log("Shared successfully");
				}
			} else if (result.action === Share.dismissedAction) {
				// Dismissed
				console.log("Share dismissed");
			}
		} catch (error: any) {
			Alert.alert("Share Error", error.message);
		}
	};

	// Update the voice note's share status in our local state when changed
	const updateVoiceNoteShareStatus = useCallback(
		(voiceNoteId: string, isShared: boolean) => {
			console.log(
				`Updating local share status for ${voiceNoteId} to ${isShared}`
			);
			setLocalVoiceNotes((prevNotes) =>
				prevNotes.map((note) =>
					note.id === voiceNoteId
						? { ...note, currentUserHasShared: isShared }
						: note
				)
			);
		},
		[]
	);

	// Handle unshare event (remove the voice note from the list if in shared tab)
	const handleUnshare = useCallback(
		(voiceNoteId: string) => {
			console.log(
				`Voice note unshared: ${voiceNoteId}, activeTab: ${activeTab}`
			);

			// Update the voice note's share status
			updateVoiceNoteShareStatus(voiceNoteId, false);

			// Only remove from list if we're in the shared tab
			if (activeTab === "shared" || isSharedList) {
				console.log(`Removing voice note ${voiceNoteId} from shared list`);
				setLocalVoiceNotes((prev) =>
					prev.filter((note) => note.id !== voiceNoteId)
				);
			}
		},
		[activeTab, isSharedList, updateVoiceNoteShareStatus]
	);

	// Function to handle post-sharing status update
	const handleAfterShare = useCallback(
		(voiceNoteId: string, isShared: boolean) => {
			console.log(`handleAfterShare: ${voiceNoteId}, isShared: ${isShared}`);
			updateVoiceNoteShareStatus(voiceNoteId, isShared);
		},
		[updateVoiceNoteShareStatus]
	);

	// Handle navigation to user profile
	const handleUserProfilePress = (profileUsername?: string) => {
		if (profileUsername) {
			router.push({
				pathname: "/profile/[username]",
				params: { username: profileUsername },
			});
		}
	};

	// Use provided voice notes or empty array
	const displayVoiceNotes =
		localVoiceNotes && localVoiceNotes.length > 0
			? localVoiceNotes
			: EMPTY_VOICE_NOTES;

	const fetchVoiceNotes = useCallback(
		async (isRefresh = false) => {
			if (!userId) return;
			if (!isRefresh && loadingNotes && page > 1) return; // Prevent multiple fetches if already loading more

			console.log(
				`Fetching voice notes for user: ${userId}, page: ${
					isRefresh ? 1 : page
				}, tab: ${activeTab}`
			);

			if (isRefresh) {
				setRefreshing(true);
				setPage(1); // Reset page on refresh
			} else if (page === 1) {
				setLoadingNotes(true); // Full loading indicator for initial load
			} // For subsequent pages, loading is handled by the footer indicator

			try {
				let newVoiceNotes: VoiceNote[] = [];
				const limit = 10;
				const offset = isRefresh ? 0 : (page - 1) * limit;

				if (activeTab === "voicenotes") {
					newVoiceNotes = await getVoiceNotesForUser(
						userId /*, limit, offset*/
					);
				} else if (activeTab === "shared") {
					newVoiceNotes = await getSharedVoiceNotesForUser(
						userId /*, limit, offset*/
					);
				}

				console.log(`Fetched ${newVoiceNotes.length} voice notes`);

				if (isRefresh) {
					setLocalVoiceNotes(newVoiceNotes);
				} else {
					setLocalVoiceNotes((prevNotes) => [...prevNotes, ...newVoiceNotes]);
				}

				setHasMore(newVoiceNotes.length === limit);
				if (newVoiceNotes.length === limit && !isRefresh) {
					setPage((prevPage) => prevPage + 1);
				}
			} catch (error) {
				console.error("Error fetching voice notes:", error);
				// Handle error (e.g., show a message to the user)
			} finally {
				setLoadingNotes(false);
				setRefreshing(false);
			}
		},
		[userId, page, loadingNotes, activeTab]
	);

	// Initial fetch and refetch when userId changes
	useEffect(() => {
		setLocalVoiceNotes([]); // Clear notes when user changes
		setPage(1);
		setHasMore(true);
		setLoadingNotes(true); // Ensure loading state is true for the first fetch
		fetchVoiceNotes(true); // Pass true to indicate it's a refresh/initial load
	}, [userId]); // Removed activeTab dependency since we're combining tabs

	// Scroll to top when activeTab changes and it's not the initial load
	const isInitialMount = useRef(true);
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			if (flatListRef.current) {
				flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
			}
		}
	}, [activeTab]);

	const handleLoadMore = () => {
		if (hasMore && !loadingNotes && !refreshing) {
			console.log("Loading more voice notes...");
			// fetchVoiceNotes will use the current `page` state which should have been incremented
			fetchVoiceNotes();
		}
	};

	const handleDelete = async (voiceNoteId: string) => {
		Alert.alert(
			"Delete Voice Note",
			"Are you sure you want to delete this voice note? This action cannot be undone.",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await deleteVoiceNote(voiceNoteId);
							setLocalVoiceNotes((prevNotes) =>
								prevNotes.filter((note) => note.id !== voiceNoteId)
							);
							Alert.alert("Deleted!", "Your voice note has been deleted.");
						} catch (error) {
							console.error("Error deleting voice note:", error);
							Alert.alert(
								"Error",
								"Failed to delete the voice note. Please try again."
							);
						}
					},
				},
			]
		);
	};

	const handlePlay = (voiceNoteId: string) => {
		// Handle play action, e.g., navigate to a player or update global player state
		console.log(`Play voice note: ${voiceNoteId}`);
	};

	// Load voice notes data when userId changes
	useEffect(() => {
		if (userId) {
			fetchVoiceNotes();
		}
	}, [userId, activeTab]);

	// Refresh the voice notes list when onRefresh is called
	const refreshVoiceNotes = useCallback(async () => {
		setRefreshing(true);
		await fetchVoiceNotes(true);
		setRefreshing(false);
	}, [fetchVoiceNotes]);

	// Extract all voice note IDs for batch status check
	const voiceNoteIds = localVoiceNotes.map((note) => note.id);

	// Use batch hook to efficiently check repost status for all voice notes
	const { statusMap: repostStatusMap, isLoading: repostStatusLoading } =
		useBatchRepostStatus(voiceNoteIds);

	// Log the batch status results
	useEffect(() => {
		if (!repostStatusLoading) {
			console.log(
				`[VoiceNotesList] Loaded repost status for ${
					Object.keys(repostStatusMap).length
				} voice notes`
			);
			// Log a few examples for debugging
			const examples = Object.entries(repostStatusMap).slice(0, 3);
			if (examples.length > 0) {
				console.log(`[VoiceNotesList] Sample repost statuses:`, examples);
			}
		}
	}, [repostStatusMap, repostStatusLoading]);

	const renderItem = ({ item }: { item: VoiceNote }) => {
		// Determine if the card represents a shared/reposted item
		const isRepostedItem = !!item.is_shared;

		// Use the repost status from our batch hook
		const isRepostedByCurrentUser = repostStatusMap[item.id] || false;

		console.log(`[VoiceNotesList] Voice note ${item.id} status:`, {
			isRepostedItem, // Whether the voice note itself is a repost (used for attribution)
			isRepostedByCurrentUser, // Whether current user has reposted this (determines green highlight)
			statusFromMap: repostStatusMap[item.id],
			currentUserId: currentUser?.id,
		});

		// Prepare the voiceNote prop to match VoiceNoteCardTypes.VoiceNote
		const cardVoiceNote = {
			id: item.id,
			duration: item.duration,
			title: item.title,
			likes: loadingStats ? 0 : normalizeCount(item.likes),
			comments: loadingStats ? 0 : normalizeCount(item.comments),
			plays: loadingStats ? 0 : normalizePlaysCount(item.plays),
			shares: loadingStats ? 0 : normalizeCount(item.shares),
			backgroundImage: item.backgroundImage || item.background_image || null,
			tags: item.tags || [],
			userAvatarUrl: item.users?.avatar_url,
			// If users data exists, include it for compatibility
			...(item.users
				? {
						users: {
							id: item.users.id,
							username: item.users.username,
							display_name: item.users.display_name,
							avatar_url: item.users.avatar_url,
						},
				  }
				: {}),
			isLoadingStats: loadingStats,
		};

		// Create sharedBy prop from either shared_by object or individual sharer fields
		let sharedByProp = null;

		if (isRepostedItem) {
			if (item.shared_by) {
				sharedByProp = {
					id: item.shared_by.id,
					username: item.shared_by.username,
					displayName: item.shared_by.display_name,
					avatarUrl: item.shared_by.avatar_url,
				};
			} else if (item.sharer_id) {
				sharedByProp = {
					id: item.sharer_id,
					username: item.sharer_username || "unknown",
					displayName:
						item.sharer_display_name || item.sharer_username || "Unknown User",
					avatarUrl: item.sharer_avatar_url || null,
				};
			}
		}

		return (
			<VoiceNoteCard
				key={item.id}
				voiceNote={cardVoiceNote}
				userId={item.users?.id || item.user_id || userId}
				displayName={item.users?.display_name || userDisplayName}
				username={item.users?.username || username || ""}
				userAvatarUrl={item.users?.avatar_url || null}
				timePosted={formatRelativeTime(
					new Date(
						item.is_shared && item.shared_at ? item.shared_at : item.created_at
					)
				)}
				onPlayPress={() => handlePlayVoiceNote(item.id)}
				onShare={(voiceNoteId) => {
					handleShare(voiceNoteId);
					// For native share, we don't update internal sharing status
				}}
				onShareStatusChanged={(voiceNoteId, isShared) =>
					handleAfterShare(voiceNoteId, isShared)
				}
				onUserProfilePress={
					item.users?.username
						? () => handleUserProfilePress(item.users?.username)
						: undefined
				}
				currentUserId={currentUser?.id}
				isReposted={isRepostedByCurrentUser}
				sharedBy={sharedByProp}
				showRepostAttribution={isRepostedItem}
				onVoiceNoteUnshared={handleUnshare}
				isLoadingRepostStatus={repostStatusLoading}
			/>
		);
	};

	// Add a custom empty component function to properly handle loading states
	const renderEmptyComponent = () => {
		// Force showing loading when:
		// 1. External loading flag is true OR
		// 2. We have no voice notes AND we are still within the initial loading period
		const isLoading =
			externalLoadingNotes || (localVoiceNotes.length === 0 && loadingNotes);

		console.log("EmptyComponent - rendering with states:", {
			externalLoadingNotes,
			localVoiceNotesLength: localVoiceNotes.length,
			loadingNotes,
			isLoading,
			showSpinner: isLoading,
		});

		if (isLoading) {
			return (
				<View style={styles.emptyContainer}>
					<ActivityIndicator size="large" color={colors.tint} />
					<Text
						style={[
							styles.emptyText,
							{ marginTop: 16, color: colors.textSecondary },
						]}
					>
						Loading voice notes...
					</Text>
				</View>
			);
		}

		// Only show empty state if not loading
		return (
			<View style={styles.emptyContainer}>
				<Feather
					name={activeTab === "shared" ? "repeat" : "mic-off"}
					size={60}
					color={colors.textSecondary}
					style={styles.emptyIcon}
				/>
				<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
					{activeTab === "shared"
						? isOwnProfile
							? "You haven't shared any voice notes yet."
							: "This user hasn't shared any voice notes yet."
						: isOwnProfile
						? "You haven't created any voice notes yet."
						: "This user hasn't created any voice notes yet."}
				</Text>
				{isOwnProfile && activeTab === "voicenotes" && (
					<TouchableOpacity
						style={styles.recordButton}
						onPress={() => router.push("/voicenote/create")}
					>
						<Feather name="mic" size={20} color={colors.white} />
						<Text style={styles.recordButtonText}>Record First Voice Note</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	};

	// Update loading state when external loading state changes or voiceNotes prop changes
	useEffect(() => {
		console.log(
			"VoiceNotesList: externalLoadingNotes changed to:",
			externalLoadingNotes
		);
		setLoadingNotes(externalLoadingNotes);
	}, [externalLoadingNotes]);

	// Add specific effect for when voiceNotes array changes
	useEffect(() => {
		console.log(
			"VoiceNotesList: voiceNotes prop changed, length:",
			voiceNotes.length
		);
		// If we get a new empty array, this could be the start of a loading cycle
		// In this case, we'll set localVoiceNotes but keep loadingNotes true
		setLocalVoiceNotes(voiceNotes);
	}, [voiceNotes]);

	// Add debugging info every render
	console.log("VoiceNotesList render state:", {
		loadingNotes,
		externalLoadingNotes,
		refreshing,
		localVoiceNotesLength: localVoiceNotes.length,
		hasVoiceNotes: voiceNotes.length > 0,
	});

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
				<View style={styles.separatorDot} />
				<View style={styles.separatorLine} />
			</View>

			<FlatList
				ref={flatListRef}
				style={[styles.list, { backgroundColor: colors.background }]}
				contentContainerStyle={
					localVoiceNotes.length === 0
						? [styles.listContent, styles.emptyListContent]
						: styles.listContent
				}
				data={localVoiceNotes}
				renderItem={renderItem}
				keyExtractor={(item) =>
					`${item.id}-${item.is_shared ? "shared" : "original"}-${
						item.shared_at || ""
					}`
				}
				ListEmptyComponent={renderEmptyComponent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={colors.tint}
						colors={[colors.tint]}
						progressBackgroundColor={colors.background}
					/>
				}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
			/>
		</View>
	);
}
