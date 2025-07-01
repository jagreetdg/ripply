import React from "react";
import { VoiceNoteCard } from "../../../voice-note-card/VoiceNoteCard";
import { VoiceNote } from "../VoiceNotesListTypes";
import { formatTimeAgo } from "../../../../utils/timeUtils";

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
	onUserProfilePress?: (username: string) => void;
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
	onUserProfilePress,
}) => {
	const isRepostedItem = Boolean(
		item.is_shared || item.shared_by || item.sharer_id
	);

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
		tags: item.tags || [],
		// Pass initial like/share status to the card
		is_liked: item.is_liked,
		is_shared: item.is_shared,
	};

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

	return (
		<VoiceNoteCard
			key={item.id}
			voiceNote={cardVoiceNote}
			userId={item.users?.id || item.user_id || userId}
			displayName={item.users?.display_name || userDisplayName}
			username={item.users?.username || username || ""}
			userAvatarUrl={item.users?.avatar_url || null}
			timePosted={formatTimeAgo(
				item.is_shared && item.shared_at ? item.shared_at : item.created_at
			)}
			onPlayPress={() => onPlayPress(item.id)}
			onShare={(voiceNoteId) => {
				onShare(voiceNoteId);
			}}
			onUserProfilePress={
				item.users?.username
					? () => onUserProfilePress?.(item.users?.username!)
					: undefined
			}
			currentUserId={currentUserId}
			sharedBy={sharedByProp}
			showRepostAttribution={isRepostedItem}
		/>
	);
};
