import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

interface ValidationIndicatorProps {
	isChecking: boolean;
	isValid: boolean | null;
	size?: number;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
	isChecking,
	isValid,
	size = 16,
}) => {
	const { colors } = useTheme();

	if (isChecking) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="small" color={colors.tint} />
			</View>
		);
	}

	if (isValid === null) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Feather
				name={isValid ? "check-circle" : "x-circle"}
				size={size}
				color={
					isValid ? colors.success || "#34C759" : colors.error || "#FF3B30"
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "center",
		alignItems: "center",
		width: 24,
		height: 24,
	},
});
