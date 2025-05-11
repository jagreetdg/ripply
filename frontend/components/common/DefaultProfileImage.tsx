import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface DefaultProfileImageProps {
	userId: string;
	displayName?: string;
	size?: number;
	style?: any;
}

/**
 * Default profile image component that shows a gray person icon on a light purple background
 */
export function DefaultProfileImage({
	userId,
	displayName,
	size = 80,
	style,
}: DefaultProfileImageProps) {
	const containerStyle = {
		width: size,
		height: size,
		borderRadius: size / 2,
		backgroundColor: "#F0E6FF", // Light purple background
	};

	const iconSize = size * 0.5; // Icon size proportional to the container

	return (
		<View style={[styles.container, containerStyle, style]}>
			<Feather name="user" size={iconSize} color="#9E9E9E" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
});
