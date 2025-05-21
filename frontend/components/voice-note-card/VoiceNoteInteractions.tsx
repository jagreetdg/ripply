import React from "react";
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { formatNumber } from "./VoiceNoteCardUtils"; // Path remains ./

interface VoiceNoteInteractionsProps {
	styles: any;
	colors: any;
	hasBackgroundImage: boolean;
	isLiked: boolean;
	likeScale: Animated.Value;
	likesCount: number;
	commentsCount: number;
	playsCount: number;
	isShared: boolean;
	shareScale: Animated.Value;
	sharesCount: number;
	isLoadingShareCount: boolean;
	isLoadingStats?: boolean; // Add loading state for all stats
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
	likesCount,
	commentsCount,
	playsCount,
	isShared,
	shareScale,
	sharesCount,
	isLoadingShareCount,
	isLoadingStats = false,
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
	const likedColor = isLiked
		? useOnImageStyles
			? colors.likedOnImage
			: colors.liked
		: iconColor;
	const repostedColor = isShared
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
					<Animated.View style={[{ transform: [{ scale: likeScale }] }]}>
						<Feather
							name={isLiked ? (useOnImageStyles ? "heart" : "heart") : "heart"}
							size={18}
							color={likedColor}
							style={isLiked ? { transform: [{ scale: 1.05 }] } : {}}
						/>
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
					<View>
						<Feather name="message-circle" size={18} color={iconColor} />
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
				disabled={isLoadingShareCount || isLoadingStats}
			>
				<View style={styles.interactionContent}>
					<Animated.View style={[{ transform: [{ scale: shareScale }] }]}>
						<Feather
							name={"repeat"}
							size={18}
							color={repostedColor}
							style={isShared ? { transform: [{ scale: 1.05 }] } : {}}
						/>
					</Animated.View>
					{isLoadingStats || isLoadingShareCount ? (
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
									color: repostedColor,
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
