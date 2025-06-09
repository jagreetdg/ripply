import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Notification } from "../../hooks/useNotifications";

interface MilestoneDisplayProps {
	notification: Notification;
	colors: {
		text: string;
		tint: string;
	};
	isDarkMode: boolean;
}

export const MilestoneDisplay = ({
	notification,
	colors,
	isDarkMode,
}: MilestoneDisplayProps) => {
	if (!notification.milestone) return null;

	const { type, count } = notification.milestone;
	let icon: "users" | "play" | "heart" = "users";
	let message = "";

	switch (type) {
		case "followers":
			icon = "users";
			message = `${count} followers`;
			break;
		case "plays":
			icon = "play";
			message = `${count} plays`;
			break;
		case "likes":
			icon = "heart";
			message = `${count} likes`;
			break;
	}

	return (
		<View style={styles.milestoneContainer}>
			<View
				style={[
					styles.milestoneIconContainer,
					{ backgroundColor: isDarkMode ? "#2D2D2D" : "#F0F0F0" },
				]}
			>
				<Feather name={icon} size={14} color={colors.tint} />
			</View>
			<Text style={[styles.milestoneText, { color: colors.text }]}>
				{message}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	milestoneContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	milestoneIconContainer: {
		width: 24,
		height: 24,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 6,
	},
	milestoneText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
