import React from "react";
import { VoiceNoteCardImpl } from "./VoiceNoteCardImpl";
import { VoiceNoteCardProps } from "./VoiceNoteCardTypes";

/**
 * VoiceNoteCard component displays a single voice note card
 * This is a simple wrapper around VoiceNoteCardImpl for cleaner imports
 */
export function VoiceNoteCard({
	voiceNote,
	userId,
	displayName,
	username,
	userAvatarUrl,
	timePosted,
	onPlay,
	onPlayPress,
	onProfilePress,
	onUserProfilePress,
	onShare,
	onShareStatusChanged,
	onVoiceNoteUnshared,
	currentUserId,
	isReposted,
	isLoadingRepostStatus,
	sharedBy,
	showRepostAttribution,
	voiceNoteUsers,
}: VoiceNoteCardProps) {
	return (
		<VoiceNoteCardImpl
			voiceNote={voiceNote}
			userId={userId}
			displayName={displayName}
			username={username}
			userAvatarUrl={userAvatarUrl}
			timePosted={timePosted}
			onPlay={onPlay}
			onPlayPress={onPlayPress}
			onProfilePress={onProfilePress}
			onUserProfilePress={onUserProfilePress}
			onShare={onShare}
			onShareStatusChanged={onShareStatusChanged}
			onVoiceNoteUnshared={onVoiceNoteUnshared}
			currentUserId={currentUserId}
			isReposted={isReposted}
			isLoadingRepostStatus={isLoadingRepostStatus}
			sharedBy={sharedBy}
			showRepostAttribution={showRepostAttribution}
			voiceNoteUsers={voiceNoteUsers}
		/>
	);
}
