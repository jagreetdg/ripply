import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator } from "react-native";

/**
 * Main auth handler for deep links
 * Routes to the universal callback handler for all OAuth providers
 *
 * Deep link formats:
 * ripply://auth/callback?token=... (Universal - handles all providers)
 * ripply://auth/callback?error=... (Universal error handling)
 * ripply://auth?error=... (Legacy error handling)
 */
export default function AuthIndex() {
	const router = useRouter();
	const params = useLocalSearchParams();

	useEffect(() => {
		console.log("[Auth Index] Deep link received with params:", params);

		// Handle universal OAuth callback (token or error)
		if (params.token || params.error) {
			console.log(
				"[Auth Index] OAuth callback detected, routing to universal callback"
			);
			const queryParams = new URLSearchParams();

			if (params.token) {
				queryParams.set("token", params.token as string);
			}

			if (params.error) {
				queryParams.set("error", params.error as string);
			}

			router.replace(`/auth/universal-callback?${queryParams.toString()}`);
			return;
		}

		// If no specific action, redirect to login
		console.log("[Auth Index] No specific action, redirecting to login");
		router.replace("/auth/login");
	}, [params, router]);

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#6B2FBC" />
		</View>
	);
}
