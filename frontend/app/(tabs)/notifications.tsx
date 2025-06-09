import React, { useRef } from "react";
import {
	View,
	StyleSheet,
	FlatList,
	Text,
	Animated,
	Dimensions,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

// Import our new custom hook and components
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationItem } from "../../components/notifications/NotificationItem";
import { NotificationsHeader } from "../../components/notifications/NotificationsHeader";

const { width } = Dimensions.get("window");

export default function NotificationsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { colors, isDarkMode } = useTheme();

	// Use our custom notifications hook
	const {
		notifications,
		refreshing,
		markAllAsRead,
		handleNotificationPress,
		handleUserPress,
		handleRefresh,
	} = useNotifications();

	// Animation value for header elevation
	const scrollY = useRef(new Animated.Value(0)).current;
	const headerElevation = scrollY.interpolate({
		inputRange: [0, 10],
		outputRange: [0, 5],
		extrapolate: "clamp",
	});

	const handleGoBack = () => {
		router.back();
	};

	// Render separator between list items
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

	// Render empty state when there are no notifications
	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			<Feather name="bell-off" size={48} color={colors.textSecondary} />
			<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
				No notifications yet
			</Text>
		</View>
	);

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: colors.background, paddingTop: insets.top },
			]}
		>
			{/* Header Component */}
			<NotificationsHeader
				onBackPress={handleGoBack}
				onMarkAllAsRead={markAllAsRead}
				headerElevation={headerElevation}
				colors={colors}
				isDarkMode={isDarkMode}
				paddingTop={insets.top}
			/>

			{/* Notifications List */}
			<FlatList
				data={notifications}
				renderItem={({ item }) => (
					<NotificationItem
						notification={item}
						onPress={handleNotificationPress}
						onUserPress={handleUserPress}
						colors={colors}
						isDarkMode={isDarkMode}
					/>
				)}
				keyExtractor={(item) => item.id}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingTop: 60 + (Platform.OS === "ios" ? 0 : insets.top) }, // Account for the header
				]}
				ListEmptyComponent={renderEmptyState}
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
	scrollContent: {
		paddingBottom: 20,
	},
	separator: {
		height: 4,
		width: width - 30,
		alignSelf: "center",
		borderRadius: 2,
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 80,
	},
	emptyText: {
		fontSize: 16,
		marginTop: 16,
	},
});
