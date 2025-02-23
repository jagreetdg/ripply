import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

interface ProfileHeaderProps {
	userId: string;
}

export function ProfileHeader({ userId }: ProfileHeaderProps) {
	const router = useRouter();

	return (
		<View style={styles.container}>
			<View style={styles.topBar}>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.backButton}>←</Text>
				</TouchableOpacity>
				<TouchableOpacity>
					<Text style={styles.menuButton}>☰</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.profileInfo}>
				<View style={styles.avatar}>
					<Image
						source={{ uri: "https://via.placeholder.com/100" }}
						style={styles.avatarImage}
					/>
				</View>
				<Text style={styles.username}>{userId}</Text>
				<Text style={styles.bio}>
					My Bio is a very big blob text with all the unnecessary details of my
					life
				</Text>
			</View>

			<View style={styles.stats}>
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>2.7m</Text>
					<Text style={styles.statLabel}>Followers</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>1.9k</Text>
					<Text style={styles.statLabel}>Following</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: "#FFFFFF",
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	backButton: {
		fontSize: 24,
	},
	menuButton: {
		fontSize: 24,
	},
	profileInfo: {
		alignItems: "center",
		marginBottom: 20,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#E1E1E1",
		marginBottom: 12,
		overflow: "hidden",
	},
	avatarImage: {
		width: "100%",
		height: "100%",
	},
	username: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 8,
	},
	bio: {
		textAlign: "center",
		color: "#666666",
		marginBottom: 16,
	},
	stats: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	statItem: {
		alignItems: "center",
		paddingHorizontal: 30,
	},
	statNumber: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	statLabel: {
		color: "#666666",
	},
	statDivider: {
		width: 1,
		height: 30,
		backgroundColor: "#E1E1E1",
	},
});
