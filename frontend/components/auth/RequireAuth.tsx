import React, { useEffect } from "react";
import { useRouter, usePathname } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

type RequireAuthProps = {
	children: React.ReactNode;
};

/**
 * A component that protects routes by requiring authentication.
 * If the user is not authenticated, they will be redirected to the landing page.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
	const { user, loading } = useUser();
	const { colors } = useTheme();
	const router = useRouter();
	const pathname = usePathname();

	// Public routes that don't require authentication
	const publicRoutes = [
		"/",
		"/auth/login",
		"/auth/signup",
		"/auth/social-callback",
		"/auth/google-callback",
		"/auth/apple-callback",
	];
	const isPublicRoute = publicRoutes.includes(pathname);

	console.log("[DEBUG] RequireAuth - Current pathname:", pathname);
	console.log("[DEBUG] RequireAuth - Is public route:", isPublicRoute);
	console.log("[DEBUG] RequireAuth - User authenticated:", !!user);
	console.log("[DEBUG] RequireAuth - Auth loading state:", loading);

	// Handle protected route access
	useEffect(() => {
		// Only redirect if:
		// 1. Not loading the user state
		// 2. User is not authenticated
		// 3. Not on a public route
		if (!loading && !user && !isPublicRoute) {
			console.log("[DEBUG] RequireAuth - Redirecting to landing page");
			console.log("[DEBUG] RequireAuth - From pathname:", pathname);
			router.replace("/");
		}
	}, [user, loading, router, pathname, isPublicRoute]);

	// Show loading if we're still loading user data and not on a public route
	if (loading && !isPublicRoute) {
		console.log("[DEBUG] RequireAuth - Showing loading indicator");
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color={colors.tint} />
			</View>
		);
	}

	// If on a public route or authenticated, render children
	console.log("[DEBUG] RequireAuth - Rendering children");
	return <>{children}</>;
}
