import { useState, useEffect, useCallback, useRef } from "react";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../../context/UserContext";
import {
	recordShare,
	recordPlay,
	getVoiceNoteById,
	deleteVoiceNote,
} from "../../../../services/api";
import { VoiceNote, VoiceNotesListProps } from "../VoiceNotesListTypes";

export const useVoiceNotesList = ({
	userId,
	voiceNotes = [],
	onPlayVoiceNote,
	onRefresh,
	loadingNotes: externalLoadingNotes = false,
}: Pick<
	VoiceNotesListProps,
	"userId" | "voiceNotes" | "onPlayVoiceNote" | "onRefresh" | "loadingNotes"
>) => {
	const router = useRouter();
	const { user: currentUser } = useUser();
	
	// State management
	const [refreshing, setRefreshing] = useState(false);
	const [localVoiceNotes, setLocalVoiceNotes] =
		useState<VoiceNote[]>(voiceNotes);
	const [loadingNotes, setLoadingNotes] = useState(externalLoadingNotes);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const flatListRef = useRef<FlatList>(null);

	// Update local state when props change
	useEffect(() => {
		setLocalVoiceNotes(voiceNotes);
	}, [voiceNotes]);

	// Update loading state when external loading state changes
	useEffect(() => {
		setLoadingNotes(externalLoadingNotes);
	}, [externalLoadingNotes]);

	const handleRefresh = useCallback(() => {
		setRefreshing(true);
		if (onRefresh) {
			onRefresh();
		}
		setTimeout(() => setRefreshing(false), 1000);
	}, [onRefresh]);

	const handlePlayVoiceNote = useCallback(
		(voiceNoteId: string) => {
		if (currentUser?.id) {
			recordPlay(voiceNoteId, currentUser.id).catch((error: any) => {
				console.error("Error recording play:", error);
			});
		}

		if (onPlayVoiceNote) {
			onPlayVoiceNote(voiceNoteId);
		}
		},
		[onPlayVoiceNote, currentUser?.id]
	);

	const handleShare = useCallback(
		async (voiceNoteId: string) => {
		try {
			if (currentUser?.id) {
				await recordShare(voiceNoteId, currentUser.id);
			}
		} catch (error) {
			console.error("Error recording share:", error);
		}
		},
		[currentUser?.id]
	);

	const handleUserProfilePress = useCallback(
		(profileUsername?: string) => {
		if (!profileUsername) return;
		router.push(`/profile/${profileUsername}`);
		},
		[router]
	);

	const handleLoadMore = useCallback(() => {
		if (hasMore && !loadingNotes) {
			setPage((prev) => prev + 1);
		}
	}, [hasMore, loadingNotes]);

	const handleDelete = useCallback(async (voiceNoteId: string) => {
		try {
			await deleteVoiceNote(voiceNoteId);
			setLocalVoiceNotes((prev) =>
				prev.filter((note) => note.id !== voiceNoteId)
			);
		} catch (error) {
			console.error("Error deleting voice note:", error);
		}
	}, []);

	return {
		// State
		refreshing,
		localVoiceNotes,
		loadingNotes,
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
	};
}; 