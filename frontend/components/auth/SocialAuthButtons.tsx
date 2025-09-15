import React from "react";
import { StyleSheet, View, Pressable, Text, Platform } from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

// Register for the auth callback
WebBrowser.maybeCompleteAuthSession();

// API URL for authentication
const API_URL = "https://ripply-backend.onrender.com";

type SocialAuthButtonsProps = {
	onGoogleAuth: () => void;
	onAppleAuth: () => void;
	onFacebookAuth: () => void;
};

/**
 * Component for social authentication buttons (Google, Apple, Facebook)
 */
export default function SocialAuthButtons({
	onGoogleAuth,
	onAppleAuth,
	onFacebookAuth,
}: SocialAuthButtonsProps) {
	const { colors } = useTheme();

	// Handle Google authentication
	const handleGoogleAuth = async () => {
		try {
			console.log("🚀 [AUTH DEBUG] Starting Google OAuth flow");

			// Call the onGoogleAuth callback to show loading state
			onGoogleAuth();

			// Open the Google auth URL in a popup window with client=mobile param
			const authUrl = `${API_URL}/api/auth/google?client=mobile`;
			console.log("🌐 [AUTH DEBUG] Opening auth URL:", authUrl);
			console.log("🔗 [AUTH DEBUG] Return URL scheme:", "ripply://");

			const result = await WebBrowser.openAuthSessionAsync(
				authUrl,
				"ripply://",
				{
					showInRecents: false,
					preferEphemeralSession: true,
					dismissButtonStyle: "cancel",
				}
			);

			console.log(
				"📱 [AUTH DEBUG] WebBrowser result:",
				JSON.stringify(result, null, 2)
			);

			// Close the auth window
			await WebBrowser.dismissAuthSession();

			if (result.type === "success") {
				console.log("✅ [AUTH DEBUG] OAuth success! URL:", result.url);
			} else if (result.type === "cancel") {
				console.log("❌ [AUTH DEBUG] OAuth cancelled by user");
			} else {
				console.log("💥 [AUTH DEBUG] OAuth failed:", result.type);
			}

			if (result.type !== "success") {
				// Show error in the main app
				alert(`Authentication ${result.type}. Please try again.`);
			}
		} catch (error) {
			console.error("💀 [AUTH DEBUG] Exception in Google auth:", error);
			alert("Authentication failed. Please try again.");
		}
	};

	// Handle Apple authentication
	const handleAppleAuth = async () => {
		try {
			// Call the onAppleAuth callback to show loading state
			onAppleAuth();

			// Open the Apple auth URL in a popup window
			const authUrl = `${API_URL}/api/auth/apple`;
			const result = await WebBrowser.openAuthSessionAsync(
				authUrl,
				"ripply://",
				{
					showInRecents: false,
					preferEphemeralSession: true,
					dismissButtonStyle: "cancel",
				}
			);

			// Close the auth window
			await WebBrowser.dismissAuthSession();

			if (result.type !== "success") {
				// Show error in the main app
				alert("Authentication failed. Please try again.");
			}
		} catch (error) {
			console.error("Apple auth error:", error);
			alert("Authentication failed. Please try again.");
		}
	};

	// Handle Facebook authentication (placeholder for future implementation)
	const handleFacebookAuth = () => {
		// Call the onFacebookAuth callback
		onFacebookAuth();

		// Facebook auth is not implemented yet
		alert("Facebook authentication is not implemented yet.");
	};

	return (
		<View style={styles.container}>
			<View style={styles.dividerContainer}>
				<View style={[styles.divider, { backgroundColor: colors.border }]} />
				<Text style={[styles.dividerText, { color: colors.textTertiary }]}>
					OR
				</Text>
				<View style={[styles.divider, { backgroundColor: colors.border }]} />
			</View>

			<View style={styles.buttonsContainer}>
				<Pressable
					style={[
						styles.socialButton,
						{
							borderColor: colors.border,
							backgroundColor: colors.card,
						},
					]}
					onPress={handleGoogleAuth}
				>
					<Feather
						name="chrome"
						size={20}
						color={Colors.brand.googleRed}
						style={styles.socialIcon}
					/>
					<Text style={[styles.socialButtonText, { color: colors.text }]}>
						Continue with Google
					</Text>
				</Pressable>

				{/* Only show Apple login on iOS devices */}
				{Platform.OS === "ios" && (
					<Pressable
						style={[
							styles.socialButton,
							{
								borderColor: colors.border,
								backgroundColor: colors.card,
							},
						]}
						onPress={handleAppleAuth}
					>
						<FontAwesome
							name="apple"
							size={20}
							color={colors.text}
							style={styles.socialIcon}
						/>
						<Text style={[styles.socialButtonText, { color: colors.text }]}>
							Continue with Apple
						</Text>
					</Pressable>
				)}

				<Pressable
					style={[
						styles.socialButton,
						{
							borderColor: colors.border,
							backgroundColor: colors.card,
						},
					]}
					onPress={handleFacebookAuth}
				>
					<FontAwesome
						name="facebook"
						size={20}
						color={Colors.brand.facebookBlue}
						style={styles.socialIcon}
					/>
					<Text style={[styles.socialButtonText, { color: colors.text }]}>
						Continue with Facebook
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		marginVertical: 20,
	},
	dividerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 15,
	},
	divider: {
		flex: 1,
		height: 1,
	},
	dividerText: {
		marginHorizontal: 10,
		fontSize: 14,
	},
	buttonsContainer: {
		gap: 12,
	},
	socialButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	socialButtonText: {
		fontSize: 16,
		fontWeight: "500",
		marginLeft: 10,
	},
	socialIcon: {
		width: 20,
		height: 20,
	},
});
