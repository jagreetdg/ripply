import React from "react";
import { useLocalSearchParams, Redirect } from "expo-router";

/**
 * This component handles redirecting from user ID-based URLs to username-based URLs
 * It's kept for backward compatibility with existing links
 */
export default function UserProfilePage() {
	// Get the userId from the route params
	const { userId } = useLocalSearchParams<{ userId: string }>();

	console.log("Redirecting from userId to username-based profile");

	// Redirect to the notfound page - we no longer support userId-based routes
	return <Redirect href="/(with-tabs)/notfound" />;
}
