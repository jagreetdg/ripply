import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

interface DefaultProfileImageProps {
	size?: number;
	iconSize?: number;
	style?: object;
}

/**
 * Default profile image component that shows a gray person icon on a themed background.
 */
const DefaultProfileImage = ({
	size = 100,
	iconSize,
	style,
}: DefaultProfileImageProps) => {
	const { colors } = useTheme();

	const finalIconSize = iconSize || size * 0.6;

	return (
		<View
			style={[
				styles.container,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: colors.tagBackground,
				},
				style,
			]}
		>
			<Feather name="user" size={finalIconSize} color={colors.textTertiary} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
});

export default DefaultProfileImage;
