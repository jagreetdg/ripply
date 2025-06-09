import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PasswordStrength } from "../types";
import {
	getPasswordStrengthColor,
	getPasswordStrengthText,
} from "../utils/validation";
import { useTheme } from "../../../context/ThemeContext";

interface PasswordStrengthIndicatorProps {
	strength: PasswordStrength;
	password: string;
}

export const PasswordStrengthIndicator: React.FC<
	PasswordStrengthIndicatorProps
> = ({ strength, password }) => {
	const { colors } = useTheme();

	if (!password || !strength) {
		return null;
	}

	const strengthColor = getPasswordStrengthColor(strength);
	const strengthText = getPasswordStrengthText(strength);

	// Calculate progress based on strength
	const getProgress = () => {
		switch (strength) {
			case "weak":
				return 0.33;
			case "medium":
				return 0.66;
			case "strong":
				return 1;
			default:
				return 0;
		}
	};

	const progress = getProgress();

	return (
		<View style={styles.container}>
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { backgroundColor: colors.border }]}>
					<View
						style={[
							styles.progressFill,
							{
								backgroundColor: strengthColor,
								width: `${progress * 100}%`,
							},
						]}
					/>
				</View>
				<Text style={[styles.strengthText, { color: strengthColor }]}>
					{strengthText}
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 8,
	},
	progressContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	progressBar: {
		flex: 1,
		height: 4,
		borderRadius: 2,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 2,
	},
	strengthText: {
		fontSize: 12,
		fontWeight: "500",
		minWidth: 50,
	},
});
