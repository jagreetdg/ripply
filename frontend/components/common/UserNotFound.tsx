import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

interface UserNotFoundProps {
	username?: string;
}

export const UserNotFound: React.FC<UserNotFoundProps> = ({ username }) => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();

	const handleGoHome = () => {
		router.replace("/");
	};

	const handleSearch = () => {
		router.push("/search");
	};

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, backgroundColor: colors.card },
			]}
		>
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>
			</View>

			<View style={styles.content}>
				<View style={styles.iconContainer}>
					<FontAwesome5
						name="user-slash"
						size={80}
						color={colors.tint}
						style={styles.icon}
					/>
					<View
						style={[
							styles.iconBackground,
							{ backgroundColor: colors.background },
						]}
					/>
				</View>

				<Text style={[styles.title, { color: colors.tint }]}>
					User Not Found
				</Text>

				{username && (
					<Text style={[styles.subtitle, { color: colors.text }]}>
						We couldn't find a user with the username{" "}
						<Text style={[styles.highlight, { color: colors.tint }]}>
							{username}
						</Text>
					</Text>
				)}

				<Text style={[styles.message, { color: colors.textSecondary }]}>
					The user may have changed their username or deleted their account.
				</Text>

				<View style={styles.actions}>
					<TouchableOpacity
						style={[
							styles.primaryButton,
							{
								backgroundColor: colors.tint,
								shadowColor: colors.tint,
							},
						]}
						onPress={handleGoHome}
					>
						<Text style={[styles.primaryButtonText, { color: colors.white }]}>
							Go to Home
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.secondaryButton,
							{ backgroundColor: colors.background },
						]}
						onPress={handleSearch}
					>
						<Text style={[styles.secondaryButtonText, { color: colors.text }]}>
							Search for Users
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	backButton: {
		padding: 8,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	iconContainer: {
		width: 200,
		height: 200,
		marginBottom: 24,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	iconBackground: {
		position: "absolute",
		width: 160,
		height: 160,
		borderRadius: 80,
		zIndex: 0,
	},
	icon: {
		zIndex: 1,
		marginBottom: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 16,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 18,
		marginBottom: 8,
		textAlign: "center",
	},
	highlight: {
		fontWeight: "bold",
	},
	message: {
		fontSize: 16,
		marginBottom: 32,
		textAlign: "center",
		lineHeight: 22,
	},
	actions: {
		width: "100%",
		gap: 12,
		alignItems: "center",
	},
	primaryButton: {
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 30,
		alignItems: "center",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
		width: "70%",
		maxWidth: 250,
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	secondaryButton: {
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 30,
		alignItems: "center",
		width: "70%",
		maxWidth: 250,
	},
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
});
