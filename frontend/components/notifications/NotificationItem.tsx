import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	Image,
	Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Notification } from "../../hooks/useNotifications";
import { NotificationIcon } from "./NotificationIcon";
import { MilestoneDisplay } from "./MilestoneDisplay";
import DefaultAvatar from "../../components/DefaultAvatar";

interface NotificationItemProps {
	notification: Notification;
	onPress: (notification: Notification) => void;
	onUserPress: (username: string) => void;
	colors: {
		background: string;
		text: string;
		textSecondary: string;
		tint: string;
		border: string;
		error: string;
		success: string;
		warning: string;
	};
	isDarkMode: boolean;
}

export const NotificationItem = ({
	notification,
	onPress,
	onUserPress,
	colors,
	isDarkMode,
}: NotificationItemProps) => {
	// Calculate background color with alpha for unread items
	const bgColor = notification.read
		? "transparent"
		: isDarkMode
		? "rgba(107, 47, 188, 0.15)" // Purple with low opacity for dark mode
		: "rgba(107, 47, 188, 0.08)"; // Purple with lower opacity for light mode

	return (
		<Animated.View
			style={[
				styles.notificationItemContainer,
				{
					backgroundColor: bgColor,
					borderBottomColor: colors.border,
				},
			]}
		>
			<TouchableOpacity
				style={styles.notificationItem}
				onPress={() => onPress(notification)}
				activeOpacity={0.7}
			>
				{!notification.read && (
					<View
						style={[styles.unreadIndicator, { backgroundColor: colors.tint }]}
					/>
				)}

				<TouchableOpacity
					onPress={() => onUserPress(notification.user.username)}
					style={styles.avatarContainer}
				>
					{notification.user.avatarUrl ? (
						<Image
							source={{ uri: notification.user.avatarUrl }}
							style={styles.avatar}
							resizeMode="cover"
						/>
					) : (
						<View style={styles.systemAvatarContainer}>
							<DefaultAvatar userId={notification.user.id} size={46} />
						</View>
					)}
				</TouchableOpacity>

				<View style={styles.notificationContent}>
					<View style={styles.headerRow}>
						<TouchableOpacity
							onPress={() => onUserPress(notification.user.username)}
						>
							<Text style={[styles.username, { color: colors.text }]}>
								{notification.user.displayName}
							</Text>
						</TouchableOpacity>
						<Text style={[styles.timestamp, { color: colors.textSecondary }]}>
							{notification.timeAgo}
						</Text>
					</View>

					<View style={styles.messageRow}>
						<View style={styles.iconContainer}>
							<NotificationIcon
								type={notification.type}
								colors={colors}
								isDarkMode={isDarkMode}
							/>
						</View>
						<Text style={[styles.message, { color: colors.textSecondary }]}>
							{notification.message}
						</Text>
					</View>

					{notification.milestone && (
						<MilestoneDisplay
							notification={notification}
							colors={colors}
							isDarkMode={isDarkMode}
						/>
					)}

					{notification.voiceNoteTitle && (
						<View
							style={[
								styles.contentPreview,
								{ backgroundColor: isDarkMode ? "#2D2D2D" : "#F5F5F5" },
							]}
						>
							<Feather
								name="headphones"
								size={12}
								color={colors.textSecondary}
								style={styles.previewIcon}
							/>
							<Text
								style={[styles.contentTitle, { color: colors.text }]}
								numberOfLines={1}
							>
								{notification.voiceNoteTitle}
							</Text>
						</View>
					)}

					{notification.comment && (
						<View
							style={[
								styles.commentContainer,
								{ backgroundColor: isDarkMode ? "#2D2D2D" : "#F5F5F5" },
							]}
						>
							<Feather
								name="message-square"
								size={12}
								color={colors.textSecondary}
								style={styles.commentIcon}
							/>
							<Text
								style={[styles.comment, { color: colors.textSecondary }]}
								numberOfLines={2}
							>
								{notification.comment}
							</Text>
						</View>
					)}
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	notificationItemContainer: {
		borderBottomWidth: 0,
		marginHorizontal: 8,
		marginVertical: 4,
		borderRadius: 12,
		overflow: "hidden",
	},
	notificationItem: {
		flexDirection: "row",
		padding: 16,
		position: "relative",
	},
	unreadIndicator: {
		position: "absolute",
		left: 0,
		top: "50%",
		width: 4,
		height: 24,
		marginTop: -12,
		borderTopRightRadius: 2,
		borderBottomRightRadius: 2,
	},
	avatarContainer: {
		marginRight: 12,
		height: 48,
		width: 48,
		borderRadius: 24,
		overflow: "hidden",
	},
	systemAvatarContainer: {
		height: 48,
		width: 48,
		borderRadius: 24,
		overflow: "hidden",
		justifyContent: "center",
		alignItems: "center",
	},
	avatar: {
		width: "100%",
		height: "100%",
	},
	notificationContent: {
		flex: 1,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	username: {
		fontSize: 16,
		fontWeight: "600",
	},
	timestamp: {
		fontSize: 12,
	},
	messageRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	iconContainer: {
		marginRight: 6,
		width: 20,
		alignItems: "center",
	},
	message: {
		fontSize: 14,
		flex: 1,
	},
	contentPreview: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderRadius: 8,
		marginTop: 8,
	},
	previewIcon: {
		marginRight: 8,
	},
	contentTitle: {
		fontSize: 14,
		fontWeight: "500",
		flex: 1,
	},
	commentContainer: {
		flexDirection: "row",
		padding: 10,
		borderRadius: 8,
		marginTop: 8,
	},
	commentIcon: {
		marginRight: 8,
		marginTop: 2,
	},
	comment: {
		fontSize: 13,
		lineHeight: 18,
		flex: 1,
	},
});
