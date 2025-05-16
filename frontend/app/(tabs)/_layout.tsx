import React, { useState, useEffect } from "react";
import { Tabs, useRouter, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
	Pressable,
	View,
	Platform,
	StyleSheet,
	Animated,
	Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Get screen dimensions
const windowWidth = Dimensions.get("window").width;

function TabBarIcon(props: {
	name: React.ComponentProps<typeof Feather>["name"];
	color: string;
	focused: boolean;
}) {
	const { name, color, focused } = props;
	// Animate the tab icon when it becomes focused
	const [scaleAnim] = useState(new Animated.Value(1));

	useEffect(() => {
		if (focused) {
			// Animate scale up and down when focused
			Animated.sequence([
				Animated.timing(scaleAnim, {
					toValue: 1.2,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [focused]);

	return (
		<Animated.View
			style={{
				alignItems: "center",
				justifyContent: "center",
				transform: [{ scale: scaleAnim }],
			}}
		>
			<Feather size={24} color={color} name={name} />
			{/* Add a small dot indicator for focused tab */}
			{focused && <View style={styles.activeDot} />}
		</Animated.View>
	);
}

export default function TabLayout() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const currentPath = usePathname();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#6B2FBC",
				tabBarInactiveTintColor: "#666666",
				tabBarStyle: {
					borderTopWidth: 0,
					elevation: 0,
					height: 60 + (Platform.OS === "ios" ? insets.bottom : 0),
					paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
					backgroundColor: "rgba(255, 255, 255, 0.95)",
					shadowColor: "#000",
					shadowOffset: {
						width: 0,
						height: -2,
					},
					shadowOpacity: 0.1,
					shadowRadius: 3.84,
					...Platform.select({
						ios: {
							borderTopColor: "rgba(225, 225, 225, 0.3)",
							borderTopWidth: 0.5,
						},
						android: {
							borderTopWidth: 0,
							elevation: 8,
						},
					}),
				},
				tabBarShowLabel: false,
				tabBarItemStyle: {
					alignItems: "center",
					justifyContent: "center",
					paddingTop: 12,
				},
				// Disable the static render of the header on web
				// to prevent a hydration error in React Navigation v6.
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="home" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="search" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="settings" color={color} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	activeDot: {
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#6B2FBC",
		marginTop: 4,
	},
});
