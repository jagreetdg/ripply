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
	showRepostAttribution?: boolean;
	sharedBy?: any;
	handleLikePress: () => void;
	handleCommentPress: () => void;
	handlePlaysPress: () => void;
	handleRepostPress: () => void;
	handleShareCountLongPress?: () => void;
	voiceNote?: any; // Added for voiceNote prop
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
	showRepostAttribution,
	sharedBy,
	handleLikePress,
	handleCommentPress,
	handlePlaysPress,
	handleRepostPress,
	handleShareCountLongPress,
	voiceNote,
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

	// EXTREMELY AGGRESSIVE CONSISTENCY FIX: Check multiple conditions that suggest shares should be > 0
	const shouldHaveShares =
		isReposted ||
		voiceNote?.currentUserHasShared ||
		voiceNote?.isReposted ||
		voiceNote?.is_shared ||
		showRepostAttribution ||
		sharedBy ||
		voiceNote?.shared_by;

	const displaySharesCount =
		shouldHaveShares && sharesCount === 0 ? 1 : sharesCount;

	// EMERGENCY HARD-CODED FIX: If share icon is green (repost color), force count to be at least 1
	const isShareIconGreen = repostColor !== iconColor; // Green color means user has shared
	const emergencyFixedShareCount =
		isShareIconGreen && displaySharesCount === 0 ? 1 : displaySharesCount;

	// SUPER AGGRESSIVE FIX: Force count to 1 if ANY repost indicator is present
	const finalShareCount =
		(isReposted ||
			showRepostAttribution ||
			sharedBy ||
			voiceNote?.shared_by ||
			isShareIconGreen) &&
		emergencyFixedShareCount === 0
			? 1
			: emergencyFixedShareCount;

	// ALWAYS log for debugging - even when no fix is needed
	console.log("[SHARE COUNT DEBUG] VoiceNoteInteractions:", {
		voiceNoteId: voiceNote?.id,
		isReposted,
		sharesCount,
		displaySharesCount,
		emergencyFixedShareCount,
		finalShareCount,
		shouldHaveShares,
		isShareIconGreen,
		repostColor,
		iconColor,
		// Check all possible repost indicators
		voiceNoteCurrentUserHasShared: voiceNote?.currentUserHasShared,
		voiceNoteIsReposted: voiceNote?.isReposted,
		voiceNoteIsShared: voiceNote?.is_shared,
		voiceNoteShowRepostAttribution: showRepostAttribution,
		voiceNoteSharedBy: sharedBy,
		voiceNoteShared_by: voiceNote?.shared_by,
		// Loading states
		isLoadingShareCount,
		isLoadingStats,
		isLoadingRepostStatus,
		wasFixed: shouldHaveShares && sharesCount === 0,
		timestamp: new Date().toISOString(),
	});

	// Emergency logging
	if (isShareIconGreen && displaySharesCount === 0) {
		console.error("🚨 EMERGENCY FIX APPLIED: Green share icon but 0 count!", {
			isReposted,
			sharesCount,
			displaySharesCount,
			emergencyFixedShareCount,
			finalShareCount,
			repostColor,
			iconColor,
			voiceNoteId: voiceNote?.id,
		});
	}

	// Super emergency logging when we apply the final fix
	if (finalShareCount !== sharesCount) {
		console.error("🚨🚨 FINAL SHARE COUNT FIX APPLIED:", {
			voiceNoteId: voiceNote?.id,
			originalCount: sharesCount,
			finalCount: finalShareCount,
			reasonForFix: {
				isReposted,
				showRepostAttribution: showRepostAttribution,
				sharedBy: !!sharedBy,
				voiceNoteShared_by: !!voiceNote?.shared_by,
				isShareIconGreen,
			},
		});
	}

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
						<View style={{ flexDirection: "row", alignItems: "center" }}>
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
								{formatNumber(finalShareCount)}
							</Text>
							{/* Visual debug indicator when fix is applied */}
							{finalShareCount !== sharesCount && (
								<View
									style={{
										width: 6,
										height: 6,
										borderRadius: 3,
										backgroundColor: "#00FF00",
										marginLeft: 3,
									}}
								/>
							)}
						</View>
					)}
				</View>
			</TouchableOpacity>
		</View>
	);
};
