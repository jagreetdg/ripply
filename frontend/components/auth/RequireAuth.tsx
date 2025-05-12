import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";
import { useUser } from "../../context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Token storage key - must match the one used in UserContext
const TOKEN_KEY = "@ripply_auth_token";

type RequireAuthProps = {
	children: React.ReactNode;
};

/**
 * A component that protects routes by requiring authentication.
 * If the user is not authenticated, they will be redirected to the landing page.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
	const { user, loading } = useUser();
	const router = useRouter();
	const pathname = usePathname();
	const [checkingStorage, setCheckingStorage] = useState(false);
	const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
	const [hasStoredToken, setHasStoredToken] = useState(false);

	// Public routes that don't require authentication
	const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/social-callback", "/auth/google-callback", "/auth/apple-callback"];
	const isPublicRoute = publicRoutes.includes(pathname);

	console.log("[DEBUG] RequireAuth - Component rendered");
	console.log("[DEBUG] RequireAuth - Current pathname:", pathname);
	console.log("[DEBUG] RequireAuth - Is public route:", isPublicRoute);
	console.log("[DEBUG] RequireAuth - User authenticated:", !!user);
	console.log("[DEBUG] RequireAuth - Auth loading state:", loading);
	console.log("[DEBUG] RequireAuth - Checking storage:", checkingStorage);
	console.log("[DEBUG] RequireAuth - Has stored token:", hasStoredToken);
	
	// For web only, log the current URL
	if (Platform.OS === "web" && typeof window !== "undefined") {
		console.log("[DEBUG] RequireAuth - Current URL:", window.location.href);
	}

	// First check for token in AsyncStorage to catch cases where user context hasn't synced yet
	useEffect(() => {
		// Skip check if already checked or if we're on a public route
		if (hasCheckedStorage || isPublicRoute || user) {
			return;
		}

		const checkForToken = async () => {
			setCheckingStorage(true);
			try {
				console.log("[DEBUG] RequireAuth - Checking AsyncStorage for token");
				const token = await AsyncStorage.getItem(TOKEN_KEY);
				const hasToken = !!token;
				console.log("[DEBUG] RequireAuth - Token found in storage:", hasToken);
				setHasStoredToken(hasToken);
			} catch (error) {
				console.error("[DEBUG] RequireAuth - Error checking token:", error);
			} finally {
				setCheckingStorage(false);
				setHasCheckedStorage(true);
			}
		};

		checkForToken();
	}, [user, isPublicRoute, hasCheckedStorage]);

	// Handle protected route access
	useEffect(() => {
		console.log("[DEBUG] RequireAuth - useEffect executed");
		
		// We should only redirect if:
		// 1. Not loading the user state
		// 2. Not checking AsyncStorage 
		// 3. User is not authenticated
		// 4. No token found in AsyncStorage
		// 5. Not on a public route
		if (!loading && !checkingStorage && !user && !hasStoredToken && !isPublicRoute) {
			console.log("[DEBUG] RequireAuth - Redirecting to landing page");
			console.log("[DEBUG] RequireAuth - From pathname:", pathname);
			router.replace("/");
		} else {
			console.log("[DEBUG] RequireAuth - No redirect needed");
			console.log("[DEBUG] RequireAuth - Loading:", loading);
			console.log("[DEBUG] RequireAuth - User exists:", !!user);
			console.log("[DEBUG] RequireAuth - Has stored token:", hasStoredToken);
			console.log("[DEBUG] RequireAuth - Is public route:", isPublicRoute);
		}
	}, [user, loading, router, pathname, isPublicRoute, checkingStorage, hasStoredToken]);

	// Show loading if we're loading user data or checking storage
	if ((loading || checkingStorage) && !isPublicRoute) {
		console.log("[DEBUG] RequireAuth - Showing loading indicator");
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color="#8A4FD6" />
			</View>
		);
	}

	// If on a public route or authenticated, render children
	console.log("[DEBUG] RequireAuth - Rendering children");
	return <>{children}</>;
}
