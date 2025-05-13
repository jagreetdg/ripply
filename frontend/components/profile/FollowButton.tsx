import React, { useState, useEffect, useCallback } from "react";
import {
	TouchableOpacity,
	Text,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { useUser } from "../../context/UserContext";
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
}: FollowButtonProps) {
	const { user } = useUser();
	const [following, setFollowing] = useState(false);
	const [loading, setLoading] = useState(true);

	// Check if the current user is following the profile user
	const checkFollowStatus = useCallback(async () => {
		if (!user || user.id === userId) {
			setLoading(false);
			return;
		}

		try {
			console.log(`Checking if user ${user.id} is following ${userId}`);
			const isUserFollowing = await isFollowing(user.id, userId);
			console.log(`Follow status check result: ${isUserFollowing}`);
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
				await unfollowUser(userId, user.id);
				newFollowStatus = false;
			} else {
				await followUser(userId, user.id);
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

			// Double-check the follow status after a short delay
			// This ensures the UI matches the server state
			setTimeout(() => {
				checkFollowStatus();
			}, 1000);
		} catch (error) {
			console.error("Error toggling follow status:", error);
			// Revert to the previous state in case of error
			setFollowing((prev) => !prev);

			// Check actual status from server
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
				following ? styles.followingButton : styles.followButton,
				style,
			]}
			onPress={handlePress}
			disabled={loading}
		>
			{loading ? (
				<ActivityIndicator
					size="small"
					color={following ? "#6B2FBC" : "#FFFFFF"}
				/>
			) : (
				<Text
					style={[
						styles.buttonText,
						following ? styles.followingText : styles.followText,
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
		backgroundColor: "#6B2FBC",
	},
	followingButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#6B2FBC",
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "600",
	},
	followText: {
		color: "#FFFFFF",
	},
	followingText: {
		color: "#6B2FBC",
	},
});
