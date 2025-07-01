import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { useVoiceNoteLikeNew } from "./hooks/useVoiceNoteLikeNew";
import { useVoiceNoteShareNew } from "./hooks/useVoiceNoteShareNew";
import { VoiceNote } from "../../services/api/modules/types/voiceNoteTypes";

interface VoiceNoteInteractionsCleanProps {
	voiceNote: VoiceNote;
	onOpenComments: () => void;
	onLikeStatusChanged?: (isLiked: boolean, likesCount: number) => void;
	onShareStatusChanged?: (isShared: boolean, sharesCount: number) => void;
}

export const VoiceNoteInteractionsClean: React.FC<
	VoiceNoteInteractionsCleanProps
> = ({
	voiceNote,
	onOpenComments,
	onLikeStatusChanged,
	onShareStatusChanged,
}) => {
	const { user } = useUser();
	const { colors, isDarkMode } = useTheme();

	// Animation hook
	const useButtonAnimation = () => {
		const scale = useSharedValue(1);
		const animatedStyle = useAnimatedStyle(() => {
			return {
				transform: [{ scale: scale.value }],
			};
		});
		const triggerAnimation = () => {
			scale.value = withSpring(1.3, { damping: 2, stiffness: 200 }, () => {
				scale.value = withSpring(1);
			});
		};
		return { animatedStyle, triggerAnimation };
	};

	const {
		animatedStyle: likeAnimatedStyle,
		triggerAnimation: triggerLikeAnimation,
	} = useButtonAnimation();
	const {
		animatedStyle: shareAnimatedStyle,
		triggerAnimation: triggerShareAnimation,
	} = useButtonAnimation();

	// Use new clean hooks WITHOUT memoized callbacks to prevent infinite loops
	const {
		isLiked,
		likesCount,
		isLoading: likeLoading,
		isProcessing: likeProcessing,
		toggleLike,
	} = useVoiceNoteLikeNew({
		voiceNoteId: voiceNote.id,
		userId: user?.id || null,
		initialLikesCount: voiceNote.likes || 0,
		initialIsLiked: voiceNote.is_liked,
		onLikeStatusChanged,
	});

	const {
		isShared,
		sharesCount,
		isLoading: shareLoading,
		isProcessing: shareProcessing,
		toggleShare,
	} = useVoiceNoteShareNew({
		voiceNoteId: voiceNote.id,
		userId: user?.id || null,
		initialSharesCount: voiceNote.shares || 0,
		initialIsShared: voiceNote.is_shared,
		onShareStatusChanged,
	});

	const handleLikePress = () => {
		if (!isLiked) {
			triggerLikeAnimation();
		}
		toggleLike();
	};

	const handleSharePress = () => {
		if (!isShared) {
			triggerShareAnimation();
		}
		toggleShare();
	};

	// Check if card has background image for better contrast
	const hasBackgroundImage = Boolean(voiceNote.backgroundImage);

	// Memoized color functions for better performance
	const colors_memo = useMemo(() => {
		const getIconColor = (isActive: boolean, isLoading: boolean) => {
			if (isLoading) return "#666";
			if (isActive) return "#FF6B6B"; // Red for liked
			// If card has background image, ALWAYS use white for better contrast
			if (hasBackgroundImage) return "#FFFFFF";
			return isDarkMode ? "#FFFFFF" : "#333"; // White in dark, dark in light
		};

		const getTextColor = (isActive: boolean, isLoading: boolean) => {
			if (isLoading) return "#666";
			if (isActive) return "#FF6B6B"; // Red for liked
			// If card has background image, ALWAYS use white for better contrast
			if (hasBackgroundImage) return "#FFFFFF";
			return isDarkMode ? "#FFFFFF" : "#333"; // White in dark, dark in light
		};

		const getShareIconColor = (isActive: boolean, isLoading: boolean) => {
			if (isLoading) return "#666";
			if (isActive) return "#4ECDC4"; // Teal for shared
			// If card has background image, ALWAYS use white for better contrast
			if (hasBackgroundImage) return "#FFFFFF";
			return isDarkMode ? "#FFFFFF" : "#333"; // White in dark, dark in light
		};

		const getShareTextColor = (isActive: boolean, isLoading: boolean) => {
			if (isLoading) return "#666";
			if (isActive) return "#4ECDC4"; // Teal for shared
			// If card has background image, ALWAYS use white for better contrast
			if (hasBackgroundImage) return "#FFFFFF";
			return isDarkMode ? "#FFFFFF" : "#333"; // White in dark, dark in light
		};

		const getNeutralColor = () => {
			// If card has background image, ALWAYS use white for better contrast
			if (hasBackgroundImage) return "#FFFFFF";
			return isDarkMode ? "#FFFFFF" : "#333"; // White in dark, dark in light
		};

		return {
			getIconColor,
			getTextColor,
			getShareIconColor,
			getShareTextColor,
			getNeutralColor,
		};
	}, [isDarkMode, hasBackgroundImage]);

	return (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				paddingTop: 8,
				borderTopWidth: 0.5,
				borderTopColor: isDarkMode ? "#333" : "#E5E5E5",
			}}
		>
			{/* Like Button */}
			<TouchableOpacity
				onPress={handleLikePress}
				disabled={!user}
				style={{
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: 8,
					opacity: !user ? 0.5 : 1,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					{/* Only show loading on initial load, not during clicks */}
					{likeLoading ? (
						<ActivityIndicator size="small" color="#FF6B6B" />
					) : (
						<Animated.View style={likeAnimatedStyle}>
							<Ionicons
								name={isLiked ? "heart" : "heart-outline"}
								size={20}
								color={colors_memo.getIconColor(isLiked, likeLoading)}
							/>
						</Animated.View>
					)}
					<Text
						style={{
							marginLeft: 4,
							color: colors_memo.getTextColor(isLiked, likeLoading),
							fontSize: 12,
							fontWeight: "600",
						}}
					>
						{likesCount}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Comments Button */}
			<TouchableOpacity
				onPress={onOpenComments}
				style={{
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: 8,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Ionicons
						name="chatbubble-outline"
						size={20}
						color={colors_memo.getNeutralColor()}
					/>
					<Text
						style={{
							marginLeft: 4,
							color: colors_memo.getNeutralColor(),
							fontSize: 12,
							fontWeight: "600",
						}}
					>
						{voiceNote.comments || 0}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Listen Count Button - FIXED: Using headphones icon */}
			<TouchableOpacity
				style={{
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: 8,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Ionicons
						name="headset-outline"
						size={20}
						color={colors_memo.getNeutralColor()}
					/>
					<Text
						style={{
							marginLeft: 4,
							color: colors_memo.getNeutralColor(),
							fontSize: 12,
							fontWeight: "600",
						}}
					>
						{voiceNote.plays || 0}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Share Button */}
			<TouchableOpacity
				onPress={handleSharePress}
				disabled={!user}
				style={{
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: 8,
					opacity: !user ? 0.5 : 1,
				}}
			>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					{/* Only show loading on initial load, not during clicks */}
					{shareLoading ? (
						<ActivityIndicator size="small" color="#4ECDC4" />
					) : (
						<Animated.View style={shareAnimatedStyle}>
							<Ionicons
								name={isShared ? "repeat" : "repeat-outline"}
								size={20}
								color={colors_memo.getShareIconColor(isShared, shareLoading)}
							/>
						</Animated.View>
					)}
					<Text
						style={{
							marginLeft: 4,
							color: colors_memo.getShareTextColor(isShared, shareLoading),
							fontSize: 12,
							fontWeight: "600",
						}}
					>
						{sharesCount}
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	);
};
