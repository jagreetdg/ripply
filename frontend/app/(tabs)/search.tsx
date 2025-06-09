import React, { useState, useEffect, useRef } from "react";
import {
	StyleSheet,
	View,
	SafeAreaView,
	RefreshControl,
	Animated,
	ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

// Import components
import { SearchBar } from "../../components/search/SearchBar";
import { SearchTabs } from "../../components/search/SearchTabs";
import { SearchResultsList } from "../../components/search/SearchResultsList";

// Import hooks
import { useSearch, SearchTab } from "../../hooks/useSearch";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

// Constants
const PREVIEW_COUNT = 5;

export default function SearchScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const params = useLocalSearchParams();
	const { user: currentUser } = useUser();
	const { colors, isDarkMode } = useTheme();

	// Get initial search tag from params if available
	const initialTag = params?.tag as string;
	const initialSearchType = params?.searchType as string;
	const timestamp = params?.timestamp as string;

	// State to control show all/less for results
	const [showAllUsers, setShowAllUsers] = useState(false);
	const [showAllPosts, setShowAllPosts] = useState(false);
	const [lastParams, setLastParams] = useState({
		tag: initialTag,
		searchType: initialSearchType,
		timestamp,
	});

	// Animations
	const fadeAnim = useRef(new Animated.Value(1)).current;
	const slideAnim = useRef(new Animated.Value(0)).current;
	const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

	// Initialize search hook
	const {
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isLoading,
		isRefreshing,
		userResults,
		postResults,
		discoveryPosts,
		trendingUsers,
		sharedStatusMap,
		handleSearchChange,
		handleTabChange,
		handleClearSearch,
		handleRefresh,
		performSearch,
		loadDiscoveryContent,
	} = useSearch({
		initialSearchQuery: initialTag ? `#${initialTag}` : "",
		initialTab: initialSearchType === "tag" ? "posts" : "users",
		userId: currentUser?.id || "",
	});

	// Handle tab change with animation
	const handleTabChangeWithAnimation = (tab: SearchTab) => {
		// Don't do anything if it's already the active tab
		if (tab === activeTab) return;

		// Start fade out animation
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 150,
			useNativeDriver: true,
		}).start(() => {
			// Reset show all states
			setShowAllUsers(false);
			setShowAllPosts(false);

			// Change tab
			handleTabChange(tab);

			// Animate the tab indicator
			Animated.spring(tabIndicatorPosition, {
				toValue: tab === "posts" ? 0 : 1,
				useNativeDriver: true,
				speed: 12,
				bounciness: 4,
			}).start();

			// Start fade in animation
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}).start();
		});
	};

	// Toggle show all users
	const toggleShowAllUsers = () => {
		setShowAllUsers(!showAllUsers);
	};

	// Toggle show all posts
	const toggleShowAllPosts = () => {
		setShowAllPosts(!showAllPosts);
	};

	// Effect to handle initial tag search from params
	useEffect(() => {
		console.log("Search params changed:", {
			initialTag,
			initialSearchType,
			timestamp,
		});

		if (initialTag) {
			// Update the search query in the input field
			setSearchQuery(`#${initialTag}`);

			// Set active tab based on search type
			if (initialSearchType === "tag") {
				setActiveTab("posts");
				// Move tab indicator
				Animated.spring(tabIndicatorPosition, {
					toValue: 0,
					useNativeDriver: true,
					speed: 12,
					bounciness: 4,
				}).start();
			}

			// Perform the search
			performSearch("posts", `#${initialTag}`);
		} else {
			// Load discovery content on initial load - only if not loaded
			loadDiscoveryContent(activeTab, false);
		}
	}, [initialTag, initialSearchType, timestamp]);

	// Use useFocusEffect to detect when the screen is focused
	useFocusEffect(
		React.useCallback(() => {
			// Animation when screen is focused
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();

			// Get current params
			const currentTag = params?.tag as string;
			const currentSearchType = params?.searchType as string;
			const currentTimestamp = params?.timestamp as string;

			console.log("Screen focused with params:", {
				currentTag,
				currentSearchType,
				currentTimestamp,
				lastParams,
			});

			// Check if params have changed since last focus
			const paramsChanged =
				currentTag !== lastParams.tag ||
				currentSearchType !== lastParams.searchType ||
				currentTimestamp !== lastParams.timestamp;

			if (currentTag && paramsChanged) {
				console.log("Params changed, updating search");
				// Update search query and perform search
				setSearchQuery(`#${currentTag}`);
				if (currentSearchType === "tag") {
					setActiveTab("posts");
					// Move tab indicator
					Animated.spring(tabIndicatorPosition, {
						toValue: 0,
						useNativeDriver: true,
						speed: 12,
						bounciness: 4,
					}).start();
				}
				performSearch("posts", `#${currentTag}`);

				// Update last params
				setLastParams({
					tag: currentTag,
					searchType: currentSearchType,
					timestamp: currentTimestamp,
				});
			} else if (!currentTag && searchQuery.trim() === "") {
				// Load discovery content if no search params and no query - only if not loaded
				loadDiscoveryContent(activeTab, false);
			}

			// Cleanup function
			return () => {
				console.log("Search screen losing focus");
				// Animation when screen loses focus
				Animated.parallel([
					Animated.timing(fadeAnim, {
						toValue: 0,
						duration: 200,
						useNativeDriver: true,
					}),
					Animated.timing(slideAnim, {
						toValue: 10,
						duration: 200,
						useNativeDriver: true,
					}),
				]).start();
			};
		}, [params])
	);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<View style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
				<SearchBar
					value={searchQuery}
					onChangeText={handleSearchChange}
					onClear={handleClearSearch}
					placeholder="Search users, hashtags, or posts"
				/>
			</View>

			<SearchTabs
				activeTab={activeTab}
				onTabChange={handleTabChangeWithAnimation}
				tabIndicatorPosition={tabIndicatorPosition}
				colors={colors}
			/>

			<Animated.View
				style={[
					styles.contentContainer,
					{
						opacity: fadeAnim,
						transform: [{ translateY: slideAnim }],
					},
				]}
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							colors={[colors.tint]}
							tintColor={colors.tint}
						/>
					}
				>
					{activeTab === "posts" && (
						<SearchResultsList
							type="posts"
							data={
								searchQuery.trim().length > 0 ? postResults : discoveryPosts
							}
							isLoading={isLoading}
							searchQuery={searchQuery}
							currentUserId={currentUser?.id}
							showAll={showAllPosts}
							toggleShowAll={toggleShowAllPosts}
							sharedStatusMap={sharedStatusMap}
							previewCount={PREVIEW_COUNT}
							colors={colors}
						/>
					)}

					{activeTab === "users" && (
						<SearchResultsList
							type="users"
							data={searchQuery.trim().length > 0 ? userResults : trendingUsers}
							isLoading={isLoading}
							searchQuery={searchQuery}
							currentUserId={currentUser?.id}
							showAll={showAllUsers}
							toggleShowAll={toggleShowAllUsers}
							sharedStatusMap={sharedStatusMap}
							previewCount={PREVIEW_COUNT}
							colors={colors}
						/>
					)}
				</ScrollView>
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		paddingHorizontal: 16,
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 20,
	},
});
