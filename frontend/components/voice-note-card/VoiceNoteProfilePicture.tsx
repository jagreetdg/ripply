import React, { useState } from "react";
import { Image, Platform } from "react-native";
import DefaultAvatar from "../DefaultAvatar"; // Updated import path

interface VoiceNoteProfilePictureProps {
	userId: string;
	size?: number;
	avatarUrl?: string | null;
}

/**
 * Profile picture component that handles loading user avatars with fallback
 */
export const VoiceNoteProfilePicture: React.FC<
	VoiceNoteProfilePictureProps
> = ({ userId, size = 32, avatarUrl = null }) => {
	// State to track if the avatar image failed to load
	const [imageError, setImageError] = useState(false);

	// Only try to load the avatar if a URL is provided and there hasn't been an error
	if (avatarUrl && !imageError) {
		return (
			<Image
				source={{ uri: avatarUrl }}
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
				}}
				onError={() => {
					console.log("Error loading avatar in VoiceNoteCard");
					setImageError(true); // Mark this image as failed
				}}
				// Don't use local assets for default source
				defaultSource={
					Platform.OS === "ios"
						? { uri: "https://ui-avatars.com/api/?name=" + (userId || "U") }
						: undefined
				}
			/>
		);
	}

	// Fallback to our new DefaultAvatar
	return <DefaultAvatar userId={userId} size={size} />;
};
