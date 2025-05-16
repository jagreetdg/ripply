import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DefaultAvatar from "../DefaultAvatar";
import { FollowButton } from "../profile/FollowButton";
import { useUser } from "../../context/UserContext";

interface UserType {
	id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	is_verified?: boolean;
}

interface UserSearchResultProps {
	user: UserType;
	onPress?: () => void;
}

export const UserSearchResult = ({ user, onPress }: UserSearchResultProps) => {
	const router = useRouter();
	const { user: currentUser } = useUser();
	const [imageError, setImageError] = useState(false);
	const [scaleAnim] = useState(new Animated.Value(1));

	const handlePress = () => {
		// Animate press effect
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.98,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();

		// Navigate after animation
		setTimeout(() => {
			if (onPress) {
				onPress();
			} else {
				router.push({
					pathname: "/profile/[username]",
					params: { username: user.username },
				});
			}
		}, 150);
	};

	const handleFollowChange = (isFollowing: boolean) => {
		// This could be enhanced to update the UI if needed
		console.log(`User ${user.id} follow status changed to ${isFollowing}`);
	};

	return (
		<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
			<TouchableOpacity
				style={styles.container}
				onPress={handlePress}
				activeOpacity={0.9}
			>
				<View style={styles.userInfo}>
					{user.avatar_url && !imageError ? (
						<Image
							source={{ uri: user.avatar_url }}
							style={styles.avatar}
							onError={() => setImageError(true)}
						/>
					) : (
						<DefaultAvatar userId={user.id} size={48} />
					)}

					<View style={styles.textContainer}>
						<View style={styles.nameContainer}>
							<Text
								style={styles.displayName}
								numberOfLines={1}
								ellipsizeMode="tail"
							>
								{user.display_name || user.username}
							</Text>
							{user.is_verified && (
								<Feather
									name="check-circle"
									size={14}
									color="#6B2FBC"
									style={styles.verifiedIcon}
								/>
							)}
						</View>
						<Text
							style={styles.username}
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							@{user.username}
						</Text>
					</View>
				</View>

				{currentUser && currentUser.id !== user.id && (
					<FollowButton
						userId={user.id}
						onFollowChange={(isFollowing) => handleFollowChange(isFollowing)}
						style={styles.followButton}
					/>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#EEEEEE",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		marginHorizontal: 12,
		marginVertical: 6,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#f0f0f0",
		borderWidth: 2,
		borderColor: "#f5f5f5",
	},
	textContainer: {
		marginLeft: 12,
		flex: 1,
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	displayName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		maxWidth: "90%",
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
		borderRadius: 18,
	},
});
