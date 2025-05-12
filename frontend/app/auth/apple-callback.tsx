import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../../context/UserContext";
import { useRouter, useLocalSearchParams } from "expo-router";

// Token storage keys
const TOKEN_KEY = "@ripply_auth_token";
const USER_KEY = "@ripply_user";

// API URL for authentication
const API_URL = "https://ripply-backend.onrender.com";

export default function AppleCallback() {
	const router = useRouter();
	const { token, error } = useLocalSearchParams();
	const { setUser } = useUser();
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingError, setProcessingError] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = async () => {
			// Prevent multiple processing attempts
			if (isProcessing) return;
			setIsProcessing(true);

			try {
				console.log("[Auth Flow] Apple callback received");
				console.log("[Auth Flow] Token:", token ? "Present" : "Not present");
				console.log("[Auth Flow] Error:", error ? "Present" : "Not present");

				if (error) {
					console.error("[Auth Flow] Error in callback:", error);
					setProcessingError("Authentication failed");
					router.replace("/auth/login?error=auth_failed");
					return;
				}

				if (!token) {
					console.error("[Auth Flow] No token in callback");
					setProcessingError("No authentication token received");
					router.replace("/auth/login?error=auth_failed");
					return;
				}

				// Store token in AsyncStorage - WAIT for this to complete
				console.log("[Auth Flow] Storing token in AsyncStorage");
				await AsyncStorage.setItem(TOKEN_KEY, token as string);

				// Clear URL parameters to prevent redirect loops (for web)
				if (
					Platform.OS === "web" &&
					window.history &&
					window.history.replaceState
				) {
					console.log("[Auth Flow] Clearing URL parameters");
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname
					);
					console.log("[Auth Flow] New URL:", window.location.href);
				}

				// Fetch user data
				console.log("[Auth Flow] Fetching user data");
				const response = await fetch(`${API_URL}/api/auth/verify-token`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					console.log("[Auth Flow] Token verification successful");
					const userData = await response.json();

					// Store user data - WAIT for this to complete
					console.log("[Auth Flow] Storing user data");
					await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData.user));

					// Update user context
					console.log("[Auth Flow] Updating user context");
					setUser({
						id: userData.user.id,
						username: userData.user.username,
						email: userData.user.email,
						display_name: userData.user.display_name || userData.user.username,
						avatar_url: userData.user.avatar_url || null,
						bio: userData.user.bio || null,
						is_verified: userData.user.is_verified || false,
						created_at: userData.user.created_at,
						updated_at: userData.user.updated_at,
					});

					// Short delay to ensure state propagation
					await new Promise((resolve) => setTimeout(resolve, 50));

					// Navigate to home screen
					console.log("[Auth Flow] Navigating to home screen");
					router.replace("/(tabs)/home");
				} else {
					console.error("[Auth Flow] Failed to verify token:", response.status);
					setProcessingError("Failed to verify authentication");
					router.replace("/auth/login?error=auth_failed");
				}
			} catch (error) {
				console.error("[Auth Flow] Error in callback:", error);
				setProcessingError("Authentication process failed");
				router.replace("/auth/login?error=auth_failed");
			} finally {
				setIsProcessing(false);
			}
		};

		handleCallback();
	}, [token, error, router, setUser, isProcessing]);

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#6B2FBC" />
			{processingError && (
				<Text style={{ marginTop: 20, color: "#ff3b30", textAlign: "center" }}>
					{processingError}
				</Text>
			)}
		</View>
	);
}
