import React from "react";
import { useFollowersFollowingPopup } from "./followers-following-popup/hooks/useFollowersFollowingPopup";
import { FollowersFollowingModal } from "./followers-following-popup/components/FollowersFollowingModal";
import { FollowersFollowingPopupProps } from "./followers-following-popup/types";

export function FollowersFollowingPopup({
	visible,
	userId,
	onClose,
	initialTab,
}: FollowersFollowingPopupProps) {
	const {
		state,
		currentUser,
		isFollowersTab,
		handleFollowChange,
		handleProfilePress,
	} = useFollowersFollowingPopup(userId, initialTab, visible);

	return (
		<FollowersFollowingModal
			visible={visible}
			users={state.users}
			loading={state.loading}
			isFollowersTab={isFollowersTab}
			currentUserId={currentUser?.id}
			renderKey={state.renderKey}
			onClose={onClose}
			onProfilePress={handleProfilePress}
			onFollowChange={handleFollowChange}
		/>
	);
}
