import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "../../../context/UserContext";
import {
	getUserProfileByUsername,
	getUserVoiceNotes,
	getUserSharedVoiceNotes,
	getFollowerCount,
	getFollowingCount,
} from "../../../services/api/userService";
import { getVoiceBio } from "../../../services/api";
import {
	getVoiceNoteById,
	getVoiceNoteStats,
} from "../../../services/api/voiceNoteService";
import { UserProfile, VoiceNote, VoiceBio, ProfilePageState } from "../types";
import { normalizePlaysCount } from "../utils";

export const useProfileData = (username: string) => {
	const { user: currentUser } = useUser();
	const mounted = useRef(true);

	const [state, setState] = useState<ProfilePageState>({
		userProfile: null,
		voiceNotes: [],
		sharedVoiceNotes: [],
		combinedVoiceNotes: [],
		voiceBio: null,
		followerCount: 0,
		followingCount: 0,
		loading: true,
		loadingVoiceNotes: true,
		loadingShared: false,
		refreshing: false,
		userNotFound: false,
		isOwnProfile: false,
		showFollowersPopup: false,
		showFollowingPopup: false,
		isHeaderCollapsed: false,
	});

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	const fetchUserData = useCallback(async () => {
		if (!username) return;

		try {
			setState(prev => ({ ...prev, loading: true, userNotFound: false }));

			// Fetch user profile
			const profileData = await getUserProfileByUsername(username);
			if (!profileData) {
				setState(prev => ({ ...prev, userNotFound: true, loading: false }));
				return;
			}

			if (!mounted.current) return;

			const isOwn = currentUser?.id === profileData.id;
			setState(prev => ({
				...prev,
				userProfile: {
					...profileData,
					cover_photo_url: profileData.cover_photo_url || null,
				} as UserProfile,
				isOwnProfile: isOwn,
			}));

			// Fetch additional data in parallel
			const [
				voiceNotesData,
				sharedNotesData,
				voiceBioData,
				followerCountData,
				followingCountData,
			] = await Promise.allSettled([
				getUserVoiceNotes(profileData.id),
				getUserSharedVoiceNotes(profileData.id),
				getVoiceBio(profileData.id),
				getFollowerCount(profileData.id),
				getFollowingCount(profileData.id),
			]);

			if (!mounted.current) return;

			// Process voice notes
			let processedVoiceNotes: VoiceNote[] = [];
			if (voiceNotesData.status === "fulfilled" && voiceNotesData.value) {
				processedVoiceNotes = await Promise.all(
					voiceNotesData.value.map(async (note: any) => {
						try {
							const stats = await getVoiceNoteStats(note.id);
							return {
								...note,
								likes: stats?.likes || 0,
								comments: stats?.comments || 0,
								plays: normalizePlaysCount(stats?.plays) || 0,
								shares: stats?.shares || 0,
							};
						} catch (error) {
							console.error(`Error fetching stats for note ${note.id}:`, error);
							return {
								...note,
								likes: 0,
								comments: 0,
								plays: 0,
								shares: 0,
							};
						}
					})
				);
			}

			// Process shared notes
			let processedSharedNotes: VoiceNote[] = [];
			if (sharedNotesData.status === "fulfilled" && sharedNotesData.value) {
				processedSharedNotes = await Promise.all(
					sharedNotesData.value.map(async (sharedNote: any) => {
						try {
							const originalNote = await getVoiceNoteById(sharedNote.voice_note_id);
							if (!originalNote) return null;

							const stats = await getVoiceNoteStats(originalNote.id);
							return {
								...originalNote,
								likes: stats?.likes || 0,
								comments: stats?.comments || 0,
								plays: normalizePlaysCount(stats?.plays) || 0,
								shares: stats?.shares || 0,
								is_shared: true,
								shared_at: sharedNote.created_at,
								shared_by: {
									id: profileData.id,
									username: profileData.username,
									display_name: profileData.display_name,
									avatar_url: profileData.avatar_url,
								},
							};
						} catch (error) {
							console.error(`Error processing shared note:`, error);
							return null;
						}
					})
				);
				processedSharedNotes = processedSharedNotes.filter(Boolean) as VoiceNote[];
			}

			// Combine and sort notes
			const combinedNotes = [...processedVoiceNotes, ...processedSharedNotes].sort(
				(a, b) => {
					const aDate = a.is_shared ? a.shared_at : a.created_at;
					const bDate = b.is_shared ? b.shared_at : b.created_at;
					return new Date(bDate!).getTime() - new Date(aDate!).getTime();
				}
			);

			if (!mounted.current) return;

			setState(prev => ({
				...prev,
				voiceNotes: processedVoiceNotes,
				sharedVoiceNotes: processedSharedNotes,
				combinedVoiceNotes: combinedNotes,
				voiceBio: voiceBioData.status === "fulfilled" ? voiceBioData.value as VoiceBio | null : null,
				followerCount: followerCountData.status === "fulfilled" ? followerCountData.value : 0,
				followingCount: followingCountData.status === "fulfilled" ? followingCountData.value : 0,
				loading: false,
				loadingVoiceNotes: false,
			}));

		} catch (error) {
			console.error("Error fetching user data:", error);
			if (mounted.current) {
				setState(prev => ({
					...prev,
					loading: false,
					loadingVoiceNotes: false,
					userNotFound: true,
				}));
			}
		}
	}, [username, currentUser?.id]);

	const handleRefresh = useCallback(async () => {
		setState(prev => ({ ...prev, refreshing: true }));
		try {
			await fetchUserData();
		} catch (error) {
			console.error("Error refreshing profile data:", error);
		} finally {
			if (mounted.current) {
				setState(prev => ({ ...prev, refreshing: false }));
			}
		}
	}, [fetchUserData]);

	const updateFollowerCount = useCallback((isFollowing: boolean, updatedCount?: number) => {
		if (typeof updatedCount === "number") {
			console.log(`Setting follower count to ${updatedCount} from server`);
			setState(prev => ({ ...prev, followerCount: updatedCount }));
		} else {
			console.log(`Using local calculation for follower count`);
			setState(prev => ({
				...prev,
				followerCount: isFollowing ? prev.followerCount + 1 : Math.max(0, prev.followerCount - 1),
			}));
		}
	}, []);

	const setShowFollowersPopup = useCallback((show: boolean) => {
		setState(prev => ({ ...prev, showFollowersPopup: show }));
	}, []);

	const setShowFollowingPopup = useCallback((show: boolean) => {
		setState(prev => ({ ...prev, showFollowingPopup: show }));
	}, []);

	const setIsHeaderCollapsed = useCallback((collapsed: boolean) => {
		setState(prev => ({ ...prev, isHeaderCollapsed: collapsed }));
	}, []);

	// Initialize data fetching
	useEffect(() => {
		if (username) {
			fetchUserData();
		}
	}, [username, fetchUserData]);

	return {
		...state,
		fetchUserData,
		handleRefresh,
		updateFollowerCount,
		setShowFollowersPopup,
		setShowFollowingPopup,
		setIsHeaderCollapsed,
	};
}; 