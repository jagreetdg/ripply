import React, { useCallback, useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Platform,
	Animated,
	FlatList,
	Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import DefaultAvatar from "../../components/DefaultAvatar";

const { width } = Dimensions.get("window");

// Define notification type
interface User {
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
}

interface Notification {
	id: string;
	type:
		| "like"
		| "comment"
		| "follow"
		| "mention"
		| "repost"
		| "new_content"
		| "milestone"
		| "trending";
	message: string;
	user: User;
	voiceNoteTitle?: string;
	voiceNoteId?: string;
	comment?: string;
	timeAgo: string;
	read: boolean;
	milestone?: {
		type: "followers" | "plays" | "likes";
		count: number;
	};
}

// Dummy notification data
const dummyNotifications: Notification[] = [
	{
		id: "1",
		type: "like",
		message: "liked your voice note",
		user: {
			id: "user1",
			username: "john_doe",
			displayName: "John Doe",
			avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
		},
		voiceNoteId: "vn123",
		voiceNoteTitle: "My thoughts on climate change",
		timeAgo: "5m",
		read: false,
	},
	{
		id: "2",
		type: "milestone",
		message: "Congrats! Your voice note reached a milestone",
		user: {
			id: "system",
			username: "ripply",
			displayName: "Ripply",
			avatarUrl: null,
		},
		voiceNoteId: "vn124",
		voiceNoteTitle: "Morning meditation routine",
		timeAgo: "1h",
		read: false,
		milestone: {
			type: "plays",
			count: 1000,
		},
	},
	{
		id: "3",
		type: "comment",
		message: "commented on your voice note",
		user: {
			id: "user2",
			username: "sara_smith",
			displayName: "Sara Smith",
			avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
		},
		voiceNoteId: "vn125",
		voiceNoteTitle: "Weekend travels",
		comment:
			"Great trip! Where was this? I've been looking for new places to explore this summer. The scenery looks amazing!",
		timeAgo: "2h",
		read: false,
	},
	{
		id: "4",
		type: "trending",
		message: "Your voice note is trending!",
		user: {
			id: "system",
			username: "ripply",
			displayName: "Ripply",
			avatarUrl: null,
		},
		voiceNoteId: "vn126",
		voiceNoteTitle: "How I learned to code in 30 days",
		timeAgo: "3h",
		read: false,
	},
	{
		id: "5",
		type: "follow",
		message: "started following you",
		user: {
			id: "user3",
			username: "mike_jones",
			displayName: "Mike Jones",
			avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg",
		},
		timeAgo: "5h",
		read: true,
	},
	{
		id: "6",
		type: "mention",
		message: "mentioned you in a voice note",
		user: {
			id: "user4",
			username: "lisa_parker",
			displayName: "Lisa Parker",
			avatarUrl: "https://randomuser.me/api/portraits/women/22.jpg",
		},
		voiceNoteId: "vn127",
		voiceNoteTitle: "Podcast recommendations for my friend @user",
		timeAgo: "6h",
		read: true,
	},
	{
		id: "7",
		type: "repost",
		message: "reposted your voice note",
		user: {
			id: "user5",
			username: "david_miller",
			displayName: "David Miller",
			avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg",
		},
		voiceNoteId: "vn128",
		voiceNoteTitle: "My favorite songs this month",
		timeAgo: "12h",
		read: true,
	},
	{
		id: "8",
		type: "like",
		message: "and 5 others liked your voice note",
		user: {
			id: "user6",
			username: "emily_wilson",
			displayName: "Emily Wilson",
			avatarUrl: "https://randomuser.me/api/portraits/women/33.jpg",
		},
		voiceNoteId: "vn129",
		voiceNoteTitle: "Morning thoughts",
		timeAgo: "1d",
		read: true,
	},
	{
		id: "9",
		type: "milestone",
		message: "Your account reached 100 followers!",
		user: {
			id: "system",
			username: "ripply",
			displayName: "Ripply",
			avatarUrl: null,
		},
		timeAgo: "2d",
		read: true,
		milestone: {
			type: "followers",
			count: 100,
		},
	},
	{
		id: "10",
		type: "comment",
		message: "replied to a comment on your voice note",
		user: {
			id: "user7",
			username: "alex_cooper",
			displayName: "Alex Cooper",
			avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
		},
		voiceNoteId: "vn130",
		voiceNoteTitle: "Why I switched careers",
		comment:
			"I had the same experience! It's definitely worth taking the risk when you're passionate about something new.",
		timeAgo: "3d",
		read: true,
	},
	{
		id: "11",
		type: "new_content",
		message: "shared a new voice note you might like",
		user: {
			id: "user8",
			username: "taylor_swift",
			displayName: "Taylor Swift",
			avatarUrl: "https://randomuser.me/api/portraits/women/90.jpg",
		},
		voiceNoteId: "vn131",
		voiceNoteTitle: "New song breakdown",
		timeAgo: "4d",
		read: true,
	},
	{
		id: "12",
		type: "follow",
		message: "and 3 others started following you",
		user: {
			id: "user9",
			username: "james_bond",
			displayName: "James Bond",
			avatarUrl: "https://randomuser.me/api/portraits/men/90.jpg",
		},
		timeAgo: "5d",
		read: true,
	},
];

// Icons for different notification types
const getNotificationIcon = (
	type: Notification["type"],
	colors: any,
	isDarkMode: boolean
) => {
	switch (type) {
		case "like":
			return <Feather name="heart" size={16} color={colors.error} />;
		case "comment":
			return (
				<Feather
					name="message-circle"
					size={16}
					color={isDarkMode ? "white" : "black"}
				/>
			);
		case "follow":
			return <Feather name="user-plus" size={16} color={colors.success} />;
		case "mention":
			return <Feather name="at-sign" size={16} color={colors.warning} />;
		case "repost":
			return <Feather name="repeat" size={16} color="#4CAF50" />;
		case "new_content":
			return <Feather name="radio" size={16} color={colors.tint} />;
		case "milestone":
			return <Feather name="award" size={16} color="#FFD700" />;
		case "trending":
			return <Feather name="trending-up" size={16} color="#FF5722" />;
		default:
			return <Feather name="bell" size={16} color={colors.text} />;
	}
};

export default function NotificationsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { colors, isDarkMode } = useTheme();
	const [refreshing, setRefreshing] = useState(false);

	// Animation value for header elevation
	const scrollY = React.useRef(new Animated.Value(0)).current;
	const headerElevation = scrollY.interpolate({
		inputRange: [0, 10],
		outputRange: [0, 5],
		extrapolate: "clamp",
	});

	const handleGoBack = () => {
		router.back();
	};

	const markAllAsRead = () => {
		// In a real app, this would call an API
		console.log("Marking all notifications as read");
	};

	const handleNotificationPress = useCallback(
		(notification: Notification) => {
			// In a real app, this would navigate to the relevant content
			console.log("Notification pressed:", notification.id);

			if (notification.type === "follow") {
				router.push(`/profile/${notification.user.username}`);
			} else if (notification.voiceNoteId && notification.voiceNoteTitle) {
				// This would navigate to the voice note in a real app
				console.log(`Navigate to voice note: ${notification.voiceNoteTitle}`);
			}
		},
		[router]
	);

	const handleUserPress = useCallback(
		(username: string) => {
			router.push(`/profile/${username}`);
		},
		[router]
	);

	const renderMilestone = (notification: Notification) => {
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

	const renderNotificationItem = ({
		item: notification,
	}: {
		item: Notification;
	}) => {
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
					onPress={() => handleNotificationPress(notification)}
					activeOpacity={0.7}
				>
					{!notification.read && (
						<View
							style={[styles.unreadIndicator, { backgroundColor: colors.tint }]}
						/>
					)}

					<TouchableOpacity
						onPress={() => handleUserPress(notification.user.username)}
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
								onPress={() => handleUserPress(notification.user.username)}
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
								{getNotificationIcon(notification.type, colors, isDarkMode)}
							</View>
							<Text style={[styles.message, { color: colors.textSecondary }]}>
								{notification.message}
							</Text>
						</View>

						{notification.milestone && renderMilestone(notification)}

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

	const renderSeparator = () => (
		<View
			style={[
				styles.separator,
				{
					backgroundColor: isDarkMode
						? "rgba(255,255,255,0.05)"
						: "rgba(0,0,0,0.05)",
					marginVertical: 1,
				},
			]}
		/>
	);

	const handleRefresh = () => {
		setRefreshing(true);
		// Simulate a refresh
		setTimeout(() => {
			setRefreshing(false);
		}, 1000);
	};

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.background, paddingTop: insets.top },
			]}
		>
			<Animated.View
				style={[
					styles.headerContainer,
					{
						backgroundColor: colors.card,
						shadowOpacity: isDarkMode ? 0.3 : 0.1,
						elevation: headerElevation,
						shadowColor: colors.text,
						paddingTop: Platform.OS === "ios" ? 0 : insets.top,
					},
				]}
			>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
						<Feather name="arrow-left" size={24} color={colors.text} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: colors.text }]}>
						Notifications
					</Text>
					<TouchableOpacity
						style={styles.markReadButton}
						onPress={markAllAsRead}
					>
						<Text style={[styles.markReadText, { color: colors.tint }]}>
							Mark all read
						</Text>
					</TouchableOpacity>
				</View>
			</Animated.View>

			<FlatList
				data={dummyNotifications}
				renderItem={renderNotificationItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingTop: 60 + (Platform.OS === "ios" ? 0 : insets.top) }, // Account for the header
				]}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Feather name="bell-off" size={48} color={colors.textSecondary} />
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No notifications yet
						</Text>
					</View>
				}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: false }
				)}
				scrollEventThrottle={16}
				refreshing={refreshing}
				onRefresh={handleRefresh}
				showsVerticalScrollIndicator={false}
				ItemSeparatorComponent={renderSeparator}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
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
	separator: {
		height: 4,
		width: width - 30,
		alignSelf: "center",
		borderRadius: 2,
	},
	scrollContent: {
		paddingBottom: 20,
	},
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
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	notificationContent: {
		flex: 1,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 6,
	},
	username: {
		fontWeight: "600",
		fontSize: 16,
	},
	timestamp: {
		fontSize: 12,
	},
	messageRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	iconContainer: {
		marginRight: 8,
	},
	message: {
		fontSize: 14,
	},
	contentPreview: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderRadius: 10,
		marginTop: 8,
	},
	previewIcon: {
		marginRight: 6,
	},
	contentTitle: {
		fontSize: 14,
		flex: 1,
	},
	commentContainer: {
		flexDirection: "row",
		padding: 10,
		borderRadius: 10,
		marginTop: 8,
	},
	commentIcon: {
		marginRight: 6,
		marginTop: 2,
	},
	comment: {
		fontSize: 14,
		flex: 1,
		lineHeight: 18,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 40,
		marginTop: 80,
	},
	emptyText: {
		fontSize: 16,
		marginTop: 16,
	},
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
		marginRight: 8,
	},
	milestoneText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
