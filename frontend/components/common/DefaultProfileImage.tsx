import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getColorFromUserId, getInitial } from "../../utils/defaultImages";

interface DefaultProfileImageProps {
	userId: string;
	displayName?: string;
	size?: number;
	style?: any;
}

/**
 * Default profile image component that shows a colored circle with the user's initial
 */
export function DefaultProfileImage({
	userId,
	displayName,
	size = 80,
}: DefaultProfileImageProps) {
	const backgroundColor = getColorFromUserId(userId);
	const initial = getInitial(displayName || userId);

	const containerStyle = {
		width: size,
		height: size,
		borderRadius: size / 2,
		backgroundColor,
	};

	const textStyle = {
		fontSize: size / 2.5,
		color: "#FFFFFF",
		fontWeight: "600" as const,
	};

	return (
		<View style={[styles.container, containerStyle]}>
			<Text style={[styles.text, textStyle]}>{initial}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
	},
	text: {
		color: "#FFFFFF",
		fontWeight: "600",
	},
});
