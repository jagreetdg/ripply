import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	ViewStyle,
} from "react-native";
import { useTheme, useAnimatedColor } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

interface AnimatedCardProps {
	title: string;
	description: string;
	onPress?: () => void;
	style?: ViewStyle;
}

/**
 * A card component with smooth theme transitions
 * Demonstrates usage of the animated theme system
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
	title,
	description,
	onPress,
	style,
}) => {
	const { colors, isDarkMode } = useTheme();

	// Create animated colors that will transition smoothly
	const animatedBackground = useAnimatedColor(
		Colors.light.card,
		Colors.dark.card
	);

	const animatedText = useAnimatedColor(Colors.light.text, Colors.dark.text);

	const animatedBorder = useAnimatedColor(
		Colors.light.border,
		Colors.dark.border
	);

	const animatedSecondaryText = useAnimatedColor(
		Colors.light.textSecondary,
		Colors.dark.textSecondary
	);

	const animatedShadow = useAnimatedColor(
		"rgba(0, 0, 0, 0.1)",
		"rgba(0, 0, 0, 0.3)"
	);

	const CardContent = () => (
		<Animated.View
			style={[
				styles.container,
				{
					backgroundColor: animatedBackground,
					borderColor: animatedBorder,
					shadowColor: animatedShadow,
				},
				style,
			]}
		>
			<Animated.Text style={[styles.title, { color: animatedText }]}>
				{title}
			</Animated.Text>

			<Animated.Text
				style={[styles.description, { color: animatedSecondaryText }]}
			>
				{description}
			</Animated.Text>

			<Animated.View
				style={[
					styles.footer,
					{
						borderTopColor: animatedBorder,
					},
				]}
			>
				<Animated.Text style={[styles.footerText, { color: colors.tint }]}>
					{isDarkMode ? "Currently in Dark Mode" : "Currently in Light Mode"}
				</Animated.Text>
			</Animated.View>
		</Animated.View>
	);

	if (onPress) {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={0.8}>
				<CardContent />
			</TouchableOpacity>
		);
	}

	return <CardContent />;
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 12,
		padding: 16,
		marginVertical: 8,
		borderWidth: 1,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
	},
	description: {
		fontSize: 14,
		marginBottom: 16,
		lineHeight: 20,
	},
	footer: {
		borderTopWidth: 1,
		paddingTop: 12,
		marginTop: 8,
	},
	footerText: {
		fontSize: 12,
		fontWeight: "500",
	},
});
