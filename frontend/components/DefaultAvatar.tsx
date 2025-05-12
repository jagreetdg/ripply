import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface DefaultAvatarProps {
	size?: number;
	color?: string;
	onPress?: () => void;
	userId?: string;
}

/**
 * A unified default avatar component that displays a silhouette user icon
 * Used across the app as a standard default profile picture
 */
const DefaultAvatar = ({
	size = 100,
	color = "#6B2FBC",
	onPress,
	userId,
}: DefaultAvatarProps) => {
	const avatarContent = (
		<View
			style={[
				styles.container,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: color,
				},
			]}
		>
			<Feather name="user" size={size * 0.6} color="#fff" />
		</View>
	);

	// If onPress is provided, wrap in TouchableOpacity
	if (onPress) {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				{avatarContent}
			</TouchableOpacity>
		);
	}

	return avatarContent;
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
});

export default DefaultAvatar;
