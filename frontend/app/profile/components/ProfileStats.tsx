import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

interface ProfileStatsProps {
	followingCount: number;
	voiceNotesCount: number;
	followerCount: number;
	onFollowingPress: () => void;
	onFollowersPress: () => void;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
	followingCount,
	voiceNotesCount,
	followerCount,
	onFollowingPress,
	onFollowersPress,
}) => {
	const { colors } = useTheme();

	return (
		<View
			style={[styles.statsContainer, { backgroundColor: colors.background }]}
		>
			<TouchableOpacity style={styles.statsItem} onPress={onFollowingPress}>
				<Text style={[styles.statsNumber, { color: colors.text }]}>
					{followingCount}
				</Text>
				<Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
					Following
				</Text>
			</TouchableOpacity>
			<View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
			<TouchableOpacity style={styles.statsItem}>
				<Text style={[styles.statsNumber, { color: colors.text }]}>
					{voiceNotesCount}
				</Text>
				<Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
					{voiceNotesCount === 1 ? "Note" : "Notes"}
				</Text>
			</TouchableOpacity>
			<View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
			<TouchableOpacity style={styles.statsItem} onPress={onFollowersPress}>
				<Text style={[styles.statsNumber, { color: colors.text }]}>
					{followerCount}
				</Text>
				<Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
					{followerCount === 1 ? "Follower" : "Followers"}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingVertical: 16,
	},
	statsItem: {
		alignItems: "center",
		width: "30%",
	},
	statsNumber: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	statsLabel: {
		fontSize: 14,
	},
	statsDivider: {
		width: 1,
		height: 30,
	},
});

export default ProfileStats;
