import React from "react";
import { StyleSheet } from "react-native";
import { View, ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../context/ThemeContext";
import Colors, { hexToRgba, opacityValues } from "../../constants/Colors";
import { CommentPopup } from "../comments/CommentPopup";
import { useVoiceNoteCardSimple } from "./hooks/useVoiceNoteCardSimple";
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

	// Use the simplified hook for non-interaction logic only
	const {
		loggedInUserId,
		isPlaying,
		progress,
		isSeeking,
		progressContainerRef,
		showCommentPopup,
		commentsCount,
		comments,
		isLoadingComments,
		playsCount,
		commentScale,
		commentPulse,
		handlePlayPress,
		handleProfilePress,
		handleCommentPress,
		handlePlaysPress,
		handleTagPress,
		handleProgressBarPress,
		handleProgressBarDrag,
		handleProgressBarRelease,
		handleCloseCommentPopup,
		handleCommentAdded,
	} = useVoiceNoteCardSimple({
		voiceNote,
		userId,
		currentUserId,
		onPlay,
		onPlayPress,
		onProfilePress,
		onUserProfilePress,
	});

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
						commentScale={commentScale}
						commentPulse={commentPulse}
						commentsCount={commentsCount}
						playsCount={playsCount}
						showRepostAttribution={showRepostAttribution}
						sharedBy={sharedBy}
						onProfilePress={handleProfilePress}
						onPlayPress={handlePlayPress}
						onProgressBarPress={handleProgressBarPress}
						onProgressBarDrag={handleProgressBarDrag}
						onProgressBarRelease={handleProgressBarRelease}
						onTagPress={handleTagPress}
						onCommentPress={handleCommentPress}
						onPlaysPress={handlePlaysPress}
						onShareStatusChanged={onShareStatusChanged}
						onVoiceNoteUnshared={onVoiceNoteUnshared}
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
						commentScale={commentScale}
						commentPulse={commentPulse}
						commentsCount={commentsCount}
						playsCount={playsCount}
						showRepostAttribution={showRepostAttribution}
						sharedBy={sharedBy}
						onProfilePress={handleProfilePress}
						onPlayPress={handlePlayPress}
						onProgressBarPress={handleProgressBarPress}
						onProgressBarDrag={handleProgressBarDrag}
						onProgressBarRelease={handleProgressBarRelease}
						onTagPress={handleTagPress}
						onCommentPress={handleCommentPress}
						onPlaysPress={handlePlaysPress}
						onShareStatusChanged={onShareStatusChanged}
						onVoiceNoteUnshared={onVoiceNoteUnshared}
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
