import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { UniversalAuth } from "../../services/api/universalAuth";
import { useTheme } from "../../context/ThemeContext";

/**
 * Universal OAuth Callback Handler
 * Handles callbacks from all OAuth providers using industry-standard flow
 * Works identically across all platforms
 */
export default function UniversalCallback() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { colors } = useTheme();
	const [isProcessing, setIsProcessing] = useState(true);
	const [processingStatus, setProcessingStatus] = useState(
		"Processing authentication..."
	);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				console.log("[Universal Callback] Processing OAuth callback");
				console.log("[Universal Callback] Params:", params);

				setProcessingStatus("Verifying authentication...");

				// Extract token and error from params
				const token = params.token as string;
				const error = params.error as string;

				if (error) {
					console.error("[Universal Callback] OAuth error:", error);
					setProcessingStatus("Authentication failed");

					// Show user-friendly error message
					let errorMessage = "Authentication failed. Please try again.";
					switch (error) {
						case "access_denied":
							errorMessage = "Authentication was cancelled or denied.";
							break;
						case "oauth_init_failed":
							errorMessage =
								"Failed to start authentication. Please check your connection.";
							break;
						case "callback_failed":
							errorMessage =
								"Authentication callback failed. Please try again.";
							break;
						case "provider_not_configured":
							errorMessage = "This authentication method is not available.";
							break;
					}

					Alert.alert("Authentication Error", errorMessage);

					// Redirect to login with error
					setTimeout(() => {
						router.replace("/auth/login?error=oauth_failed");
					}, 2000);
					return;
				}

				if (!token) {
					console.error("[Universal Callback] No token received");
					setProcessingStatus("No authentication token received");
					Alert.alert(
						"Authentication Error",
						"No authentication token was received. Please try again."
					);

					setTimeout(() => {
						router.replace("/auth/login?error=no_token");
					}, 2000);
					return;
				}

				setProcessingStatus("Saving authentication...");

				// Store the token
				await UniversalAuth.storeToken(token);

				setProcessingStatus("Getting user profile...");

				// Verify token and get user data
				const response = await fetch(
					"https://ripply-backend.onrender.com/api/auth/verify-token",
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error("Failed to verify authentication token");
				}

				const { user } = await response.json();

				console.log("[Universal Callback] Authentication successful:", {
					userId: user.id,
					email: user.email,
				});

				setProcessingStatus("Authentication successful!");

				// Clear URL parameters to prevent redirect loops
				if (typeof window !== "undefined" && window.history?.replaceState) {
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname
					);
				}

				// Redirect to home/main app
				setTimeout(() => {
					router.replace("/(tabs)/home");
				}, 1000);
			} catch (error) {
				console.error("[Universal Callback] Error processing callback:", error);
				setProcessingStatus("Failed to process authentication");

				Alert.alert(
					"Authentication Error",
					"Failed to complete authentication. Please try again."
				);

				setTimeout(() => {
					router.replace("/auth/login?error=processing_failed");
				}, 2000);
			} finally {
				setIsProcessing(false);
			}
		};

		handleCallback();
	}, [params, router]);

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: colors.background,
				padding: 20,
			}}
		>
			{isProcessing && (
				<ActivityIndicator
					size="large"
					color={colors.tint}
					style={{ marginBottom: 20 }}
				/>
			)}

			<Text
				style={{
					fontSize: 18,
					fontWeight: "600",
					color: colors.text,
					textAlign: "center",
					marginBottom: 10,
				}}
			>
				{processingStatus}
			</Text>

			<Text
				style={{
					fontSize: 14,
					color: colors.textSecondary,
					textAlign: "center",
				}}
			>
				Please wait while we complete your authentication...
			</Text>
		</View>
	);
}
