import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
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

	useEffect(() => {
		const handleCallback = async () => {
			try {
				if (error) {
					console.error("[Auth Flow] Error in callback:", error);
					router.replace("/auth/login?error=auth_failed");
					return;
				}

				if (!token) {
					console.error("[Auth Flow] No token in callback");
					router.replace("/auth/login?error=auth_failed");
					return;
				}

				await AsyncStorage.setItem(TOKEN_KEY, token as string);

				const response = await fetch(`${API_URL}/api/auth/verify-token`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const userData = await response.json();
					await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData.user));

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

					router.replace("/(tabs)/home");
				} else {
					console.error("[Auth Flow] Failed to verify token:", response.status);
					router.replace("/auth/login?error=auth_failed");
				}
			} catch (error) {
				console.error("[Auth Flow] Error in callback:", error);
				router.replace("/auth/login?error=auth_failed");
			}
		};

		handleCallback();
	}, [token, error, router, setUser]);

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator size="large" color="#6B2FBC" />
		</View>
	);
}
