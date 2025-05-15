import React, { useState, useEffect } from "react";
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
import { useSearchParams, useRouter } from "expo-router";

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
	const params = useSearchParams();

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

	// Effect to handle initial tag search from params
	useEffect(() => {
		if (initialTag) {
			handleSearch(initialSearchType === "tag" ? "posts" : "users");
		}
	}, [initialTag, initialSearchType]);

	// Effect to handle tab change
	useEffect(() => {
		if (searchQuery.trim() !== "") {
			handleSearch(activeTab);
		}
	}, [activeTab]);

	const handleSearch = async (tab: SearchTab = activeTab) => {
		if (searchQuery.trim() === "") return;

		setIsLoading(true);

		try {
			if (tab === "users") {
				const users = await searchUsers(searchQuery);
				setUserResults(users);
			} else {
				const posts = await searchVoiceNotes(searchQuery);
				setPostResults(posts);
			}
		} catch (error) {
			console.error("Search error:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		handleSearch();
	};

	const handleClearSearch = () => {
		setSearchQuery("");
		setUserResults([]);
		setPostResults([]);
	};

	const renderUserItem = ({ item }) => {
		return <UserSearchResult user={item} />;
	};

	const renderPostItem = ({ item }) => {
		return (
			<VoiceNoteCard
				voiceNote={item}
				userId={item.user_id || item.users?.id}
				displayName={item.users?.display_name}
				username={item.users?.username}
				userAvatarUrl={item.users?.avatar_url}
			/>
		);
	};

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

		return (
			<View style={styles.emptyStateContainer}>
				<Text style={styles.emptyStateText}>
					No results found for "{searchQuery}"
				</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
			<SearchBar
				value={searchQuery}
				onChangeText={setSearchQuery}
				onSubmit={() => handleSearch()}
				onClear={handleClearSearch}
				placeholder="Search users or posts..."
			/>

			<View style={styles.tabsContainer}>
				<TouchableOpacity
					style={[styles.tab, activeTab === "users" && styles.activeTab]}
					onPress={() => setActiveTab("users")}
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
					onPress={() => setActiveTab("posts")}
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
				<FlatList
					data={userResults}
					renderItem={renderUserItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={renderEmptyState}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							colors={["#6B2FBC"]}
							tintColor="#6B2FBC"
						/>
					}
				/>
			) : (
				<FlatList
					data={postResults}
					renderItem={renderPostItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={renderEmptyState}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							colors={["#6B2FBC"]}
							tintColor="#6B2FBC"
						/>
					}
				/>
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
});
