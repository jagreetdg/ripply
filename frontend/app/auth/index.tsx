import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator } from "react-native";

/**
 * Main auth handler for deep links
 * Routes to appropriate callback handler based on URL structure
 *
 * Deep link formats:
 * ripply://auth?error=...
 * ripply://auth/google-callback?token=...
 * ripply://auth/apple-callback?token=...
 */
export default function AuthIndex() {
	const router = useRouter();
	const params = useLocalSearchParams();

	useEffect(() => {
		console.log("[Auth Index] Deep link received with params:", params);

		// Handle error cases
		if (params.error) {
			console.log("[Auth Index] Error parameter found, redirecting to login");
			router.replace(`/auth/login?error=${params.error}`);
			return;
		}

		// Handle token callbacks - check if this is a provider callback
		if (params.token) {
			// Check the current path to determine provider
			const currentUrl = router.toString();
			console.log("[Auth Index] Current URL:", currentUrl);

			if (currentUrl.includes("google-callback")) {
				console.log("[Auth Index] Routing to Google callback");
				router.replace(`/auth/google-callback?token=${params.token}`);
			} else if (currentUrl.includes("apple-callback")) {
				console.log("[Auth Index] Routing to Apple callback");
				router.replace(`/auth/apple-callback?token=${params.token}`);
			} else {
				console.log("[Auth Index] Generic social callback");
				router.replace(`/auth/social-callback?token=${params.token}`);
			}
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
