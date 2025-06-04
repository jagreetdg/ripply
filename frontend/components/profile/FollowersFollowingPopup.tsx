import React, { useState, useEffect, useCallback, useRef } from "react";
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
	useWindowDimensions,
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
import { useTheme } from "../../context/ThemeContext";
import Colors, { hexToRgba, opacityValues } from "../../constants/Colors";

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
	const { colors, isDarkMode } = useTheme();
	const screenHeight = Dimensions.get("window").height;
	const { width: windowWidth } = useWindowDimensions();
	const [mounted, setMounted] = useState(false);
	const isClosingRef = useRef(false);
	const hasRenderedOnceRef = useRef(false);
	const preventAutoCloseRef = useRef(false);
	const [renderKey, setRenderKey] = useState(0);

	// Determine responsiveness based on window width
	const isNarrowScreen = windowWidth < 500;
	const isVeryNarrowScreen = windowWidth < 350;

	// Log mount/unmount for debugging
	useEffect(() => {
		console.log("FollowersFollowingPopup MOUNTED");
		setMounted(true);

		// Set a flag to prevent any auto-closing mechanisms
		preventAutoCloseRef.current = true;

		// After a short delay, allow closing
		const timer = setTimeout(() => {
			preventAutoCloseRef.current = false;
			console.log("FollowersFollowingPopup ready for user interaction");
		}, 1000);

		return () => {
			console.log("FollowersFollowingPopup UNMOUNTED");
			clearTimeout(timer);
			setMounted(false);
		};
	}, []);

	// Force a re-render after initial mount to ensure proper rendering
	useEffect(() => {
		if (mounted && !hasRenderedOnceRef.current) {
			hasRenderedOnceRef.current = true;
			// Force a re-render on next frame
			const timer = setTimeout(() => {
				setRenderKey((prev) => prev + 1);
				console.log("FollowersFollowingPopup forced re-render for stability");
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [mounted]);

	// Determine if we're showing followers or following
	const isFollowersTab = initialTab === "followers";

	// Memoize the fetchUsers function to prevent recreations on each render
	const fetchUsers = useCallback(async () => {
		if (!userId || !mounted) {
			console.log("No userId provided or component unmounted, skipping fetch");
			setLoading(false);
			setUsers([]);
			return;
		}

		setLoading(true);
		try {
			let userData: UserType[] = [];
			console.log(
				`Fetching ${
					isFollowersTab ? "followers" : "following"
				} users for user: ${userId}`
			);

			if (isFollowersTab) {
				const followers = await getUserFollowers(userId);
				console.log(`Found ${followers?.length || 0} followers entries`);

				// Process and normalize the data - handle null or undefined responses
				if (mounted && Array.isArray(followers) && followers.length > 0) {
					userData = followers
						.map((item: FollowRelation) => {
							if (!item) return null;

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
						})
						.filter(Boolean) as UserType[]; // Filter out null entries
				}
			} else {
				const following = await getUserFollowing(userId);
				console.log(`Found ${following?.length || 0} following entries`);

				// Process and normalize the data - handle null or undefined responses
				if (mounted && Array.isArray(following) && following.length > 0) {
					userData = following
						.map((item: FollowRelation) => {
							if (!item) return null;

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
						})
						.filter(Boolean) as UserType[]; // Filter out null entries
				}
			}

			// Filter out any empty/invalid entries
			const validUsers = userData.filter(
				(user) => user && user.id && user.username
			);
			console.log(`Found ${validUsers.length} valid ${initialTab} entries`);

			if (mounted) {
				setUsers(validUsers);
			}
		} catch (error) {
			console.error(`Error fetching ${initialTab}:`, error);
			if (mounted) {
				setUsers([]);
			}
		} finally {
			if (mounted) {
				setLoading(false);
			}
		}
	}, [userId, isFollowersTab, mounted]);

	// Only trigger fetch when modal becomes visible
	useEffect(() => {
		if (visible && userId && mounted) {
			console.log(`Loading ${initialTab} for user: ${userId}`);
			fetchUsers();
		}

		// Reset state when modal is closed to prevent stale data
		if (!visible && mounted) {
			setUsers([]);
		}
	}, [visible, userId, fetchUsers, mounted]);

	const handleSafeClose = useCallback(() => {
		// Prevent auto-closing during the protection period
		if (preventAutoCloseRef.current) {
			console.log(
				"FollowersFollowingPopup ignoring close request (protection period)"
			);
			return;
		}

		if (isClosingRef.current || !mounted) return;

		console.log("Safely closing followers/following popup");
		isClosingRef.current = true;

		// Small delay before actually closing to prevent race conditions
		setTimeout(() => {
			if (mounted) {
				onClose();

				// Reset the closing flag after a short delay
				setTimeout(() => {
					if (mounted) {
						isClosingRef.current = false;
					}
				}, 100);
			}
		}, 50);
	}, [onClose, mounted]);

	const handleFollowChange = (
		userId: string,
		isFollowing: boolean,
		updatedCount?: number
	) => {
		if (!mounted) return;
		console.log(`User ${userId} follow status changed to ${isFollowing}`);
		// Refresh the list to reflect changes
		fetchUsers();
	};

	const handleProfilePress = (username: string) => {
		if (!mounted) return;
		// Navigate to the user profile
		if (username) {
			router.push({
				pathname: "/profile/[username]",
				params: { username },
			});
			handleSafeClose();
		}
	};

	// Custom avatar component to handle both custom avatars and defaults
	const UserAvatar = ({ user }: { user: UserType }) => {
		const [imageError, setImageError] = useState(false);

		if (!user) return <DefaultAvatar userId="" size={40} />;

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

	const renderUserItem = ({ item }: { item: UserType }) => {
		if (!item || !item.id) return null;

		// Check if this is the current user (for follow button display)
		const isCurrentUser = currentUser && item.id === currentUser.id;

		return (
			<View style={[styles.userItem, { borderBottomColor: colors.border }]}>
				<TouchableOpacity
					style={[
						styles.userInfo,
						// Adjust flex based on screen size
						isVeryNarrowScreen && !isCurrentUser ? { flex: 0.7 } : { flex: 1 },
					]}
					onPress={() => handleProfilePress(item.username)}
				>
					<View style={styles.userInfoLeft}>
						<UserAvatar user={item} />
						<View style={styles.userInfoText}>
							<View style={styles.nameContainer}>
								{/* Name truncation for very narrow screens */}
								<Text
									style={[styles.displayName, { color: colors.text }]}
									numberOfLines={1}
									ellipsizeMode="tail"
								>
									{item.display_name || item.username}
								</Text>
								{item.is_verified && (
									<Feather
										name="check-circle"
										size={14}
										color={colors.tint}
										style={styles.verifiedIcon}
									/>
								)}
							</View>
							<Text
								style={[styles.username, { color: colors.textSecondary }]}
								numberOfLines={1}
								ellipsizeMode="tail"
							>
								@{item.username}
							</Text>
						</View>
					</View>
				</TouchableOpacity>

				{currentUser && item.id && !isCurrentUser && (
					<FollowButton
						userId={item.id}
						onFollowChange={(isFollowing, updatedCount) =>
							handleFollowChange(item.id, isFollowing, updatedCount)
						}
						style={[
							styles.followButton,
							// Adjust styles for narrow screens
							isNarrowScreen && { paddingHorizontal: 8, minWidth: 70 },
							isVeryNarrowScreen && { minWidth: 60 },
						]}
					/>
				)}
			</View>
		);
	};

	// If not visible or not mounted, don't render anything to prevent DOM manipulation issues
	if (!visible || !mounted) {
		console.log(
			"FollowersFollowingPopup not rendering - visible:",
			visible,
			"mounted:",
			mounted
		);
		return null;
	}

	console.log("FollowersFollowingPopup RENDERING", {
		visible,
		mounted,
		renderKey,
		initialTab,
		userCount: users.length,
		loading,
	});

	// Get adaptive modal width based on screen size
	const getModalWidth = () => {
		if (windowWidth < 400) return "95%";
		if (windowWidth < 768) return "80%";
		if (windowWidth < 1024) return "60%";
		return "50%";
	};

	// Simplified modal implementation to avoid the ModalPortal errors
	// Using absolute positioning instead of fixed to avoid removal by security mechanisms
	return (
		<View
			key={`followers-modal-${renderKey}`}
			style={[
				styles.modalOverlayAbsolute,
				{
					backgroundColor: isDarkMode
						? colors.modalOverlay
						: hexToRgba(colors.black, opacityValues.semitransparent),
				},
			]}
			// Use onStartShouldSetResponder for React Native instead of onClick
			onStartShouldSetResponder={() => {
				console.log("FollowersFollowingPopup background press intercepted");
				return true; // Capture the touch event
			}}
		>
			<View
				style={[
					styles.modalContainer,
					{
						maxHeight: screenHeight * 0.7,
						backgroundColor: colors.background,
						width: getModalWidth(),
					},
				]}
			>
				<SafeAreaView
					style={[styles.container, { backgroundColor: colors.background }]}
				>
					<View style={[styles.header, { borderBottomColor: colors.border }]}>
						<View style={styles.placeholder} />
						<Text style={[styles.title, { color: colors.text }]}>
							{isFollowersTab ? "Followers" : "Following"}
						</Text>
						<TouchableOpacity
							style={styles.closeButton}
							onPress={handleSafeClose}
						>
							<Feather name="x" size={22} color={colors.text} />
						</TouchableOpacity>
					</View>

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={colors.tint} />
						</View>
					) : users.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
								No {isFollowersTab ? "followers" : "following"} yet
							</Text>
						</View>
					) : (
						<FlatList
							data={users}
							renderItem={renderUserItem}
							keyExtractor={(item) => item?.id || Math.random().toString()}
							contentContainerStyle={styles.listContent}
						/>
					)}
				</SafeAreaView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	modalOverlayFixed: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 9999,
	},
	modalOverlayAbsolute: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 9999,
	},
	modalContainer: {
		borderRadius: 12,
		overflow: "hidden",
		elevation: 5,
		shadowColor: Colors.light.shadow,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		maxWidth: 600, // Maximum width for larger screens
	},
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
		borderBottomWidth: 1,
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
		flexWrap: "nowrap", // Prevent wrapping
	},
	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 8, // Add margin to separate from the follow button
	},
	userInfoLeft: {
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 1, // Allow shrinking when needed
	},
	userInfoText: {
		marginLeft: 12,
		flexShrink: 1, // Allow text to shrink if needed
		minWidth: 0, // Required for text truncation to work properly
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "nowrap", // Keep name and verification icon on same line
	},
	displayName: {
		fontSize: 16,
		fontWeight: "bold",
		flexShrink: 1, // Allow text to shrink
	},
	verifiedIcon: {
		marginLeft: 4,
		flexShrink: 0, // Don't shrink the icon
	},
	username: {
		fontSize: 14,
		marginTop: 2,
	},
	followButton: {
		height: 36,
		paddingHorizontal: 12,
		flexShrink: 0, // Don't shrink the button
	},
});
