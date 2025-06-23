import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Animated,
	ActivityIndicator,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { formatNumber } from "./VoiceNoteCardUtils";
import { useVoiceNoteLike, useVoiceNoteShare } from "./hooks";

interface VoiceNoteInteractionsNewProps {
	styles: any;
	colors: any;
	hasBackgroundImage: boolean;
	voiceNote: {
		id: string;
		title?: string;
		likes?: number;
		shares?: number;
		comments?: number;
		plays?: number;
	};
	userId?: string;
	commentsCount: number;
	playsCount: number;
	commentScale: Animated.Value;
	commentPulse: Animated.Value;
	onCommentPress: () => void;
	onPlaysPress: () => void;
	onShareStatusChanged?: (voiceNoteId: string, isShared: boolean) => void;
	onVoiceNoteUnshared?: (voiceNoteId: string) => void;
}

export const VoiceNoteInteractionsNew: React.FC<
	VoiceNoteInteractionsNewProps
> = ({
	styles,
	colors,
	hasBackgroundImage,
	voiceNote,
	userId,
	commentsCount,
	playsCount,
	commentScale,
	commentPulse,
	onCommentPress,
	onPlaysPress,
	onShareStatusChanged,
	onVoiceNoteUnshared,
}) => {
	// Use our new clean hooks
	const {
		isLiked,
		likesCount,
		isLoading: isLoadingLike,
		likeScale,
		likePulse,
		handleLikePress,
	} = useVoiceNoteLike({
		voiceNoteId: voiceNote.id,
		userId,
		initialLikesCount: voiceNote.likes || 0,
	});

	const {
		isShared,
		sharesCount,
		isLoading: isLoadingShare,
		shareScale,
		sharePulse,
		handleSharePress,
		handleShareCountLongPress,
	} = useVoiceNoteShare({
		voiceNoteId: voiceNote.id,
		voiceNoteTitle: voiceNote.title,
		userId,
		initialSharesCount: voiceNote.shares || 0,
		onShareStatusChanged,
		onVoiceNoteUnshared,
	});

	// Determine if we should use the "OnImage" variants
	const useOnImageStyles = hasBackgroundImage;

	// Define colors based on whether we have a background image
	const iconColor = useOnImageStyles ? colors.card : colors.tabIconDefault;

	// Colors for like state
	const likedColor = isLiked
		? useOnImageStyles
			? colors.likedOnImage
			: colors.liked
		: iconColor;

	// Colors for share state
	const sharedColor = isShared
		? useOnImageStyles
			? colors.repostedOnImage
			: colors.reposted
		: iconColor;

	// Loading indicator styles
	const loadingIndicatorColor = useOnImageStyles ? colors.white : colors.tint;

	return (
		<View
			style={[
				styles.interactions,
				useOnImageStyles && styles.interactionsOnImage,
			]}
		>
			{/* Like button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={handleLikePress}
				disabled={isLoadingLike}
			>
				<View style={styles.interactionContent}>
					{isLoadingLike ? (
						<ActivityIndicator size={18} color={loadingIndicatorColor} />
					) : (
						<>
							<Animated.View
								style={[
									{
										transform: [
											{ scale: Animated.multiply(likeScale, likePulse) },
										],
									},
								]}
							>
								<MaterialIcons
									name={isLiked ? "favorite" : "favorite-border"}
									size={18}
									color={likedColor}
									style={isLiked ? { transform: [{ scale: 1.05 }] } : {}}
								/>
							</Animated.View>
							<Text
								style={[
									useOnImageStyles
										? styles.interactionTextOnImage
										: styles.interactionCount,
									{ color: likedColor },
								]}
							>
								{formatNumber(likesCount)}
							</Text>
						</>
					)}
				</View>
			</TouchableOpacity>

			{/* Comment button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={onCommentPress}
			>
				<View style={styles.interactionContent}>
					<Animated.View
						style={[
							{
								transform: [
									{ scale: Animated.multiply(commentScale, commentPulse) },
								],
							},
						]}
					>
						<Feather name="message-circle" size={18} color={iconColor} />
					</Animated.View>
					<Text
						style={[
							useOnImageStyles
								? styles.interactionTextOnImage
								: styles.interactionText,
							{ color: iconColor },
						]}
					>
						{formatNumber(commentsCount)}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Plays button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={onPlaysPress}
			>
				<View style={styles.interactionContent}>
					<View>
						<Feather name="headphones" size={18} color={iconColor} />
					</View>
					<Text
						style={[
							useOnImageStyles
								? styles.interactionTextOnImage
								: styles.interactionText,
							{ color: iconColor },
						]}
					>
						{formatNumber(playsCount)}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Share button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={handleSharePress}
				onLongPress={handleShareCountLongPress}
				disabled={isLoadingShare}
			>
				<View style={styles.interactionContent}>
					{isLoadingShare ? (
						<ActivityIndicator size={18} color={loadingIndicatorColor} />
					) : (
						<>
							<Animated.View
								style={[
									{
										transform: [
											{ scale: Animated.multiply(shareScale, sharePulse) },
										],
									},
								]}
							>
								<Feather
									name="repeat"
									size={18}
									color={sharedColor}
									style={isShared ? { transform: [{ scale: 1.05 }] } : {}}
								/>
							</Animated.View>
							<Text
								style={[
									useOnImageStyles
										? styles.interactionTextOnImage
										: styles.interactionCount,
									{ color: sharedColor },
								]}
							>
								{formatNumber(sharesCount)}
							</Text>
						</>
					)}
				</View>
			</TouchableOpacity>
		</View>
	);
};
