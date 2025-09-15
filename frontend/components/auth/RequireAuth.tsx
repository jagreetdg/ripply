import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

interface RequireAuthProps {
	children: React.ReactNode;
}

/**
 * A component that protects routes by requiring authentication.
 * If the user is not authenticated, they will be redirected to the landing page.
 * If the user is authenticated and on the landing page, they will be redirected to home.
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
		"/auth/universal-callback",
	];
	const isPublicRoute = publicRoutes.includes(pathname);

	console.log("[DEBUG] RequireAuth - Current pathname:", pathname);
	console.log("[DEBUG] RequireAuth - Is public route:", isPublicRoute);
	console.log("[DEBUG] RequireAuth - User authenticated:", !!user);
	console.log("[DEBUG] RequireAuth - Auth loading state:", loading);

	// Handle authentication-based routing
	useEffect(() => {
		// Wait for loading to complete before making routing decisions
		if (loading) return;

		// Case 1: User is NOT authenticated and trying to access protected route
		if (!user && !isPublicRoute) {
			console.log(
				"[DEBUG] RequireAuth - Unauthenticated user on protected route, redirecting to landing"
			);
			router.replace("/");
			return;
		}

		// Case 2: User IS authenticated and on landing page
		// Only redirect if we're specifically on the root path to avoid conflicts
		if (user && pathname === "/") {
			console.log(
				"[DEBUG] RequireAuth - Authenticated user on landing page, redirecting to home"
			);
			router.replace("/(tabs)/home");
			return;
		}
	}, [user, loading, router, pathname, isPublicRoute]);

	// Show loading if we're still loading user data
	if (loading) {
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
