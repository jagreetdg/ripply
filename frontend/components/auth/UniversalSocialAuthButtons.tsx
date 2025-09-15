import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	Pressable,
	Text,
	Platform,
	ActivityIndicator,
} from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { UniversalAuth } from "../../services/api/universalAuth";
import Colors from "../../constants/Colors";

interface UniversalSocialAuthButtonsProps {
	onAuthSuccess?: (result: { user: any; token: string }) => void;
	onAuthError?: (error: string) => void;
}

/**
 * Universal Social Authentication Buttons
 * Uses industry-standard OAuth 2.0 PKCE flow for all platforms
 * Works identically on web, iOS, Android, development, and production
 */
export default function UniversalSocialAuthButtons({
	onAuthSuccess,
	onAuthError,
}: UniversalSocialAuthButtonsProps) {
	const { colors } = useTheme();
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
	const [availableProviders, setAvailableProviders] = useState<string[]>([]);

	useEffect(() => {
		// Check which providers are available
		const checkProviders = async () => {
			try {
				const providers = await UniversalAuth.getAvailableProviders();
				setAvailableProviders(providers.map((p) => p.id));
			} catch (error) {
				console.error("[Universal Auth] Error checking providers:", error);
			}
		};

		checkProviders();
	}, []);

	const handleOAuth = async (provider: string) => {
		if (loadingProvider) return; // Prevent multiple simultaneous auth attempts

		setLoadingProvider(provider);

		try {
			console.log(`[Universal Auth] Starting ${provider} authentication`);

			// For web platforms, the redirect happens immediately
			// For mobile, this will complete the full OAuth flow
			const result = await UniversalAuth.authenticateWithProvider(provider);

			if (result.success && result.user && result.token) {
				console.log(`[Universal Auth] ${provider} authentication successful`);
				onAuthSuccess?.({
					user: result.user,
					token: result.token,
				});
			} else {
				// For web, this means the redirect is happening
				// For mobile, this is an actual error
				if (Platform.OS !== "web") {
					console.error(
						`[Universal Auth] ${provider} authentication failed:`,
						result.error
					);
					onAuthError?.(
						result.error || `Failed to authenticate with ${provider}`
					);
				}
				// For web, don't show error - redirect is in progress
			}
		} catch (error) {
			console.error(
				`[Universal Auth] ${provider} authentication error:`,
				error
			);
			onAuthError?.(
				`Authentication with ${provider} failed. Please try again.`
			);
		} finally {
			// Only clear loading state for mobile platforms
			// For web, the page will redirect so this won't matter
			if (Platform.OS !== "web") {
				setLoadingProvider(null);
			}
		}
	};

	const isProviderLoading = (provider: string) => loadingProvider === provider;
	const isProviderAvailable = (provider: string) =>
		availableProviders.includes(provider);

	const renderProviderButton = (
		provider: string,
		displayName: string,
		icon: React.ReactNode,
		platformCheck?: boolean
	) => {
		// Skip if platform check fails (e.g., Apple on non-iOS)
		if (platformCheck === false) return null;

		const isAvailable = isProviderAvailable(provider);
		const isLoading = isProviderLoading(provider);
		const isDisabled = !isAvailable || !!loadingProvider;

		return (
			<Pressable
				key={provider}
				style={[
					styles.socialButton,
					{
						borderColor: colors.border,
						backgroundColor: isDisabled ? colors.card : colors.card,
						opacity: isDisabled ? 0.6 : 1,
					},
				]}
				onPress={() => handleOAuth(provider)}
				disabled={isDisabled}
			>
				{isLoading ? (
					<ActivityIndicator
						size="small"
						color={colors.text}
						style={styles.socialIcon}
					/>
				) : (
					icon
				)}
				<Text style={[styles.socialButtonText, { color: colors.text }]}>
					{isLoading
						? `Connecting to ${displayName}...`
						: `Continue with ${displayName}`}
				</Text>
			</Pressable>
		);
	};

	if (availableProviders.length === 0) {
		// Show loading state while checking providers
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
					<View
						style={[
							styles.socialButton,
							{ borderColor: colors.border, backgroundColor: colors.card },
						]}
					>
						<ActivityIndicator
							size="small"
							color={colors.text}
							style={styles.socialIcon}
						/>
						<Text style={[styles.socialButtonText, { color: colors.text }]}>
							Loading authentication options...
						</Text>
					</View>
				</View>
			</View>
		);
	}

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
				{/* Google */}
				{renderProviderButton(
					"google",
					"Google",
					<Feather
						name="chrome"
						size={20}
						color={Colors.brand.googleRed}
						style={styles.socialIcon}
					/>
				)}

				{/* Apple (iOS only) */}
				{renderProviderButton(
					"apple",
					"Apple",
					<FontAwesome
						name="apple"
						size={20}
						color={colors.text}
						style={styles.socialIcon}
					/>,
					Platform.OS === "ios" // Only show on iOS
				)}

				{/* Facebook */}
				{renderProviderButton(
					"facebook",
					"Facebook",
					<FontAwesome
						name="facebook"
						size={20}
						color={Colors.brand.facebookBlue}
						style={styles.socialIcon}
					/>
				)}
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
		minHeight: 48, // Ensure consistent height
	},
	socialButtonText: {
		fontSize: 16,
		fontWeight: "500",
		marginLeft: 10,
		flex: 1,
		textAlign: "center",
	},
	socialIcon: {
		width: 20,
		height: 20,
	},
});
