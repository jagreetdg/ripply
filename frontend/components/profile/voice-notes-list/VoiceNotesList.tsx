import React from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useVoiceNotesList } from "./hooks/useVoiceNotesList";
import {
	VoiceNotesListItem,
	VoiceNotesEmptyState,
	VoiceNotesListSeparator,
} from "./components";
import { VoiceNotesListProps, VoiceNote } from "./VoiceNotesListTypes";
import { getStyles } from "./VoiceNotesListStyles";

export function VoiceNotesList({
	userId,
	username,
	displayName,
	voiceNotes = [],
	onPlayVoiceNote,
	onRefresh,
	showRepostAttribution = false,
	listHeaderComponent,
	isOwnProfile,
	activeTab,
	loadingNotes: externalLoadingNotes = false,
}: VoiceNotesListProps) {
	const { colors, isDarkMode } = useTheme();

	const {
		refreshing,
		localVoiceNotes,
		loadingNotes,
		flatListRef,
		currentUser,
		handleRefresh,
		handlePlayVoiceNote,
		handleShare,
		handleUserProfilePress,
		handleLoadMore,
	} = useVoiceNotesList({
		userId,
		voiceNotes,
		onPlayVoiceNote,
		onRefresh,
		loadingNotes: externalLoadingNotes,
	});

	const styles = getStyles(colors, listHeaderComponent, isDarkMode);
	const userDisplayName = displayName || "User";

	const renderItem = ({ item }: { item: VoiceNote }) => (
		<VoiceNotesListItem
			item={item}
			userId={userId}
			username={username || ""}
			userDisplayName={userDisplayName}
			currentUserId={currentUser?.id}
			isOwnProfile={isOwnProfile}
			showRepostAttribution={showRepostAttribution}
			onPlayPress={handlePlayVoiceNote}
			onShare={handleShare}
			onUserProfilePress={handleUserProfilePress}
		/>
	);

	const renderEmptyComponent = () => {
		const isLoading =
			externalLoadingNotes || (localVoiceNotes.length === 0 && loadingNotes);

		return (
			<VoiceNotesEmptyState
				isLoading={isLoading}
				activeTab={activeTab}
				isOwnProfile={isOwnProfile}
				listHeaderComponent={listHeaderComponent}
			/>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<VoiceNotesListSeparator listHeaderComponent={listHeaderComponent} />

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
