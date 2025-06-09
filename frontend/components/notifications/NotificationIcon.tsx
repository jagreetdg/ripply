import React from "react";
import { Feather } from "@expo/vector-icons";
import { Notification } from "../../hooks/useNotifications";

interface NotificationIconProps {
	type: Notification["type"];
	colors: {
		error: string;
		success: string;
		warning: string;
		tint: string;
		text: string;
	};
	isDarkMode: boolean;
	size?: number;
}

export const NotificationIcon = ({
	type,
	colors,
	isDarkMode,
	size = 16,
}: NotificationIconProps) => {
	switch (type) {
		case "like":
			return <Feather name="heart" size={size} color={colors.error} />;
		case "comment":
			return (
				<Feather
					name="message-circle"
					size={size}
					color={isDarkMode ? "white" : "black"}
				/>
			);
		case "follow":
			return <Feather name="user-plus" size={size} color={colors.success} />;
		case "mention":
			return <Feather name="at-sign" size={size} color={colors.warning} />;
		case "repost":
			return <Feather name="repeat" size={size} color="#4CAF50" />;
		case "new_content":
			return <Feather name="radio" size={size} color={colors.tint} />;
		case "milestone":
			return <Feather name="award" size={size} color="#FFD700" />;
		case "trending":
			return <Feather name="trending-up" size={size} color="#FF5722" />;
		default:
			return <Feather name="bell" size={size} color={colors.text} />;
	}
};
