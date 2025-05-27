import React from "react";
import DefaultAvatarMain from "../DefaultAvatar";

interface DefaultAvatarProps {
	userId: string;
	size?: number;
	onPress?: () => void;
}

/**
 * Default avatar wrapper for backward compatibility
 * @deprecated Use the main DefaultAvatar component instead
 */
export const DefaultAvatar = ({
	userId,
	size = 32,
	onPress,
}: DefaultAvatarProps) => {
	return <DefaultAvatarMain userId={userId} size={size} onPress={onPress} />;
};
