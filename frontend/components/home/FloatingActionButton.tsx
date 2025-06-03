import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { EdgeInsets } from "react-native-safe-area-context";

interface FloatingActionButtonProps {
	onPress: () => void;
	icon: React.ComponentProps<typeof Feather>["name"];
	color: string;
	backgroundColor: string;
	insets: EdgeInsets;
	visible?: boolean;
	size?: number;
	style?: ViewStyle;
}

export function FloatingActionButton({
	onPress,
	icon,
	color,
	backgroundColor,
	insets,
	visible = true,
	size = 24,
	style,
}: FloatingActionButtonProps) {
	if (!visible) return null;

	return (
		<TouchableOpacity
			style={[
				styles.fab,
				{
					bottom: insets.bottom + 16,
					backgroundColor,
					shadowColor: color,
				},
				style,
			]}
			onPress={onPress}
		>
			<Feather name={icon} size={size} color={color} />
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		right: 16,
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
	},
});
