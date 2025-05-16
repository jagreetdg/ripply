import React, { useState, useEffect, useCallback } from "react";
import {
	StyleSheet,
	View,
	Text,
	SafeAreaView,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { debounce } from "lodash";

// Import components
import { SearchBar } from "../../components/search/SearchBar";
import { UserSearchResult } from "../../components/search/UserSearchResult";
import { VoiceNoteCard } from "../../components/profile/VoiceNoteCard";

// Import services
import {
	searchUsers,
	searchVoiceNotes,
} from "../../services/api/searchService";

// Tab type definition
type SearchTab = "users" | "posts";

export default function SearchScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const params = useLocalSearchParams();

	// Get initial search tag from params if available
	const initialTag = params?.tag as string;
	const initialSearchType = params?.searchType as string;

	// State
	const [searchQuery, setSearchQuery] = useState(
		initialTag ? `#${initialTag}` : ""
	);
	const [activeTab, setActiveTab] = useState<SearchTab>(
		initialSearchType === "tag" ? "posts" : "users"
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [userResults, setUserResults] = useState([]);
	const [postResults, setPostResults] = useState([]);
	const [showAllUsers, setShowAllUsers] = useState(false);
	const [showAllPosts, setShowAllPosts] = useState(false);

	// Number of results to display in preview mode
	const PREVIEW_COUNT = 5;

	// Handle search
	const performSearch = async (tab: SearchTab, query: string) => {
		if (query.trim() === "") {
			setUserResults([]);
			setPostResults([]);
			return;
		}

		setIsLoading(true);

		try {
			if (tab === "users" || tab === "all") {
				const users = await searchUsers(query);
				setUserResults(users);
			}

			if (tab === "posts" || tab === "all") {
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
			// Clear results if search is empty
			setUserResults([]);
			setPostResults([]);
		}
	};

	// Handle tab change
	const handleTabChange = (tab: SearchTab) => {
		setActiveTab(tab);
		setShowAllUsers(false);
		setShowAllPosts(false);

		if (searchQuery.trim().length > 0) {
			performSearch(tab, searchQuery);
		}
	};

	// Effect to handle initial tag search from params
	useEffect(() => {
		console.log("Search params changed:", { initialTag, initialSearchType });

		if (initialTag) {
			// Update the search query in the input field
			setSearchQuery(`#${initialTag}`);

			// Set active tab based on search type
			if (initialSearchType === "tag") {
				setActiveTab("posts");
			}

			// Perform the search
			performSearch(
				initialSearchType === "tag" ? "posts" : "all",
				`#${initialTag}`
			);
		}
	}, [initialTag, initialSearchType, params]);

	// Additional effect to detect navigation back to this screen
	useEffect(() => {
		// This is necessary to handle screen focus/refocus
		const unsubscribe = router.addListener("focus", () => {
			const currentParams = router
				.getState()
				.routes.find((r) => r.name === "/(tabs)/search")?.params;
			const tag = currentParams?.tag;
			const searchType = currentParams?.searchType;

			console.log("Screen focused with params:", { tag, searchType });

			if (tag && tag !== initialTag) {
				// If we have new tag parameters, update search
				setSearchQuery(`#${tag}`);
				if (searchType === "tag") {
					setActiveTab("posts");
				}
				performSearch(searchType === "tag" ? "posts" : "all", `#${tag}`);
			}
		});

		return unsubscribe;
	}, [router]);

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
		performSearch(activeTab, searchQuery);
	};

	// Handle clear search
	const handleClearSearch = () => {
		setSearchQuery("");
		setUserResults([]);
		setPostResults([]);
	};

	// Get filtered lists based on show all setting
	const getFilteredUsers = () => {
		return showAllUsers ? userResults : userResults.slice(0, PREVIEW_COUNT);
	};

	const getFilteredPosts = () => {
		return showAllPosts ? postResults : postResults.slice(0, PREVIEW_COUNT);
	};

	// Render user item
	const renderUserItem = ({ item }) => {
		return <UserSearchResult user={item} />;
	};

	// Render post item
	const renderPostItem = ({ item }) => {
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
					key={`${item.id}-${searchQuery}`} // Force re-render on search query change
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
			<TouchableOpacity style={styles.showMoreButton} onPress={toggleShowAll}>
				<Text style={styles.showMoreText}>
					{showAll ? "Show less" : `Show all ${resultsCount} results`}
				</Text>
			</TouchableOpacity>
		);
	};

	// Render empty state
	const renderEmptyState = () => {
		if (isLoading) {
			return (
				<View style={styles.emptyStateContainer}>
					<ActivityIndicator size="large" color="#6B2FBC" />
				</View>
			);
		}

		if (searchQuery.trim() === "") {
			return (
				<View style={styles.emptyStateContainer}>
					<Text style={styles.emptyStateText}>Search for users or posts</Text>
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
					<Text style={styles.emptyStateText}>
						No {activeTab} found for "{searchQuery}"
					</Text>
				</View>
			);
		}

		return null;
	};

	return (
		<SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
			<SearchBar
				value={searchQuery}
				onChangeText={handleSearchChange}
				onSubmit={() => performSearch(activeTab, searchQuery)}
				onClear={handleClearSearch}
				placeholder="Search users or posts..."
			/>

			<View style={styles.tabsContainer}>
				<TouchableOpacity
					style={[styles.tab, activeTab === "users" && styles.activeTab]}
					onPress={() => handleTabChange("users")}
				>
					<Text
						style={[
							styles.tabText,
							activeTab === "users" && styles.activeTabText,
						]}
					>
						Users
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.tab, activeTab === "posts" && styles.activeTab]}
					onPress={() => handleTabChange("posts")}
				>
					<Text
						style={[
							styles.tabText,
							activeTab === "posts" && styles.activeTabText,
						]}
					>
						Posts
					</Text>
				</TouchableOpacity>
			</View>

			{activeTab === "users" ? (
				<>
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
								colors={["#6B2FBC"]}
								tintColor="#6B2FBC"
							/>
						}
					/>
				</>
			) : (
				<>
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
								colors={["#6B2FBC"]}
								tintColor="#6B2FBC"
							/>
						}
					/>
				</>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	tabsContainer: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#EEEEEE",
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
	},
	activeTab: {
		borderBottomWidth: 2,
		borderBottomColor: "#6B2FBC",
	},
	tabText: {
		fontSize: 16,
		color: "#888888",
	},
	activeTabText: {
		color: "#6B2FBC",
		fontWeight: "600",
	},
	listContent: {
		flexGrow: 1,
		paddingBottom: 20,
	},
	postItemContainer: {
		marginVertical: 8,
		marginHorizontal: 12,
		borderRadius: 16,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
	},
	emptyStateContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		minHeight: 300,
	},
	emptyStateText: {
		fontSize: 16,
		color: "#888888",
		textAlign: "center",
	},
	showMoreButton: {
		padding: 16,
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#EEEEEE",
	},
	showMoreText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B2FBC",
	},
});
