import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	Modal,
	ActivityIndicator,
	SafeAreaView,
	Dimensions,
	Platform,
	TouchableWithoutFeedback,
	Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DefaultAvatar from "../DefaultAvatar";
import {
	getUserFollowers,
	getUserFollowing,
} from "../../services/api/userService";
import { FollowButton } from "./FollowButton";
import { useUser } from "../../context/UserContext";

// Development mode flag
const isDev = process.env.NODE_ENV === "development" || __DEV__;

interface UserType {
	id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	is_verified?: boolean;
}

// For API response
interface FollowRelation {
	follower_id?: string;
	following_id?: string;
	users?: UserType;
	[key: string]: any; // For other potential fields
}

interface FollowersFollowingPopupProps {
	visible: boolean;
	userId: string;
	onClose: () => void;
	initialTab: "followers" | "following";
}

export function FollowersFollowingPopup({
	visible,
	userId,
	onClose,
	initialTab,
}: FollowersFollowingPopupProps) {
	const [users, setUsers] = useState<UserType[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const { user: currentUser } = useUser();
	const screenHeight = Dimensions.get("window").height;

	// Determine if we're showing followers or following
	const isFollowersTab = initialTab === "followers";

	useEffect(() => {
		if (visible) {
			console.log(`Loading ${initialTab} for user: ${userId}`);
			fetchUsers();
		}
	}, [visible, userId]);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			let userData: UserType[] = [];

			if (isFollowersTab) {
				const followers = await getUserFollowers(userId);
				console.log("Raw followers data:", JSON.stringify(followers));

				// Process and normalize the data
				userData = followers.map((item: FollowRelation) => {
					console.log("Processing follower item:", JSON.stringify(item));

					// Check if user data is in the 'users' field (from the API)
					if (item.users) {
						return {
							id: item.follower_id || item.users.id || "",
							username: item.users.username || "",
							display_name: item.users.display_name || "",
							avatar_url: item.users.avatar_url || null,
							is_verified: item.users.is_verified || false,
						};
					}

					// If the API returns users directly
					return {
						id: item.id || item.follower_id || "",
						username: item.username || "",
						display_name: item.display_name || "",
						avatar_url: item.avatar_url || null,
						is_verified: item.is_verified || false,
					};
				});
			} else {
				const following = await getUserFollowing(userId);
				console.log("Raw following data:", JSON.stringify(following));

				// Process and normalize the data
				userData = following.map((item: FollowRelation) => {
					console.log("Processing following item:", JSON.stringify(item));

					// Check if user data is in the 'users' field (from the API)
					if (item.users) {
						return {
							id: item.following_id || item.users.id || "",
							username: item.users.username || "",
							display_name: item.users.display_name || "",
							avatar_url: item.users.avatar_url || null,
							is_verified: item.users.is_verified || false,
						};
					}

					// If the API returns users directly
					return {
						id: item.id || item.following_id || "",
						username: item.username || "",
						display_name: item.display_name || "",
						avatar_url: item.avatar_url || null,
						is_verified: item.is_verified || false,
					};
				});
			}

			// Filter out any empty/invalid entries
			const validUsers = userData.filter((user) => user.id && user.username);
			console.log(`Found ${validUsers.length} valid ${initialTab} entries`);
			setUsers(validUsers);
		} catch (error) {
			console.error(`Error fetching ${initialTab}:`, error);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	};

	const handleFollowChange = (
		userId: string,
		isFollowing: boolean,
		updatedCount?: number
	) => {
		console.log(`User ${userId} follow status changed to ${isFollowing}`);
		// Refresh the list to reflect changes
		fetchUsers();
	};

	const handleProfilePress = (username: string) => {
		// Navigate to the user profile
		router.push({
			pathname: "/profile/[username]",
			params: { username },
		});
		onClose();
	};

	// Custom avatar component to handle both custom avatars and defaults
	const UserAvatar = ({ user }: { user: UserType }) => {
		const [imageError, setImageError] = useState(false);

		if (user.avatar_url && !imageError) {
			return (
				<Image
					source={{ uri: user.avatar_url }}
					style={{ width: 40, height: 40, borderRadius: 20 }}
					onError={() => setImageError(true)}
				/>
			);
		}
		return <DefaultAvatar userId={user.id} size={40} />;
	};

	const renderUserItem = ({ item }: { item: UserType }) => (
		<View style={styles.userItem}>
			<TouchableOpacity
				style={styles.userInfo}
				onPress={() => handleProfilePress(item.username)}
			>
				<View style={styles.userInfoLeft}>
					<UserAvatar user={item} />
					<View style={styles.userInfoText}>
						<View style={styles.nameContainer}>
							<Text style={styles.displayName}>
								{item.display_name || item.username}
							</Text>
							{item.is_verified && (
								<Feather
									name="check-circle"
									size={14}
									color="#6B2FBC"
									style={styles.verifiedIcon}
								/>
							)}
						</View>
						<Text style={styles.username}>@{item.username}</Text>
					</View>
				</View>
			</TouchableOpacity>

			{currentUser && currentUser.id !== item.id && (
				<FollowButton
					userId={item.id}
					onFollowChange={(isFollowing, updatedCount) =>
						handleFollowChange(item.id, isFollowing, updatedCount)
					}
					style={styles.followButton}
				/>
			)}
		</View>
	);

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="fade"
			onRequestClose={onClose}
		>
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.modalOverlay}>
					<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
						<View
							style={[styles.modalContainer, { maxHeight: screenHeight * 0.7 }]}
						>
							<SafeAreaView style={styles.container}>
								<View style={styles.header}>
									<View style={styles.placeholder} />
									<Text style={styles.title}>
										{isFollowersTab ? "Followers" : "Following"}
									</Text>
									<TouchableOpacity
										style={styles.closeButton}
										onPress={onClose}
									>
										<Feather name="x" size={22} color="#333" />
									</TouchableOpacity>
								</View>

								{loading ? (
									<View style={styles.loadingContainer}>
										<ActivityIndicator size="large" color="#6B2FBC" />
									</View>
								) : users.length === 0 ? (
									<View style={styles.emptyContainer}>
										<Text style={styles.emptyText}>
											No {isFollowersTab ? "followers" : "following"} yet
										</Text>
									</View>
								) : (
									<FlatList
										data={users}
										renderItem={renderUserItem}
										keyExtractor={(item) => item.id}
										contentContainerStyle={styles.listContent}
									/>
								)}
							</SafeAreaView>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		width: "70%",
		backgroundColor: "white",
		borderRadius: 12,
		overflow: "hidden",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	container: {
		flex: 1,
		backgroundColor: "white",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#EEEEEE",
	},
	closeButton: {
		padding: 4,
		width: 30,
		height: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	placeholder: {
		width: 30,
		height: 30,
	},
	loadingContainer: {
		paddingVertical: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 16,
	},
	emptyText: {
		fontSize: 16,
		color: "#888",
		textAlign: "center",
	},
	listContent: {
		padding: 16,
	},
	userItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#EEEEEE",
	},
	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	userInfoLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	userInfoText: {
		marginLeft: 12,
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	displayName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
	},
	verifiedIcon: {
		marginLeft: 4,
	},
	username: {
		fontSize: 14,
		color: "#888",
		marginTop: 2,
	},
	followButton: {
		height: 36,
		paddingHorizontal: 12,
	},
});
