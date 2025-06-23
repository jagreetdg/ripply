import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { VoiceNoteUserInfo } from "../VoiceNoteUserInfo";
import { VoiceNoteProgressBar } from "../VoiceNoteProgressBar";
import { VoiceNoteTags } from "../VoiceNoteTags";
import { VoiceNoteInteractionsNew } from "../VoiceNoteInteractionsNew";
import { formatDuration } from "../VoiceNoteCardUtils";

interface VoiceNoteCardContentProps {
	voiceNote: any;
	userId: string;
	displayName: string;
	username: string;
	avatarUrl: string | null;
	timePosted: string;
	hasBackgroundImage: boolean;
	styles: any;
	colors: any;
	isDarkMode: boolean;
	isPlaying: boolean;
	progress: number;
	progressContainerRef: React.RefObject<any>;
	isLiked: boolean;
	likeScale: any;
	shareScale: any;
	commentScale: any;
	likePulse: any;
	sharePulse: any;
	commentPulse: any;
	likesCount: number;
	commentsCount: number;
	playsCount: number;
	isReposted: boolean;
	sharesCount: number;

	isLoadingShareCount: boolean;
	isLoadingStats: boolean;
	isLoadingRepostStatus: boolean;
	showRepostAttribution?: boolean;
	sharedBy?: any;
	onProfilePress: () => void;
	onPlayPress: () => void;
	onProgressBarPress: (event: any) => void;
	onProgressBarDrag: (event: any) => void;
	onProgressBarRelease: () => void;
	onTagPress: (tag: string) => void;
	onLikePress: () => void;
	onCommentPress: () => void;
	onPlaysPress: () => void;
	onRepostPress: () => void;
	onShareCountLongPress: () => void;
}

export const VoiceNoteCardContent: React.FC<VoiceNoteCardContentProps> = ({
	voiceNote,
	userId,
	displayName,
	username,
	avatarUrl,
	timePosted,
	hasBackgroundImage,
	styles,
	colors,
	isDarkMode,
	isPlaying,
	progress,
	progressContainerRef,
	isLiked,
	likeScale,
	shareScale,
	commentScale,
	likePulse,
	sharePulse,
	commentPulse,
	likesCount,
	commentsCount,
	playsCount,
	isReposted,
	sharesCount,
	isLoadingShareCount,
	isLoadingStats,
	isLoadingRepostStatus,
	showRepostAttribution,
	sharedBy,
	onProfilePress,
	onPlayPress,
	onProgressBarPress,
	onProgressBarDrag,
	onProgressBarRelease,
	onTagPress,
	onLikePress,
	onCommentPress,
	onPlaysPress,
	onRepostPress,
	onShareCountLongPress,
}) => {
	const titleStyle = hasBackgroundImage ? styles.titleOnImage : styles.title;

	return (
		<View style={styles.content}>
			{/* User info header */}
			{(userId || displayName) && (
				<VoiceNoteUserInfo
					styles={styles}
					userId={userId || "user"}
					displayName={displayName}
					username={username}
					avatarUrl={avatarUrl}
					timePosted={timePosted}
					hasBackgroundImage={hasBackgroundImage}
					onProfilePress={onProfilePress}
					colors={colors}
				/>
			)}

			{/* Title */}
			<Text style={titleStyle}>{voiceNote.title}</Text>

			{/* Player controls */}
			<View style={styles.playerContainer}>
				<TouchableOpacity
					onPress={onPlayPress}
					style={[
						styles.playButton,
						hasBackgroundImage && styles.playButtonOnImage,
					]}
					activeOpacity={0.7}
				>
					<MaterialIcons
						name={isPlaying ? "pause" : "play-arrow"}
						size={24}
						color={hasBackgroundImage ? colors.text : colors.background}
					/>
				</TouchableOpacity>

				{/* Progress bar */}
				<VoiceNoteProgressBar
					progress={progress}
					colors={colors}
					isDarkMode={isDarkMode}
					hasBackgroundImage={hasBackgroundImage}
					onProgressBarPress={onProgressBarPress}
					onProgressBarDrag={onProgressBarDrag}
					onProgressBarRelease={onProgressBarRelease}
					progressContainerRef={progressContainerRef}
				/>

				{/* Duration */}
				<Text
					style={hasBackgroundImage ? styles.durationOnImage : styles.duration}
				>
					{formatDuration(voiceNote.duration)}
				</Text>
			</View>

			{/* Tags */}
			<VoiceNoteTags
				styles={styles}
				tags={voiceNote.tags || []}
				hasBackgroundImage={hasBackgroundImage}
				onTagPress={onTagPress}
				colors={colors}
			/>

			{/* Interaction buttons */}
			<VoiceNoteInteractionsNew
				voiceNote={voiceNote}
				styles={styles}
				colors={colors}
				hasBackgroundImage={hasBackgroundImage}
				userId={userId}
				commentsCount={commentsCount}
				playsCount={playsCount}
				commentScale={commentScale}
				commentPulse={commentPulse}
				onCommentPress={onCommentPress}
				onPlaysPress={onPlaysPress}
			/>
		</View>
	);
};
