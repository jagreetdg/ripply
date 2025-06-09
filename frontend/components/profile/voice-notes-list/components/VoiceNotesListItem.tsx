import React, { useEffect, useState } from "react";
import { VoiceNoteCard } from "../../../voice-note-card/VoiceNoteCard";
import { VoiceNote } from "../VoiceNotesListTypes";
import { formatRelativeTime } from "../VoiceNotesListUtils";
import { hasUserRepostedVoiceNote } from "../../../../services/api";

interface VoiceNotesListItemProps {
	item: VoiceNote;
	userId: string;
	username: string | undefined;
	userDisplayName: string;
	currentUserId?: string;
	isOwnProfile?: boolean;
	showRepostAttribution?: boolean;
	onPlayPress: (voiceNoteId: string) => void;
	onShare: (voiceNoteId: string) => void;
	onShareStatusChanged: (voiceNoteId: string, isShared: boolean) => void;
	onUserProfilePress?: (username: string) => void;
	onVoiceNoteUnshared: (voiceNoteId: string) => void;
}

export const VoiceNotesListItem: React.FC<VoiceNotesListItemProps> = ({
	item,
	userId,
	username,
	userDisplayName,
	currentUserId,
	isOwnProfile,
	showRepostAttribution,
	onPlayPress,
	onShare,
	onShareStatusChanged,
	onUserProfilePress,
	onVoiceNoteUnshared,
}) => {
	const [isRepostedByCurrentUser, setIsRepostedByCurrentUser] =
		useState<boolean>(false);
	const [isLoadingRepostStatus, setIsLoadingRepostStatus] =
		useState<boolean>(true);

	// Check if the current user has reposted this note
	useEffect(() => {
		const checkRepostStatus = async () => {
			if (!currentUserId) {
				setIsLoadingRepostStatus(false);
				return;
			}

			setIsLoadingRepostStatus(true);

			try {
				console.log(
					`[PROFILE] Checking repost status for note ${item.id} by user ${currentUserId}`
				);
				const hasReposted = await hasUserRepostedVoiceNote(
					item.id,
					currentUserId
				);
				console.log(`[PROFILE] Note ${item.id} repost status: ${hasReposted}`);
				setIsRepostedByCurrentUser(hasReposted);
			} catch (error) {
				console.error(
					`[PROFILE] Error checking repost status for note ${item.id}:`,
					error
				);
				setIsRepostedByCurrentUser(false);
			} finally {
				setIsLoadingRepostStatus(false);
			}
		};

		checkRepostStatus();
	}, [item.id, currentUserId]);

	// Determine if this is a reposted item
	const isRepostedItem = Boolean(
		item.is_shared || item.shared_by || item.sharer_id
	);

	// Create the voice note object for the card
	const cardVoiceNote = {
		id: item.id,
		title: item.title,
		duration: item.duration,
		audio_url: item.audio_url,
		created_at: item.created_at,
		likes: item.likes,
		comments: item.comments,
		plays: item.plays,
		shares: item.shares,
		user_id: item.user_id,
		users: item.users,
		backgroundImage: item.background_image || null,
	};

	// Determine shared by information
	let sharedByProp = undefined;
	if (isRepostedItem && showRepostAttribution) {
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

	// Determine if the current user is the owner of the note
	const isOwnerOfDisplayedNote = item.user_id === currentUserId;

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
			onPlayPress={() => onPlayPress(item.id)}
			onShare={(voiceNoteId) => {
				onShare(voiceNoteId);
			}}
			onShareStatusChanged={(voiceNoteId, isShared) => {
				console.log(
					`[PROFILE] Share status changed for note ${voiceNoteId}: ${isShared}`
				);
				setIsRepostedByCurrentUser(isShared);
				onShareStatusChanged(voiceNoteId, isShared);
			}}
			onUserProfilePress={
				item.users?.username
					? () => onUserProfilePress?.(item.users?.username!)
					: undefined
			}
			currentUserId={currentUserId}
			isReposted={isRepostedByCurrentUser}
			isLoadingRepostStatus={isLoadingRepostStatus}
			sharedBy={sharedByProp}
			showRepostAttribution={isRepostedItem}
			onVoiceNoteUnshared={onVoiceNoteUnshared}
		/>
	);
};
