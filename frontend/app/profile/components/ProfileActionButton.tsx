import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../context/ThemeContext";
import { FollowButton } from "../../../components/profile/FollowButton";

interface ProfileActionButtonProps {
	isOwnProfile: boolean;
	userId: string;
	onFollowChange: (isFollowing: boolean, updatedCount?: number) => void;
}

export const ProfileActionButton: React.FC<ProfileActionButtonProps> = ({
	isOwnProfile,
	userId,
	onFollowChange,
}) => {
	const { colors } = useTheme();
	const router = useRouter();

	return (
		<View
			style={[
				styles.followButtonContainer,
				{ backgroundColor: colors.background },
			]}
		>
			{isOwnProfile ? (
				<TouchableOpacity
					style={[
						styles.editProfileButtonInline,
						{ backgroundColor: "#7B3DD2" },
					]}
					onPress={() => router.push("/profile/edit")}
				>
					<Text style={[styles.buttonText, { color: colors.white }]}>
						Edit Profile
					</Text>
				</TouchableOpacity>
			) : (
				<FollowButton userId={userId} onFollowChange={onFollowChange} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	followButtonContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: "center",
	},
	editProfileButtonInline: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		minWidth: 100,
	},
	buttonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "600",
	},
});
