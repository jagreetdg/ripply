import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface DefaultAvatarProps {
	userId: string;
	size?: number;
	style?: object;
	onPress?: () => void;
}

/**
 * A unified default avatar component that displays a consistent user icon for all users
 * Shows a white user silhouette icon on a purple background (like Instagram/Twitter)
 * Used across the app as a standard default profile picture
 */
const DefaultAvatar = ({
	userId,
	size = 50,
	style,
	onPress,
}: DefaultAvatarProps) => {
	const { colors } = useTheme();

	const backgroundColor = colors.tint;
	const iconColor = colors.white;

	const styles = StyleSheet.create({
		avatar: {
			width: size,
			height: size,
			borderRadius: size / 2,
			backgroundColor: backgroundColor,
			justifyContent: "center",
			alignItems: "center",
			overflow: "hidden",
		},
	});

	const avatarContent = (
		<View style={[styles.avatar, style]}>
			<Feather name="user" size={size * 0.6} color={iconColor} />
		</View>
	);

	if (onPress) {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				{avatarContent}
			</TouchableOpacity>
		);
	}

	return avatarContent;
};

export default DefaultAvatar;
