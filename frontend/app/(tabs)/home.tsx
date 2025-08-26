import React, { useRef, useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Animated, Platform, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { HomeHeader } from "../../components/home/HomeHeader";
import { FeedContent } from "../../components/home/FeedContent";
import { FloatingActionButton } from "../../components/home/FloatingActionButton";
import { useTheme } from "../../context/ThemeContext";
import { useFeedData } from "../../hooks/useFeedData";

const HEADER_HEIGHT = 60; // Header height

export default function HomeScreen() {
	console.log("[DEBUG] Home - Component rendering");
	const scrollY = useRef(new Animated.Value(0)).current;
	const flatListRef = useRef<FlatList>(null);
	const { colors } = useTheme();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	// Only show FAB in home tab
	const showFAB = pathname === "/home";

	// Scroll to top function to pass to the header
	const scrollToTop = () => {
		flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
	};

	// Effect to track mounting/unmounting
	useEffect(() => {
		console.log("[DEBUG] Home - Component mounted");

		// Get current URL in web environment
		if (Platform.OS === "web" && typeof window !== "undefined") {
			console.log("[DEBUG] Home - Current URL:", window.location.href);
		}

		return () => {
			console.log("[DEBUG] Home - Component unmounting");
		};
	}, []);

	// Use the new useFeedData hook with infinite scroll support
	const {
		feedItems,
		loading,
		loadingMore,
		hasMoreData,
		error,
		refreshing,
		handleRefresh,
		handleLoadMore,
		handlePlayVoiceNote,
		diagnosticData,
	} = useFeedData();

	const handleScroll = Animated.event(
		[{ nativeEvent: { contentOffset: { y: scrollY } } }],
		{ useNativeDriver: true }
	);

	const handleNewVoiceNote = () => {
		console.log("Navigating to voice note creation");
		router.push("/create");
	};

	// Handle user profile navigation
	const handleUserProfilePress = useCallback(
		(userId: string, username?: string) => {
			if (username) {
				// If we have a username, use that for navigation (preferred)
				console.log("Navigating to profile by username:", username);
				router.push({
					pathname: "/profile/[username]",
					params: { username },
				});
			} else if (userId) {
				// Fallback to userId if username is not available
				console.log("Navigating to user profile with UUID:", userId);
				router.push({
					pathname: "/[userId]",
					params: { userId },
				});
			} else {
				// If no valid userId or username is provided, navigate to a default profile
				console.warn("No valid user identifier for navigation");
				router.push("/profile/user");
			}
		},
		[router]
	);

	// Compute header translation based on scroll position
	const headerTranslateY = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [0, -HEADER_HEIGHT],
		extrapolate: "clamp",
	});

	return (
		<View style={styles.container}>
			{/* Background blocker - placed first to ensure it's below other content */}
			<View
				style={[
					styles.backgroundBlocker,
					{ backgroundColor: colors.background },
				]}
			/>

			{/* Animated Header - now stays fixed */}
			<Animated.View
				style={[
					styles.headerContainer,
					{
						height: HEADER_HEIGHT + insets.top,
						paddingTop: insets.top,
						backgroundColor: colors.card,
						borderBottomColor: colors.border,
						borderBottomWidth: 1,
						// Remove transform to keep header fixed
					},
				]}
			>
				<HomeHeader onLogoPress={scrollToTop} />
			</Animated.View>

			{/* Main Content - now with infinite scroll support */}
			<FeedContent
				feedItems={feedItems}
				loading={loading}
				loadingMore={loadingMore}
				hasMoreData={hasMoreData}
				error={error}
				refreshing={refreshing}
				onRefresh={handleRefresh}
				onLoadMore={handleLoadMore}
				onUserProfilePress={handleUserProfilePress}
				onPlayVoiceNote={handlePlayVoiceNote}
				flatListRef={flatListRef}
				onScroll={handleScroll}
				diagnosticData={diagnosticData}
				contentInsetTop={HEADER_HEIGHT + insets.top} // Add this prop to adjust content padding
			/>

			{/* Floating Action Button */}
			<FloatingActionButton
				onPress={handleNewVoiceNote}
				icon="mic"
				color={colors.card}
				backgroundColor={colors.tint}
				insets={insets}
				visible={showFAB}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10, // Increase z-index to ensure header stays on top
		borderBottomWidth: 1,
	},
	backgroundBlocker: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: -1, // Place behind content but above any unwanted background elements
	},
});
