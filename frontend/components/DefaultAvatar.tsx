import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface DefaultAvatarProps {
	userId: string;
	size?: number;
	fontSize?: number;
	style?: object;
	onPress?: () => void;
}

/**
 * A unified default avatar component that displays a silhouette user icon
 * Used across the app as a standard default profile picture
 */
const DefaultAvatar = ({
	userId,
	size = 50,
	fontSize,
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
		initials: {
			color: iconColor,
			fontSize: fontSize || size / 2.5,
			fontWeight: "bold",
		},
	});

	const getInitials = (id: string) => {
		if (!id) return "?";
		const parts = id.split(/[\s_-]+/);
		let initials = "";
		if (parts.length > 0 && parts[0]) {
			initials += parts[0][0].toUpperCase();
		}
		return initials || "?";
	};

	const initials = getInitials(userId);

	const avatarContent = (
		<View style={[styles.avatar, style]}>
			{userId ? (
				<Text style={styles.initials}>{initials}</Text>
			) : (
				<Feather name="user" size={size * 0.6} color={iconColor} />
			)}
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
