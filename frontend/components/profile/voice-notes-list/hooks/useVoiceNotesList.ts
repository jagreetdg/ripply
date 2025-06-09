import { useState, useEffect, useCallback, useRef } from "react";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../../context/UserContext";
import {
	recordShare,
	recordPlay,
	getVoiceNoteById,
	getVoiceNoteStats,
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
						try {
							const response = await getVoiceNoteById(note.id);
							const latestData = response as unknown as VoiceNote;

							if (latestData) {
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
	}, [voiceNotes]);

	// Fetch stats for all voice notes
	useEffect(() => {
		const fetchAllVoiceNoteStats = async () => {
			if (!localVoiceNotes || localVoiceNotes.length === 0) {
				setLoadingStats(false);
				return;
			}

			console.log("VoiceNotesList: Fetching stats for all voice notes");
			setLoadingStats(true);

			const updatedNotes = [...localVoiceNotes];
			let hasUpdates = false;

			for (let i = 0; i < updatedNotes.length; i++) {
				const note = updatedNotes[i];
				
				try {
					const stats = await getVoiceNoteStats(note.id);
					
					if (
						stats.likes !== note.likes ||
						stats.comments !== note.comments ||
						stats.plays !== normalizePlaysCount(note.plays) ||
						stats.shares !== note.shares
					) {
						console.log(`Updating stats for note ${note.id}`);
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

			if (hasUpdates) {
				setLocalVoiceNotes(updatedNotes);
			}
			setLoadingStats(false);
		};

		fetchAllVoiceNoteStats();
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
		setLocalVoiceNotes(prev => 
			prev.map(note => 
				note.id === voiceNoteId 
					? { ...note, isReposted: isShared }
					: note
			)
		);
	}, []);

	const handleUnshare = useCallback((voiceNoteId: string) => {
		setLocalVoiceNotes(prev => prev.filter(note => note.id !== voiceNoteId));
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