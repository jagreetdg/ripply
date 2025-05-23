import React from "react";
import { useRouter, Slot, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchDiscoveryIcon } from "@/components/icons/SearchDiscoveryIcon";

import { View, Platform, StyleSheet } from "react-native";

// Define tab bar height constant
const TAB_BAR_HEIGHT = 50;

function TabBarIcon(props: {
	name: React.ComponentProps<typeof Feather>["name"];
	color: string;
}) {
	return (
		<View style={{ alignItems: "center", justifyContent: "center" }}>
			<Feather size={24} style={{}} {...props} />
		</View>
	);
}

export default function TabLayout() {
	const router = useRouter();
	const { colors } = useTheme(); // Get current theme colors
	const insets = useSafeAreaInsets();
	const pathname = usePathname();

	// Check if we're on an auth screen to hide the tab bar
	const isAuthScreen = pathname?.startsWith("/auth");

	// Function to determine if a tab is active
	const isActive = (path: string) => {
		if (path === "/home") {
			// Special case for home tab - also check if we're at root
			return pathname === "/home" || pathname === "/";
		}
		return pathname === path || pathname?.startsWith(path);
	};

	// Function to navigate to a tab
	const navigateToTab = (path: string) => {
		router.push(path);
	};

	return (
		// Wrap with a container View to ensure clean background
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* This View blocks any background elements from showing through */}
			<View
				style={[
					styles.backgroundBlocker,
					{ backgroundColor: colors.background },
				]}
			/>

			{/* Always render the main screen content using Slot */}
			<View
				style={[
					styles.contentContainer,
					// Only add padding if not on auth screen
					!isAuthScreen && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
				]}
			>
				<Slot />
			</View>

			{/* Custom Tab Bar - only render when not on auth screens */}
			{!isAuthScreen && (
				<View
					style={[
						styles.tabBarContainer,
						{
							paddingBottom: insets.bottom,
							backgroundColor: colors.card,
							borderTopColor: colors.border,
							borderTopWidth: 1,
							height: TAB_BAR_HEIGHT + insets.bottom,
						},
					]}
				>
					<View style={styles.tabBar}>
						{/* Home Tab */}
						<TouchableOpacity
							style={styles.tabButton}
							onPress={() => navigateToTab("/home")}
						>
							<TabBarIcon
								name="home"
								color={isActive("/home") ? colors.tint : colors.tabIconDefault}
							/>
						</TouchableOpacity>

						{/* Search Tab */}
						<TouchableOpacity
							style={styles.tabButton}
							onPress={() => navigateToTab("/search")}
						>
							<SearchDiscoveryIcon
								size={24}
								color={
									isActive("/search") ? colors.tint : colors.tabIconDefault
								}
								showSearch={false}
							/>
						</TouchableOpacity>

						{/* Settings Tab */}
						<TouchableOpacity
							style={styles.tabButton}
							onPress={() => navigateToTab("/settings")}
						>
							<TabBarIcon
								name="settings"
								color={
									isActive("/settings") ? colors.tint : colors.tabIconDefault
								}
							/>
						</TouchableOpacity>
					</View>
				</View>
			)}
		</View>
	);
}

// Add styles
const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	contentContainer: {
		flex: 1,
	},
	tabBarContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
	},
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		height: TAB_BAR_HEIGHT,
	},
	tabButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: TAB_BAR_HEIGHT,
	},
	backgroundBlocker: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: -1, // Place behind content but above any unwanted background elements
	},
});
