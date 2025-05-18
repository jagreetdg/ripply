import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

import { View, Platform, StyleSheet } from "react-native";

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

	return (
		// Wrap the Tabs with a container View to ensure clean background
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* This View blocks any background elements from showing through */}
			<View
				style={[
					styles.backgroundBlocker,
					{ backgroundColor: colors.background },
				]}
			/>

			<Tabs
				screenOptions={{
					tabBarActiveTintColor: colors.tint,
					tabBarInactiveTintColor: colors.tabIconDefault,
					tabBarStyle: {
						borderTopColor: colors.border,
						backgroundColor: colors.card,
						...Platform.select({
							ios: { paddingBottom: 0 },
							android: { paddingBottom: 0 },
							default: {},
						}),
					},
					tabBarShowLabel: false,
					tabBarItemStyle: {
						alignItems: "center",
						justifyContent: "center",
					},
					// Disable the static render of the header on web
					// to prevent a hydration error in React Navigation v6.
					headerShown: false,
				}}
			>
				<Tabs.Screen
					name="home"
					options={{
						tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
					}}
				/>
				<Tabs.Screen
					name="search"
					options={{
						tabBarIcon: ({ color }) => (
							<TabBarIcon name="search" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						tabBarIcon: ({ color }) => (
							<TabBarIcon name="settings" color={color} />
						),
					}}
				/>
			</Tabs>
		</View>
	);
}

// Add styles
const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	backgroundBlocker: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		// backgroundColor: "#FFF", // Removing this hardcoded color
		zIndex: -1, // Place behind content but above any unwanted background elements
	},
});
