import { useState, useEffect, useCallback, useRef } from "react";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../../context/UserContext";
import {
	recordShare,
	recordPlay,
	getVoiceNoteById,
	deleteVoiceNote,
	checkShareStatus,
} from "../../../../services/api";
import { VoiceNote, VoiceNotesListProps } from "../VoiceNotesListTypes";
import { normalizePlaysCount } from "../VoiceNotesListUtils";

export const useVoiceNotesList = ({
	userId,
	voiceNotes = [],
	onPlayVoiceNote,
	onRefresh,
	loadingNotes: externalLoadingNotes = false,
}: Pick<VoiceNotesListProps, "userId" | "voiceNotes" | "onPlayVoiceNote" | "onRefresh" | "loadingNotes">) => {
	const router = useRouter();
	const { user: currentUser } = useUser();
	
	// State management
	const [refreshing, setRefreshing] = useState(false);
	const [localVoiceNotes, setLocalVoiceNotes] = useState<VoiceNote[]>(voiceNotes);
	const [loadingNotes, setLoadingNotes] = useState(externalLoadingNotes);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loadingStats, setLoadingStats] = useState(true);
	const flatListRef = useRef<FlatList>(null);
	
	// Track recently interacted voice notes to prevent optimistic update interference
	const [recentlyInteractedNotes, setRecentlyInteractedNotes] = useState<Set<string>>(new Set());

	// Update local state when props change
	useEffect(() => {
		setLocalVoiceNotes(voiceNotes);
	}, [voiceNotes]);

	// Update loading state when external loading state changes
	useEffect(() => {
		console.log("VoiceNotesList: externalLoadingNotes changed to:", externalLoadingNotes);
		setLoadingNotes(externalLoadingNotes);
	}, [externalLoadingNotes]);

	// Fetch latest data for each reposted voice note
	useEffect(() => {
		const fetchRepostedNotesData = async () => {
			if (!voiceNotes.length || !voiceNotes.some((note) => note.is_shared)) return;

			setLoadingNotes(true);

			try {
				let updatedNotes = [...voiceNotes];

				for (let i = 0; i < updatedNotes.length; i++) {
					const note = updatedNotes[i];
					if (note.is_shared) {
						// OPTIMISTIC UPDATE FIX: Skip fetching for recently interacted notes
						// This prevents fresh data from overriding optimistic updates
						if (recentlyInteractedNotes.has(note.id)) {
							console.log("[PROFILE FETCH DEBUG] Skipping fetch for recently interacted note:", note.id);
							continue;
						}
						
						try {
							const response = await getVoiceNoteById(note.id);
							const latestData = response as unknown as VoiceNote;

							if (latestData) {
								console.log("[PROFILE FETCH DEBUG] Updating voice note data:", {
									voiceNoteId: note.id,
									oldShares: note.shares,
									newShares: latestData.shares
								});
								
								updatedNotes[i] = {
									...note,
									likes: typeof latestData.likes === "number" ? latestData.likes : 0,
									comments: typeof latestData.comments === "number" ? latestData.comments : 0,
									plays: typeof latestData.plays === "number"
										? latestData.plays
										: latestData.plays && typeof (latestData.plays as any).count === "number"
										? (latestData.plays as any).count
										: 0,
									shares: typeof latestData.shares === "number" ? latestData.shares : 0,
								};
							}
						} catch (err) {
							console.error(`Error fetching data for reposted note ${note.id}:`, err);
						}
					}
				}

				setLocalVoiceNotes(updatedNotes);
			} catch (error) {
				console.error("Error fetching reposted notes data:", error);
			} finally {
				setLoadingNotes(false);
			}
		};

		fetchRepostedNotesData();
	}, [voiceNotes, recentlyInteractedNotes]);

	// Voice notes already come with stats data, no need to fetch separately
	useEffect(() => {
		// Just set loading to false since we're not fetching stats anymore
		setLoadingStats(false);
	}, [localVoiceNotes.length]);

	const handleRefresh = useCallback(() => {
		setRefreshing(true);
		if (onRefresh) {
			onRefresh();
		}
		setTimeout(() => setRefreshing(false), 1000);
	}, [onRefresh]);

	const handlePlayVoiceNote = useCallback((voiceNoteId: string) => {
		console.log("Playing voice note:", voiceNoteId);
		
		// Record the play
		if (currentUser?.id) {
			recordPlay(voiceNoteId, currentUser.id).catch((error: any) => {
				console.error("Error recording play:", error);
			});
		}

		// Call the parent's play handler if provided
		if (onPlayVoiceNote) {
			onPlayVoiceNote(voiceNoteId);
		}
	}, [onPlayVoiceNote, currentUser?.id]);

	const handleShare = useCallback(async (voiceNoteId: string) => {
		try {
			if (currentUser?.id) {
				await recordShare(voiceNoteId, currentUser.id);
				console.log("Share recorded successfully");
			}
		} catch (error) {
			console.error("Error recording share:", error);
		}
	}, [currentUser?.id]);

	const handleUserProfilePress = useCallback((profileUsername?: string) => {
		if (!profileUsername) return;
		
		console.log("Navigating to profile:", profileUsername);
		router.push(`/profile/${profileUsername}`);
	}, [router]);

	const handleLoadMore = useCallback(() => {
		if (hasMore && !loadingNotes) {
			setPage(prev => prev + 1);
		}
	}, [hasMore, loadingNotes]);

	const handleDelete = useCallback(async (voiceNoteId: string) => {
		try {
			await deleteVoiceNote(voiceNoteId);
			setLocalVoiceNotes(prev => prev.filter(note => note.id !== voiceNoteId));
		} catch (error) {
			console.error("Error deleting voice note:", error);
		}
	}, []);

	const handlePlay = useCallback((voiceNoteId: string) => {
		handlePlayVoiceNote(voiceNoteId);
	}, [handlePlayVoiceNote]);

	const handleAfterShare = useCallback((voiceNoteId: string, isShared: boolean) => {
		console.log("[PROFILE] handleAfterShare called:", { voiceNoteId, isShared });
		
		// Track this voice note as recently interacted to prevent fetch interference
		setRecentlyInteractedNotes(prev => new Set(prev).add(voiceNoteId));
		
		// Clear the tracking after 8 seconds to allow future fetches
		setTimeout(() => {
			setRecentlyInteractedNotes(prev => {
				const newSet = new Set(prev);
				newSet.delete(voiceNoteId);
				return newSet;
			});
		}, 8000);
		
		setLocalVoiceNotes(prev => 
			prev.map(note => {
				if (note.id === voiceNoteId) {
					console.log("[PROFILE] Updating share status flags only (not count):", {
						voiceNoteId,
						isShared,
						currentShareCount: note.shares
					});
					
					return { 
						...note, 
						// DON'T modify shares count - let the voice note card handle that
						// Only update status flags for UI consistency
						isReposted: isShared,
						currentUserHasShared: isShared,
						is_shared: isShared
					};
				}
				return note;
			})
		);
	}, []);

	const handleUnshare = useCallback((voiceNoteId: string) => {
		// PROFILE PAGE BUG FIX: Don't remove voice notes from profile pages when unshared
		// Profile pages should show all voice notes created by the user, regardless of share status
		// Only update the repost status flags - DON'T modify share count (voice note card handles that)
		console.log("[PROFILE BUG FIX] handleUnshare called for voice note:", voiceNoteId);
		
		setLocalVoiceNotes(prev => 
			prev.map(note => {
				if (note.id === voiceNoteId) {
					console.log("[PROFILE BUG FIX] Updating voice note status flags only (not count):", {
						voiceNoteId,
						currentShareCount: note.shares,
						wasShared: note.is_shared || note.currentUserHasShared || note.isReposted
					});
					
					return {
						...note,
						// DON'T modify shares count - let the voice note card handle that
						// Only reset shared status flags for UI consistency
						is_shared: false,
						currentUserHasShared: false,
						isReposted: false,
						// Keep the voice note in the list since it belongs to this profile
					};
				}
				return note;
			})
		);
	}, []);

	return {
		// State
		refreshing,
		localVoiceNotes,
		loadingNotes,
		loadingStats,
		page,
		hasMore,
		flatListRef,
		currentUser,
		
		// Handlers
		handleRefresh,
		handlePlayVoiceNote,
		handleShare,
		handleUserProfilePress,
		handleLoadMore,
		handleDelete,
		handlePlay,
		handleAfterShare,
		handleUnshare,
	};
}; 