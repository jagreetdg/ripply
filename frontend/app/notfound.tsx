import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

/**
 * Custom 404 Not Found page for handling all unmatched routes
 * This is used as a central error page for invalid routes and URLs
 */
export default function NotFoundScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();

	const handleGoHome = () => {
		router.replace("/");
	};

	const handleGoBack = () => {
		router.back();
	};

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		header: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
		},
		backButton: {
			padding: 8,
		},
		content: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			padding: 24,
			position: "relative",
			overflow: "hidden",
		},
		patternTop: {
			position: "absolute",
			top: -100,
			right: -100,
			width: 300,
			height: 300,
			borderRadius: 150,
			backgroundColor: `${colors.tint}${colors.opacity.light}`,
			zIndex: -1,
		},
		patternBottom: {
			position: "absolute",
			bottom: -80,
			left: -80,
			width: 250,
			height: 250,
			borderRadius: 125,
			backgroundColor: `${colors.tint}${colors.opacity.medium}`,
			zIndex: -1,
		},
		iconContainer: {
			marginBottom: 30,
		},
		iconWrapper: {
			width: 160,
			height: 160,
			borderRadius: 80,
			backgroundColor: `${colors.tint}${colors.opacity.light}`,
			justifyContent: "center",
			alignItems: "center",
			borderWidth: 2,
			borderColor: `${colors.tint}${colors.opacity.medium}`,
			borderStyle: "dashed",
		},
		title: {
			fontSize: 32,
			fontWeight: "bold",
			color: colors.text,
			marginBottom: 16,
			textAlign: "center",
		},
		divider: {
			width: 60,
			height: 4,
			backgroundColor: `${colors.tint}${colors.opacity.strong}`,
			borderRadius: 2,
			marginBottom: 20,
		},
		message: {
			fontSize: 18,
			color: colors.textSecondary,
			marginBottom: 40,
			textAlign: "center",
			lineHeight: 26,
			maxWidth: 320,
		},
		actions: {
			width: "100%",
			gap: 16,
			alignItems: "center",
		},
		primaryButton: {
			backgroundColor: colors.tint,
			paddingVertical: 14,
			paddingHorizontal: 32,
			borderRadius: 30,
			alignItems: "center",
			shadowColor: colors.tint,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.2,
			shadowRadius: 8,
			elevation: 4,
			width: "70%",
			maxWidth: 250,
		},
		primaryButtonText: {
			color: colors.white,
			fontSize: 16,
			fontWeight: "600",
		},
		secondaryButton: {
			backgroundColor: colors.card,
			paddingVertical: 14,
			paddingHorizontal: 32,
			borderRadius: 30,
			alignItems: "center",
			width: "70%",
			maxWidth: 250,
			borderWidth: 1,
			borderColor: colors.border,
		},
		secondaryButtonText: {
			color: colors.text,
			fontSize: 16,
			fontWeight: "600",
		},
	});

	return (
		<ScrollView
			contentContainerStyle={[styles.container, { paddingTop: insets.top }]}
		>
			<View style={styles.header}>
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
					<Feather name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<View style={styles.patternTop} />
				<View style={styles.patternBottom} />

				<View style={styles.iconContainer}>
					<View style={styles.iconWrapper}>
						<Feather name="compass" size={80} color={colors.tint} />
					</View>
				</View>

				<Text style={styles.title}>Page Not Found</Text>

				<View style={styles.divider} />

				<Text style={styles.message}>
					Looks like you've wandered off the path. The page you're looking for
					doesn't exist.
				</Text>

				<View style={styles.actions}>
					<TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
						<Text style={styles.primaryButtonText}>Go to Home</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.secondaryButton}
						onPress={handleGoBack}
					>
						<Text style={styles.secondaryButtonText}>Go Back</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ScrollView>
	);
}
