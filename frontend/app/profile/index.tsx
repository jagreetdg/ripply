import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

export default function ProfileIndex() {
	const router = useRouter();
	const { user, loading } = useUser();
	const { colors } = useTheme();

	useEffect(() => {
		if (!loading) {
			if (user && user.username) {
				// Redirect to the user's own profile page
				router.replace({
					pathname: "/profile/[username]",
					params: { username: user.username },
				});
			} else {
				// If no user is logged in, redirect to login
				router.replace("/auth/login");
			}
		}
	}, [user, loading, router]);

	// Show loading spinner while determining where to redirect
	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: colors.background,
			}}
		>
			<ActivityIndicator size="large" color={colors.tint} />
		</View>
	);
}
