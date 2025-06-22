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
	const [hasNavigated, setHasNavigated] = useState(false);

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

	// Handle authentication-based routing
	useEffect(() => {
		// Wait for loading to complete before making routing decisions
		if (loading || hasNavigated) return;

		const navigateWithRetry = (path: string, reason: string) => {
			console.log(`[DEBUG] RequireAuth - ${reason}`);
			setHasNavigated(true);

			const navigate = () => {
				try {
					router.replace(path as any);
				} catch (error) {
					console.error(`[DEBUG] RequireAuth - Navigation error:`, error);
					// Retry after a short delay
					setTimeout(() => {
						try {
							router.replace(path as any);
						} catch (retryError) {
							console.error(
								`[DEBUG] RequireAuth - Retry navigation failed:`,
								retryError
							);
						}
					}, 100);
				}
			};

			// Use requestAnimationFrame for web, setTimeout for native
			if (Platform.OS === "web") {
				requestAnimationFrame(navigate);
			} else {
				setTimeout(navigate, 0);
			}
		};

		// Case 1: User is NOT authenticated and trying to access protected route
		if (!user && !isPublicRoute) {
			navigateWithRetry(
				"/",
				"Unauthenticated user on protected route, redirecting to landing"
			);
		}

		// Case 2: User IS authenticated and on landing page
		// Only redirect if we're specifically on the root path to avoid conflicts
		if (user && pathname === "/") {
			navigateWithRetry(
				"/(tabs)/home",
				"Authenticated user on landing page, redirecting to home"
			);
		}
	}, [user, loading, router, pathname, isPublicRoute, hasNavigated]);

	// Reset navigation flag when pathname changes
	useEffect(() => {
		setHasNavigated(false);
	}, [pathname]);

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
