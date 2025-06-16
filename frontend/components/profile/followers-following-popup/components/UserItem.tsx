import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { FollowButton } from "../../FollowButton";
import { UserAvatar } from "./UserAvatar";
import { UserItemProps } from "../types";

export const UserItem: React.FC<UserItemProps> = ({
	user,
	currentUserId,
	onProfilePress,
	onFollowChange,
	isLast = false,
}) => {
	const { colors } = useTheme();

	const handleProfilePress = () => {
		if (user.username) {
			onProfilePress(user.username);
		}
	};

	return (
		<View
			style={[
				styles.userItem,
				{ borderBottomColor: colors.border },
				isLast && { borderBottomWidth: 0 },
			]}
		>
			<TouchableOpacity
				style={styles.userInfoLeft}
				onPress={handleProfilePress}
				activeOpacity={0.7}
			>
				<UserAvatar user={user} />
				<View style={styles.userInfoText}>
					<View style={styles.nameContainer}>
						<Text
							style={[styles.displayName, { color: colors.text }]}
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{user.display_name || user.username}
						</Text>
						{user.is_verified && (
							<MaterialIcons
								name="verified"
								size={16}
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
						@{user.username}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Only show follow button if it's not the current user */}
			{currentUserId && user.id !== currentUserId && (
				<FollowButton
					userId={user.id}
					onFollowChange={(isFollowing, updatedCount) =>
						onFollowChange(user.id, isFollowing, updatedCount)
					}
					style={styles.followButton}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	userItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		borderBottomWidth: 1,
		flexWrap: "nowrap",
	},
	userInfoLeft: {
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 1,
		marginRight: 8,
	},
	userInfoText: {
		marginLeft: 12,
		flexShrink: 1,
		minWidth: 0,
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "nowrap",
	},
	displayName: {
		fontSize: 16,
		fontWeight: "bold",
		flexShrink: 1,
	},
	verifiedIcon: {
		marginLeft: 4,
		flexShrink: 0,
	},
	username: {
		fontSize: 14,
		marginTop: 2,
	},
	followButton: {
		height: 36,
		paddingHorizontal: 12,
		flexShrink: 0,
	},
});
