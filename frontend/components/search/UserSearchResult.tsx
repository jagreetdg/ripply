import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
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

	const handlePress = () => {
		if (onPress) {
			onPress();
		} else {
			router.push({
				pathname: "/profile/[username]",
				params: { username: user.username },
			});
		}
	};

	const handleFollowChange = (isFollowing: boolean) => {
		// This could be enhanced to update the UI if needed
		console.log(`User ${user.id} follow status changed to ${isFollowing}`);
	};

	return (
		<TouchableOpacity style={styles.container} onPress={handlePress}>
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
						<Text style={styles.displayName}>
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
					<Text style={styles.username}>@{user.username}</Text>
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
	},
	textContainer: {
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
