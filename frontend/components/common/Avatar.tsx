import React, { useState } from "react";
import { Image, StyleSheet, Platform } from "react-native";
import DefaultAvatar from "../DefaultAvatar";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import { processImageUrl, getFallbackImageUrl } from "../../utils/imageUtils";

interface AvatarProps {
	userId: string;
	size?: number;
	avatarUrl?: string | null;
	onPress?: () => void;
	displayName?: string;
}

/**
 * A unified Avatar component that handles loading errors gracefully
 * and provides consistent fallback behavior across platforms
 */
export const Avatar = ({
	userId,
	size = 32,
	avatarUrl = null,
	onPress,
	displayName,
}: AvatarProps) => {
	const { colors } = useTheme();
	// State to track if the avatar image failed to load
	const [imageError, setImageError] = useState(false);

	// Process the avatar URL properly
	const processedAvatarUrl = processImageUrl(avatarUrl, "avatar", userId);
	const fallbackUrl = getFallbackImageUrl(userId, displayName, "avatar");

	// If we have a valid avatar URL and no loading error, show the image
	if (processedAvatarUrl && !imageError) {
		return (
			<Image
				source={{ uri: processedAvatarUrl }}
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
				}}
				onError={() => {
					console.log(
						`[AVATAR] Error loading avatar for user: ${userId}, URL: ${processedAvatarUrl}`
					);
					setImageError(true); // Mark this image as failed
				}}
				// Use the fallback URL as default
				defaultSource={
					Platform.OS === "ios" && fallbackUrl
						? { uri: fallbackUrl }
						: undefined
				}
			/>
		);
	}

	// Otherwise show our default avatar
	return <DefaultAvatar size={size} onPress={onPress} userId={userId} />;
};

const styles = StyleSheet.create({
	defaultAvatar: {
		backgroundColor: Colors.brand.primary,
		justifyContent: "center",
		alignItems: "center",
	},
	defaultAvatarText: {
		color: Colors.light.white,
		fontWeight: "bold",
	},
});
