import React from "react";
import { StyleSheet } from "react-native";
import { View, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../context/ThemeContext";
import Colors, { hexToRgba, opacityValues } from "../../constants/Colors";
import { CommentPopup } from "../comments/CommentPopup";
import { useVoiceNoteCard } from "./hooks/useVoiceNoteCard";
import { VoiceNoteCardContent, VoiceNoteRepostAttribution } from "./components";
import { VoiceNoteCardProps } from "./VoiceNoteCardTypes";
import { getStyles } from "./VoiceNoteCardStyles";

export function VoiceNoteCardImpl({
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
	isReposted: isRepostedProp,
	isLoadingRepostStatus: isLoadingRepostStatusProp = false,
	sharedBy,
	showRepostAttribution,
	voiceNoteUsers,
}: VoiceNoteCardProps) {
	const { colors, isDarkMode } = useTheme();

	// Check if this voice note has a background image
	const hasBackgroundImage = !!voiceNote.backgroundImage;

	// For voice notes with background images, always use light mode colors
	const effectiveColors = hasBackgroundImage ? Colors.light : colors;
	const effectiveIsDarkMode = hasBackgroundImage ? false : isDarkMode;

	// Get styles based on effective theme and background image presence
	const styles = getStyles(
		effectiveColors,
		effectiveIsDarkMode,
		hasBackgroundImage
	);

	// Determine overlay intensity based on theme
	const overlayIntensity = isDarkMode
		? opacityValues.heavy
		: opacityValues.semitransparent;

	// Combine username sources with fallbacks
	const effectiveUsername = username || voiceNoteUsers?.username || "user";
	const effectiveDisplayName =
		displayName || voiceNoteUsers?.display_name || "User";
	const effectiveAvatarUrl =
		userAvatarUrl || voiceNoteUsers?.avatar_url || null;

	// Use the custom hook for all business logic
	const {
		isPlaying,
		progress,
		isSeeking,
		isLiked,
		likesCount,
		sharesCount,
		isLoadingShareCount,
		showCommentPopup,
		commentsCount,
		comments,
		isLoadingComments,
		playsCount,
		statsLoaded,
		isRepostedEffective,
		loggedInUserId,
		progressContainerRef,
		// Loading states
		isLoadingAllStats,
		isLoadingLikeStatus,
		isLoadingRepostStatus,
		isLoadingSharesCount,
		initialDataLoaded,
		// Animation values
		likeScale,
		shareScale,
		commentScale,
		likePulse,
		sharePulse,
		commentPulse,
		// Handlers
		handlePlayPress,
		handleProfilePress,
		handleLikePress,
		handleCommentPress,
		handlePlaysPress,
		handleRepostPress,
		handleShareCountLongPress,
		handleTagPress,
		handleProgressBarPress,
		handleProgressBarDrag,
		handleProgressBarRelease,
		handleCloseCommentPopup,
		handleCommentAdded,
	} = useVoiceNoteCard({
		voiceNote,
		userId,
		currentUserId,
		isReposted: isRepostedProp,
		isLoadingRepostStatus: isLoadingRepostStatusProp,
		onPlay,
		onPlayPress,
		onProfilePress,
		onUserProfilePress,
		onShare,
		onShareStatusChanged,
		onVoiceNoteUnshared,
	});

	// Use the comprehensive loading state from the hook
	const isLoadingStats = isLoadingAllStats;

	// Render the card
	return (
		<View style={styles.cardOuterContainer}>
			{hasBackgroundImage ? (
				<ImageBackground
					source={{ uri: voiceNote.backgroundImage || undefined }}
					style={styles.container}
					imageStyle={{ borderRadius: 16 }}
					resizeMode="cover"
				>
					{/* Add blur effect for better text readability */}
					<BlurView
						intensity={8}
						tint={isDarkMode ? "dark" : "light"}
						style={{
							...StyleSheet.absoluteFillObject,
							borderRadius: 16,
						}}
					/>

					{/* Add overlay with adaptive intensity based on theme */}
					<View
						style={[
							styles.overlay,
							{ backgroundColor: hexToRgba(colors.black, overlayIntensity) },
						]}
					/>

					{/* Repost attribution */}
					<VoiceNoteRepostAttribution
						showRepostAttribution={showRepostAttribution}
						sharedBy={sharedBy}
						hasBackgroundImage={hasBackgroundImage}
						styles={styles}
						colors={effectiveColors}
						isDarkMode={effectiveIsDarkMode}
					/>

					{/* Card content */}
					<VoiceNoteCardContent
						voiceNote={voiceNote}
						userId={userId || "user"}
						displayName={effectiveDisplayName}
						username={effectiveUsername}
						avatarUrl={effectiveAvatarUrl}
						timePosted={timePosted || ""}
						hasBackgroundImage={hasBackgroundImage}
						styles={styles}
						colors={effectiveColors}
						isDarkMode={effectiveIsDarkMode}
						isPlaying={isPlaying}
						progress={progress}
						progressContainerRef={progressContainerRef}
						isLiked={isLiked}
						likeScale={likeScale}
						shareScale={shareScale}
						commentScale={commentScale}
						likePulse={likePulse}
						sharePulse={sharePulse}
						commentPulse={commentPulse}
						likesCount={likesCount}
						commentsCount={commentsCount}
						playsCount={playsCount}
						isReposted={isRepostedEffective}
						sharesCount={sharesCount}
						isLoadingShareCount={isLoadingSharesCount}
						isLoadingStats={isLoadingStats}
						isLoadingRepostStatus={isLoadingRepostStatus}
						onProfilePress={handleProfilePress}
						onPlayPress={handlePlayPress}
						onProgressBarPress={handleProgressBarPress}
						onProgressBarDrag={handleProgressBarDrag}
						onProgressBarRelease={handleProgressBarRelease}
						onTagPress={handleTagPress}
						onLikePress={handleLikePress}
						onCommentPress={handleCommentPress}
						onPlaysPress={handlePlaysPress}
						onRepostPress={handleRepostPress}
						onShareCountLongPress={handleShareCountLongPress}
					/>
				</ImageBackground>
			) : (
				<View
					style={[
						styles.container,
						!hasBackgroundImage && styles.plainContainer,
					]}
				>
					{/* Repost attribution */}
					<VoiceNoteRepostAttribution
						showRepostAttribution={showRepostAttribution}
						sharedBy={sharedBy}
						hasBackgroundImage={hasBackgroundImage}
						styles={styles}
						colors={effectiveColors}
						isDarkMode={effectiveIsDarkMode}
					/>

					{/* Card content */}
					<VoiceNoteCardContent
						voiceNote={voiceNote}
						userId={userId || "user"}
						displayName={effectiveDisplayName}
						username={effectiveUsername}
						avatarUrl={effectiveAvatarUrl}
						timePosted={timePosted || ""}
						hasBackgroundImage={hasBackgroundImage}
						styles={styles}
						colors={effectiveColors}
						isDarkMode={effectiveIsDarkMode}
						isPlaying={isPlaying}
						progress={progress}
						progressContainerRef={progressContainerRef}
						isLiked={isLiked}
						likeScale={likeScale}
						shareScale={shareScale}
						commentScale={commentScale}
						likePulse={likePulse}
						sharePulse={sharePulse}
						commentPulse={commentPulse}
						likesCount={likesCount}
						commentsCount={commentsCount}
						playsCount={playsCount}
						isReposted={isRepostedEffective}
						sharesCount={sharesCount}
						isLoadingShareCount={isLoadingSharesCount}
						isLoadingStats={isLoadingStats}
						isLoadingRepostStatus={isLoadingRepostStatus}
						onProfilePress={handleProfilePress}
						onPlayPress={handlePlayPress}
						onProgressBarPress={handleProgressBarPress}
						onProgressBarDrag={handleProgressBarDrag}
						onProgressBarRelease={handleProgressBarRelease}
						onTagPress={handleTagPress}
						onLikePress={handleLikePress}
						onCommentPress={handleCommentPress}
						onPlaysPress={handlePlaysPress}
						onRepostPress={handleRepostPress}
						onShareCountLongPress={handleShareCountLongPress}
					/>
				</View>
			)}

			{/* Comment Popup */}
			<CommentPopup
				visible={showCommentPopup}
				voiceNoteId={voiceNote.id}
				currentUserId={loggedInUserId}
				onClose={handleCloseCommentPopup}
				onCommentAdded={handleCommentAdded}
			/>
		</View>
	);
}
