import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

type ThemeOption = {
	label: string;
	value: "light" | "dark" | "system";
	icon: keyof typeof Feather.glyphMap;
};

const themeOptions: ThemeOption[] = [
	{ label: "Light Theme", value: "light", icon: "sun" },
	{ label: "Dark Theme", value: "dark", icon: "moon" },
	{ label: "System Default", value: "system", icon: "smartphone" },
];

export const ThemePreferences: React.FC = () => {
	const { theme, setTheme, colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.card }]}>
			<Text style={[styles.title, { color: colors.text }]}>
				Theme Preferences
			</Text>
			<Text style={[styles.description, { color: colors.textSecondary }]}>
				Choose how Ripply appears to you
			</Text>

			<View style={[styles.optionsContainer, { borderColor: colors.border }]}>
				{themeOptions.map((option, index) => (
					<TouchableOpacity
						key={option.value}
						style={[
							styles.optionItem,
							{
								borderBottomColor: colors.border,
								borderBottomWidth: index === themeOptions.length - 1 ? 0 : 1,
								backgroundColor:
									theme === option.value ? colors.background : "transparent",
							},
						]}
						onPress={() => setTheme(option.value)}
					>
						<View style={styles.optionContent}>
							<View
								style={[
									styles.iconContainer,
									{
										backgroundColor:
											theme === option.value ? colors.tint : colors.background,
									},
								]}
							>
								<Feather
									name={option.icon}
									size={18}
									color={
										theme === option.value ? colors.white : colors.textSecondary
									}
								/>
							</View>
							<Text style={[styles.optionLabel, { color: colors.text }]}>
								{option.label}
							</Text>
						</View>

						{theme === option.value && (
							<Feather name="check" size={20} color={colors.tint} />
						)}
					</TouchableOpacity>
				))}
			</View>

			<Text style={[styles.footnote, { color: colors.textTertiary }]}>
				Changes will be applied immediately and saved for your next visit
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 12,
		marginVertical: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	description: {
		fontSize: 14,
		marginBottom: 16,
	},
	optionsContainer: {
		borderRadius: 8,
		borderWidth: 1,
		overflow: "hidden",
		marginBottom: 12,
	},
	optionItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	optionContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	optionLabel: {
		fontSize: 16,
		fontWeight: "500",
	},
	footnote: {
		fontSize: 12,
		fontStyle: "italic",
		textAlign: "center",
	},
});
