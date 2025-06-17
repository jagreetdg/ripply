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

interface VoiceNoteInteractionsProps {
	styles: any;
	colors: any;
	hasBackgroundImage: boolean;
	isLiked: boolean;
	likeScale: Animated.Value;
	shareScale: Animated.Value;
	commentScale: Animated.Value;
	likePulse: Animated.Value;
	sharePulse: Animated.Value;
	commentPulse: Animated.Value;
	likesCount: number;
	commentsCount: number;
	playsCount: number;
	isReposted: boolean; // Renamed from isShared for clarity
	sharesCount: number;
	isLoadingShareCount: boolean;
	isLoadingStats?: boolean; // Add loading state for all stats
	isLoadingRepostStatus?: boolean; // Renamed from isLoadingShareStatus
	handleLikePress: () => void;
	handleCommentPress: () => void;
	handlePlaysPress: () => void;
	handleRepostPress: () => void;
	handleShareCountLongPress?: () => void;
}

/**
 * Component for the interaction buttons in VoiceNoteCard
 */
export const VoiceNoteInteractions: React.FC<VoiceNoteInteractionsProps> = ({
	styles,
	colors,
	hasBackgroundImage,
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
	isReposted, // Renamed from isShared
	sharesCount,
	isLoadingShareCount,
	isLoadingStats = false,
	isLoadingRepostStatus = false, // Renamed from isLoadingShareStatus
	handleLikePress,
	handleCommentPress,
	handlePlaysPress,
	handleRepostPress,
	handleShareCountLongPress,
}) => {
	// Determine if we should use the "OnImage" variants
	const useOnImageStyles = hasBackgroundImage;

	// Define colors based on whether we have a background image
	const iconColor = useOnImageStyles ? colors.card : colors.tabIconDefault;

	// Static colors for like state
	const likedColor = isLiked
		? useOnImageStyles
			? colors.likedOnImage
			: colors.liked
		: iconColor;

	// Static colors for repost state
	const repostColor = Boolean(isReposted)
		? useOnImageStyles
			? colors.repostedOnImage
			: colors.reposted
		: iconColor;

	// Loading indicator styles
	const loadingIndicatorColor = useOnImageStyles ? colors.white : colors.tint;
	const loadingIndicatorSize = 14;

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
				disabled={isLoadingStats}
			>
				<View style={styles.interactionContent}>
					<Animated.View
						style={[
							{
								transform: [{ scale: Animated.multiply(likeScale, likePulse) }],
							},
						]}
					>
						<Animated.View>
							<MaterialIcons
								name={isLiked ? "favorite" : "favorite-border"}
								size={18}
								color={likedColor}
								style={isLiked ? { transform: [{ scale: 1.05 }] } : {}}
							/>
						</Animated.View>
					</Animated.View>
					{isLoadingStats ? (
						<ActivityIndicator
							size={loadingIndicatorSize}
							color={loadingIndicatorColor}
							style={{ marginLeft: 5 }}
						/>
					) : (
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
					)}
				</View>
			</TouchableOpacity>

			{/* Comment button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={handleCommentPress}
				disabled={isLoadingStats}
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
					{isLoadingStats ? (
						<ActivityIndicator
							size={loadingIndicatorSize}
							color={loadingIndicatorColor}
							style={{ marginLeft: 5 }}
						/>
					) : (
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
					)}
				</View>
			</TouchableOpacity>

			{/* Plays button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={handlePlaysPress}
				disabled={isLoadingStats}
			>
				<View style={styles.interactionContent}>
					<View>
						<Feather name="headphones" size={18} color={iconColor} />
					</View>
					{isLoadingStats ? (
						<ActivityIndicator
							size={loadingIndicatorSize}
							color={loadingIndicatorColor}
							style={{ marginLeft: 5 }}
						/>
					) : (
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
					)}
				</View>
			</TouchableOpacity>

			{/* Repost button */}
			<TouchableOpacity
				style={styles.interactionButton}
				activeOpacity={0.7}
				onPress={handleRepostPress}
				onLongPress={handleShareCountLongPress}
				disabled={
					isLoadingShareCount || isLoadingStats || isLoadingRepostStatus
				}
			>
				<View style={styles.interactionContent}>
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
							name={"repeat"}
							size={18}
							color={repostColor}
							style={isReposted ? { transform: [{ scale: 1.05 }] } : {}}
						/>
					</Animated.View>
					{isLoadingStats || isLoadingShareCount || isLoadingRepostStatus ? (
						<ActivityIndicator
							size={loadingIndicatorSize}
							color={loadingIndicatorColor}
							style={{ marginLeft: 5 }}
						/>
					) : (
						<Text
							style={[
								useOnImageStyles
									? styles.interactionTextOnImage
									: styles.interactionCount,
								{
									color: repostColor,
								},
							]}
						>
							{formatNumber(sharesCount)}
						</Text>
					)}
				</View>
			</TouchableOpacity>
		</View>
	);
};
