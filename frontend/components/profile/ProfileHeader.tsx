import React from "react";
import { useRouter } from "expo-router";
import { useProfileHeader } from "./profile-header/hooks/useProfileHeader";
import { CollapsedHeader, ExpandedHeader } from "./profile-header/components";
import { PhotoViewerModal } from "./PhotoViewerModal";
import { ProfileHeaderProps } from "./profile-header/types";

export function ProfileHeader({
	userId,
	isCollapsed = false,
	postCount = 0,
	displayName,
	avatarUrl = null,
	coverPhotoUrl = null,
	bio = "",
	isVerified = false,
	isOwnProfile = false,
	username = "",
	onHeaderPress,
}: ProfileHeaderProps) {
	const router = useRouter();

	const {
		state,
		audioRef,
		progressContainerRef,
		handleVoiceBioCollapse,
		handleSeekStart,
		handleSeekEnd,
		handleSeek,
		handlePhotoPress,
		handlePhotoUpdated,
		handleToggleVoiceBio,
		handleExpandVoiceBio,
		closeModal,
	} = useProfileHeader({ userId, avatarUrl, coverPhotoUrl });

	const handleBackPress = () => {
		router.back();
	};

	if (isCollapsed) {
		return (
			<CollapsedHeader
				userId={userId}
				displayName={displayName}
				username={username}
				isVerified={isVerified}
				localAvatarUrl={state.localAvatarUrl}
				onHeaderPress={onHeaderPress}
				onBackPress={handleBackPress}
			/>
		);
	}

	return (
		<>
			<ExpandedHeader
				userId={userId}
				displayName={displayName}
				username={username}
				bio={bio}
				isVerified={isVerified}
				localAvatarUrl={state.localAvatarUrl}
				localCoverPhotoUrl={state.localCoverPhotoUrl}
				voiceBio={state.voiceBio}
				loadingVoiceBio={state.loadingVoiceBio}
				isVoiceBioPlaying={state.isVoiceBioPlaying}
				isExpanded={state.isExpanded}
				progress={state.progress}
				isSeeking={state.isSeeking}
				onPhotoPress={handlePhotoPress}
				onToggleVoiceBio={handleToggleVoiceBio}
				onExpandVoiceBio={handleExpandVoiceBio}
				onCollapseVoiceBio={handleVoiceBioCollapse}
				onSeekVoiceBio={handleSeek}
				audioRef={audioRef}
				progressContainerRef={progressContainerRef}
			/>

			{/* Photo viewer modal */}
			<PhotoViewerModal
				visible={state.modalVisible}
				onClose={closeModal}
				photoType={state.activePhoto}
				imageUrl={
					state.activePhoto === "profile"
						? state.localAvatarUrl
						: state.localCoverPhotoUrl
				}
				userId={userId}
				isOwnProfile={isOwnProfile}
				onPhotoUpdated={handlePhotoUpdated}
			/>
		</>
	);
}
