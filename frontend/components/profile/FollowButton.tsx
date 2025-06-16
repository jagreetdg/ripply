import React, { useState, useEffect, useCallback } from "react";
import {
	TouchableOpacity,
	Text,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";
import {
	followUser,
	unfollowUser,
	isFollowing,
	getFollowerCount,
} from "../../services/api/userService";

interface FollowButtonProps {
	userId: string;
	onFollowChange?: (isFollowing: boolean, updatedCount: number) => void;
	style?: any;
}

/**
 * Follow/Unfollow button component
 */
export function FollowButton({
	userId,
	onFollowChange,
	style,
}: FollowButtonProps): JSX.Element | null {
	const { user } = useUser();
	const { colors, isDarkMode } = useTheme();
	const [following, setFollowing] = useState(false);
	const [loading, setLoading] = useState(true);

	// Get the primary button color from the brand colors
	const buttonColor = Colors.brand.primary;

	// Check if the current user is following the profile user
	const checkFollowStatus = useCallback(async () => {
		if (!user || user.id === userId) {
			setLoading(false);
			return;
		}

		try {
			// Only log once per minute to prevent console spam
			const now = Date.now();
			const lastLogKey = `follow-check-${userId}`;
			const lastLogTime = Number(sessionStorage.getItem(lastLogKey) || 0);

			if (now - lastLogTime > 60000) {
				// 1 minute
				console.log(`Checking if user ${user.id} is following ${userId}`);
				sessionStorage.setItem(lastLogKey, now.toString());
			}

			const isUserFollowing = await isFollowing(userId, user.id);
			setFollowing(isUserFollowing);
		} catch (error) {
			console.error("Error checking follow status:", error);
		} finally {
			setLoading(false);
		}
	}, [user, userId]);

	useEffect(() => {
		checkFollowStatus();
	}, [checkFollowStatus]);

	// Handle follow/unfollow action
	const handlePress = async () => {
		if (!user) return;

		setLoading(true);
		try {
			let newFollowStatus: boolean;

			if (following) {
				await unfollowUser(userId);
				newFollowStatus = false;
			} else {
				await followUser(userId);
				newFollowStatus = true;
			}

			setFollowing(newFollowStatus);

			// Get the updated follower count from the server
			if (onFollowChange) {
				// Instead of just incrementing/decrementing locally,
				// get the accurate count from the server
				const updatedCount = await getFollowerCount(userId);
				console.log(`Updated follower count from server: ${updatedCount}`);

				// Pass true/false for whether the user is now following,
				// and include the updated count as a second parameter
				onFollowChange(newFollowStatus, updatedCount);
			}

			// Note: Removed aggressive re-checking since we update state optimistically
		} catch (error) {
			console.error("Error toggling follow status:", error);
			// Revert to the previous state in case of error
			setFollowing((prev) => !prev);

			// Only check actual status from server if there was an error
			checkFollowStatus();
		} finally {
			setLoading(false);
		}
	};

	// Don't show the button if viewing own profile or not logged in
	if (!user || user.id === userId) {
		return null;
	}

	return (
		<TouchableOpacity
			style={[
				styles.button,
				following
					? [styles.followingButton, { borderColor: buttonColor }]
					: [styles.followButton, { backgroundColor: buttonColor }],
				style,
			]}
			onPress={handlePress}
			disabled={loading}
		>
			{loading ? (
				<ActivityIndicator
					size="small"
					color={following ? buttonColor : colors.card}
				/>
			) : (
				<Text
					style={[
						styles.buttonText,
						following
							? [styles.followingText, { color: buttonColor }]
							: [styles.followText, { color: colors.white }],
					]}
				>
					{following ? "Following" : "Follow"}
				</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	button: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		minWidth: 100,
	},
	followButton: {
		// backgroundColor set dynamically
	},
	followingButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		// borderColor set dynamically
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "600",
	},
	followText: {
		// color set dynamically
	},
	followingText: {
		// color set dynamically
	},
});
