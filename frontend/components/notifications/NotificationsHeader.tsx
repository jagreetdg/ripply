import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Platform,
	Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface NotificationsHeaderProps {
	onBackPress: () => void;
	onMarkAllAsRead: () => void;
	headerElevation: Animated.AnimatedInterpolation<number>;
	colors: {
		card: string;
		text: string;
		tint: string;
	};
	isDarkMode: boolean;
	paddingTop: number;
}

export const NotificationsHeader = ({
	onBackPress,
	onMarkAllAsRead,
	headerElevation,
	colors,
	isDarkMode,
	paddingTop,
}: NotificationsHeaderProps) => {
	return (
		<Animated.View
			style={[
				styles.headerContainer,
				{
					backgroundColor: colors.card,
					shadowOpacity: isDarkMode ? 0.3 : 0.1,
					elevation: headerElevation,
					shadowColor: colors.text,
					paddingTop: Platform.OS === "ios" ? 0 : paddingTop,
				},
			]}
		>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={onBackPress}>
					<Feather name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					Notifications
				</Text>
				<TouchableOpacity
					style={styles.markReadButton}
					onPress={onMarkAllAsRead}
				>
					<Text style={[styles.markReadText, { color: colors.tint }]}>
						Mark all read
					</Text>
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	headerContainer: {
		position: "absolute",
		width: "100%",
		zIndex: 1000,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		height: 56,
		paddingHorizontal: 16,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
	},
	backButton: {
		padding: 8,
	},
	markReadButton: {
		paddingVertical: 6,
		paddingHorizontal: 10,
	},
	markReadText: {
		fontSize: 13,
		fontWeight: "600",
	},
});
