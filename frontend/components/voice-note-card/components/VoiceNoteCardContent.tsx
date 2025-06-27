import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { VoiceNoteUserInfo } from "../VoiceNoteUserInfo";
import { VoiceNoteProgressBar } from "../VoiceNoteProgressBar";
import { VoiceNoteTags } from "../VoiceNoteTags";
import { VoiceNoteInteractionsClean } from "../VoiceNoteInteractionsClean";
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
	commentScale: any;
	commentPulse: any;
	commentsCount: number;
	playsCount: number;
	showRepostAttribution?: boolean;
	sharedBy?: any;
	onProfilePress: () => void;
	onPlayPress: () => void;
	onProgressBarPress: (event: any) => void;
	onProgressBarDrag: (event: any) => void;
	onProgressBarRelease: () => void;
	onTagPress: (tag: string) => void;
	onCommentPress: () => void;
	onPlaysPress: () => void;
	onShareStatusChanged?: (voiceNoteId: string, isShared: boolean) => void;
	onVoiceNoteUnshared?: (voiceNoteId: string) => void;
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
	commentScale,
	commentPulse,
	commentsCount,
	playsCount,
	showRepostAttribution,
	sharedBy,
	onProfilePress,
	onPlayPress,
	onProgressBarPress,
	onProgressBarDrag,
	onProgressBarRelease,
	onTagPress,
	onCommentPress,
	onPlaysPress,
	onShareStatusChanged,
	onVoiceNoteUnshared,
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
			<VoiceNoteInteractionsClean
				voiceNote={voiceNote}
				onOpenComments={onCommentPress}
				onLikeStatusChanged={(isLiked, likesCount) => {
					// Optional: handle like status changes if needed
				}}
				onShareStatusChanged={(isShared, sharesCount) => {
					// Call the parent callback if provided
					onShareStatusChanged?.(voiceNote.id, isShared);
				}}
			/>
		</View>
	);
};
