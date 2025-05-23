import React, { useState, useEffect, useCallback, useRef } from "react";
import {
	StyleSheet,
	View,
	Text,
	SafeAreaView,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Animated,
	Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { debounce } from "lodash";
import { Feather } from "@expo/vector-icons";

// Import components
import { SearchBar } from "../../components/search/SearchBar";
import { UserSearchResult } from "../../components/search/UserSearchResult";
import { VoiceNoteCard } from "../../components/voice-note-card/VoiceNoteCard";

// Import services
import {
	searchUsers,
	searchVoiceNotes,
	getDiscoveryPosts,
	getTrendingUsers,
} from "../../services/api/searchService";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

// Tab type definition
type SearchTab = "users" | "posts";

export default function SearchScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const params = useLocalSearchParams();
	const { user: currentUser } = useUser(); // Get current user from context
	const { colors, isDarkMode } = useTheme();

	// Get initial search tag from params if available
	const initialTag = params?.tag as string;
	const initialSearchType = params?.searchType as string;
	const timestamp = params?.timestamp as string;

	// State
	const [searchQuery, setSearchQuery] = useState(
		initialTag ? `#${initialTag}` : ""
	);
	const [activeTab, setActiveTab] = useState<SearchTab>(
		initialSearchType === "tag" ? "posts" : "posts"
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [userResults, setUserResults] = useState<any[]>([]);
	const [postResults, setPostResults] = useState<any[]>([]);
	const [discoveryPosts, setDiscoveryPosts] = useState<any[]>([]);
	const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
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
	const windowWidth = Dimensions.get("window").width;

	// Number of results to display in preview mode
	const PREVIEW_COUNT = 5;

	// Handle tab change with animation
	const handleTabChange = (tab: SearchTab) => {
		// Don't do anything if it's already the active tab
		if (tab === activeTab) return;

		// Start fade out animation
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 150,
			useNativeDriver: true,
		}).start(() => {
			// Change tab after fade out
			setActiveTab(tab);
			setShowAllUsers(false);
			setShowAllPosts(false);

			// Animate the tab indicator - Updated for new tab order
			Animated.spring(tabIndicatorPosition, {
				toValue: tab === "posts" ? 0 : 1,
				useNativeDriver: true,
				speed: 12,
				bounciness: 4,
			}).start();

			// If search query exists, perform search
			if (searchQuery.trim().length > 0) {
				performSearch(tab, searchQuery);
			} else {
				// Load discovery content when no search query
				loadDiscoveryContent(tab);
			}

			// Start fade in animation
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}).start();
		});
	};

	// Load discovery content for empty search state
	const loadDiscoveryContent = async (tab: SearchTab) => {
		if (!currentUser?.id) return;

		setIsLoading(true);
		try {
			if (tab === "posts") {
				// Load discovery posts (for you feed)
				const posts = await getDiscoveryPosts(currentUser.id);
				setDiscoveryPosts(posts || []);
			} else if (tab === "users") {
				// Load trending users
				const users = await getTrendingUsers(currentUser.id);
				setTrendingUsers(users || []);
			}
		} catch (error) {
			console.error("Error loading discovery content:", error);
			// Set empty arrays on error
			if (tab === "posts") {
				setDiscoveryPosts([]);
			} else {
				setTrendingUsers([]);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Handle search
	const performSearch = async (tab: SearchTab, query: string) => {
		if (query.trim() === "") {
			setUserResults([]);
			setPostResults([]);
			// Load discovery content when search is cleared
			loadDiscoveryContent(tab);
			return;
		}

		setIsLoading(true);

		try {
			if (tab === "users") {
				const users = await searchUsers(query, currentUser?.id || "");
				setUserResults(users);
			}

			if (tab === "posts") {
				const posts = await searchVoiceNotes(query);
				setPostResults(posts);
			}
		} catch (error) {
			console.error("Search error:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	// Debounced search function to avoid too many API calls
	const debouncedSearch = useCallback(
		debounce((tab, query) => {
			performSearch(tab, query);
		}, 300),
		[]
	);

	// Handle search query change
	const handleSearchChange = (text: string) => {
		setSearchQuery(text);

		// Reset the show all flags when search query changes
		setShowAllUsers(false);
		setShowAllPosts(false);

		// Only search if there's at least 1 character
		if (text.trim().length >= 1) {
			debouncedSearch(activeTab, text);
		} else {
			// Clear results and load discovery content if search is empty
			setUserResults([]);
			setPostResults([]);
			loadDiscoveryContent(activeTab);
		}
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
				// Move tab indicator - Updated for new tab order
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
			// Load discovery content on initial load
			loadDiscoveryContent(activeTab);
		}
	}, [initialTag, initialSearchType, timestamp]);

	// Use useFocusEffect to detect when the screen is focused
	useFocusEffect(
		useCallback(() => {
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
					// Move tab indicator - Updated for new tab order
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
				// Load discovery content if no search params and no query
				loadDiscoveryContent(activeTab);
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

	// Toggle show all users
	const toggleShowAllUsers = () => {
		setShowAllUsers(!showAllUsers);
	};

	// Toggle show all posts
	const toggleShowAllPosts = () => {
		setShowAllPosts(!showAllPosts);
	};

	// Handle refresh
	const handleRefresh = () => {
		setIsRefreshing(true);
		if (searchQuery.trim().length > 0) {
			performSearch(activeTab, searchQuery);
		} else {
			loadDiscoveryContent(activeTab);
			setIsRefreshing(false);
		}
	};

	// Handle clear search
	const handleClearSearch = () => {
		setSearchQuery("");
		setUserResults([]);
		setPostResults([]);
	};

	// Get filtered lists based on show all setting
	const getFilteredUsers = () => {
		const users = searchQuery.trim().length > 0 ? userResults : trendingUsers;
		return showAllUsers ? users : users.slice(0, PREVIEW_COUNT);
	};

	const getFilteredPosts = () => {
		const posts = searchQuery.trim().length > 0 ? postResults : discoveryPosts;
		return showAllPosts ? posts : posts.slice(0, PREVIEW_COUNT);
	};

	// Render user item
	const renderUserItem = ({ item }: { item: any }) => {
		return <UserSearchResult user={item} />;
	};

	// Render post item
	const renderPostItem = ({ item }: { item: any }) => {
		// Extract user data with fallbacks
		const userData = item.users || {};

		// Create a voiceNote object with stable data
		const voiceNoteData = {
			...item,
			// Ensure stats are proper numbers
			likes: typeof item.likes === "number" ? item.likes : 0,
			comments: typeof item.comments === "number" ? item.comments : 0,
			plays: typeof item.plays === "number" ? item.plays : 0,
			shares: typeof item.shares === "number" ? item.shares : 0,
			// Ensure user data is properly structured
			user_id: item.user_id || userData.id,
			users: userData,
		};

		return (
			<View style={styles.postItemContainer}>
				<VoiceNoteCard
					voiceNote={voiceNoteData}
					userId={voiceNoteData.user_id}
					displayName={userData.display_name}
					username={userData.username}
					userAvatarUrl={userData.avatar_url}
				/>
			</View>
		);
	};

	// Render show more button
	const renderShowMoreButton = (type: "users" | "posts") => {
		const resultsCount =
			type === "users" ? userResults.length : postResults.length;
		const showAll = type === "users" ? showAllUsers : showAllPosts;
		const toggleShowAll =
			type === "users" ? toggleShowAllUsers : toggleShowAllPosts;

		if (resultsCount <= PREVIEW_COUNT) return null;

		return (
			<TouchableOpacity
				style={styles.showMoreButton}
				onPress={toggleShowAll}
				activeOpacity={0.7}
			>
				<Text style={styles.showMoreText}>
					{showAll ? "Show less" : `Show all ${resultsCount} results`}
				</Text>
				<Feather
					name={showAll ? "chevron-up" : "chevron-down"}
					size={18}
					color={colors.tint}
					style={styles.showMoreIcon}
				/>
			</TouchableOpacity>
		);
	};

	// Render empty state
	const renderEmptyState = () => {
		if (isLoading) {
			return (
				<View style={styles.emptyStateContainer}>
					<ActivityIndicator size="large" color={colors.tint} />
				</View>
			);
		}

		if (searchQuery.trim() === "") {
			return (
				<View style={styles.emptyStateContainer}>
					<Feather
						name="compass"
						size={40}
						color={colors.textSecondary}
						style={{ marginBottom: 16 }}
					/>
					<Text style={[styles.emptyStateTitle, { color: colors.text }]}>
						{activeTab === "posts"
							? "Discover Voice Notes"
							: "Discover Creators"}
					</Text>
					<Text
						style={[styles.emptyStateText, { color: colors.textSecondary }]}
					>
						{activeTab === "posts"
							? "Explore voice notes tailored to your interests"
							: "Find trending creators in your favorite topics"}
					</Text>
				</View>
			);
		}

		const hasUsers = userResults.length > 0;
		const hasPosts = postResults.length > 0;

		if (
			(activeTab === "users" && !hasUsers) ||
			(activeTab === "posts" && !hasPosts)
		) {
			return (
				<View style={styles.emptyStateContainer}>
					<Feather
						name="alert-circle"
						size={40}
						color={colors.textSecondary}
						style={{ marginBottom: 16 }}
					/>
					<Text style={[styles.emptyStateTitle, { color: colors.text }]}>
						No results found
					</Text>
					<Text
						style={[styles.emptyStateText, { color: colors.textSecondary }]}
					>
						No {activeTab} found for "{searchQuery}"
					</Text>
				</View>
			);
		}

		return null;
	};

	// Tab indicator animated position - Updated for new tab order
	const tabIndicatorTranslateX = tabIndicatorPosition.interpolate({
		inputRange: [0, 1],
		outputRange: [0, windowWidth / 2],
	});

	return (
		<SafeAreaView
			style={[
				styles.container,
				{ paddingTop: insets.top, backgroundColor: colors.background },
			]}
		>
			{/* Background blocker to prevent unwanted elements from showing through */}
			<View
				style={[
					styles.backgroundBlocker,
					{ backgroundColor: colors.background },
				]}
			/>

			<SearchBar
				value={searchQuery}
				onChangeText={handleSearchChange}
				onSubmit={() => performSearch(activeTab, searchQuery)}
				onClear={handleClearSearch}
				placeholder="Search or discover..."
			/>

			<View
				style={[
					styles.tabsContainer,
					{
						backgroundColor: colors.card,
						shadowColor: isDarkMode ? colors.shadow : "#000",
					},
				]}
			>
				{/* Posts Tab - Now on the left */}
				<TouchableOpacity
					style={styles.tab}
					onPress={() => handleTabChange("posts")}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.tabText,
							activeTab === "posts" && [
								styles.activeTabText,
								{ color: colors.tint },
							],
							{
								color:
									activeTab !== "posts" ? colors.textSecondary : colors.tint,
							},
						]}
					>
						Posts
					</Text>
				</TouchableOpacity>

				{/* Users Tab - Now on the right */}
				<TouchableOpacity
					style={styles.tab}
					onPress={() => handleTabChange("users")}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.tabText,
							activeTab === "users" && [
								styles.activeTabText,
								{ color: colors.tint },
							],
							{
								color:
									activeTab !== "users" ? colors.textSecondary : colors.tint,
							},
						]}
					>
						Users
					</Text>
				</TouchableOpacity>

				{/* Animated tab indicator */}
				<Animated.View
					style={[
						styles.tabIndicator,
						{
							transform: [{ translateX: tabIndicatorTranslateX }],
							width: windowWidth / 2,
							backgroundColor: colors.tint,
						},
					]}
				/>
			</View>

			<Animated.View
				style={[
					styles.contentContainer,
					{
						opacity: fadeAnim,
						transform: [{ translateY: slideAnim }],
						backgroundColor: colors.background,
					},
				]}
			>
				{activeTab === "posts" ? (
					<FlatList
						data={getFilteredPosts()}
						renderItem={renderPostItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContent}
						ListEmptyComponent={renderEmptyState}
						ListFooterComponent={() => renderShowMoreButton("posts")}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								colors={[colors.tint]}
								tintColor={colors.tint}
							/>
						}
					/>
				) : (
					<FlatList
						data={getFilteredUsers()}
						renderItem={renderUserItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContent}
						ListEmptyComponent={renderEmptyState}
						ListFooterComponent={() => renderShowMoreButton("users")}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								colors={[colors.tint]}
								tintColor={colors.tint}
							/>
						}
					/>
				)}
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	backgroundBlocker: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: -1,
	},
	contentContainer: {
		flex: 1,
	},
	tabsContainer: {
		flexDirection: "row",
		height: 48,
		position: "relative",
		elevation: 2,
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	tab: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	tabText: {
		fontSize: 16,
		fontWeight: "500",
	},
	activeTabText: {
		fontWeight: "600",
	},
	tabIndicator: {
		position: "absolute",
		bottom: 0,
		height: 3,
		borderTopLeftRadius: 3,
		borderTopRightRadius: 3,
	},
	listContent: {
		flexGrow: 1,
		paddingTop: 8,
		paddingBottom: 20,
	},
	postItemContainer: {
		marginVertical: 8,
		marginHorizontal: 12,
	},
	emptyStateContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		minHeight: 300,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 8,
	},
	emptyStateText: {
		fontSize: 14,
		textAlign: "center",
		lineHeight: 20,
	},
	showMoreButton: {
		padding: 16,
		marginTop: 8,
		marginHorizontal: 12,
		alignItems: "center",
		borderRadius: 12,
		flexDirection: "row",
		justifyContent: "center",
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	showMoreText: {
		fontSize: 14,
		fontWeight: "600",
	},
	showMoreIcon: {
		marginLeft: 4,
	},
});
