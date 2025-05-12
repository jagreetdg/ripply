import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import DefaultAvatar from "../../components/DefaultAvatar";

export function HomeHeader() {
	const router = useRouter();
	const { user, loading } = useUser();

	const handleProfilePress = () => {
		if (user && user.username) {
			router.push(`/profile/${user.username}`);
		} else {
			router.push("/auth/login");
		}
	};

	const handleNotificationsPress = () => {
		router.push("/notifications");
	};

	return (
		<View style={styles.outerContainer}>
			<View style={styles.container}>
				<TouchableOpacity
					onPress={handleProfilePress}
					style={styles.profileButton}
				>
					{user && user.avatar_url ? (
						<Image
							source={{ uri: user.avatar_url }}
							style={styles.profilePicture}
							resizeMode="cover"
						/>
					) : (
						<DefaultAvatar
							userId={user?.id || "guest"}
							size={32}
							onPress={handleProfilePress}
						/>
					)}
				</TouchableOpacity>

				<View style={styles.logoContainer}>
					<Text style={styles.logoText}>Ripply</Text>
				</View>

				<TouchableOpacity
					style={styles.notificationButton}
					onPress={handleNotificationsPress}
				>
					<Feather name="bell" size={22} color="#333" />
				</TouchableOpacity>
			</View>

			{/* Simple bottom separator */}
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outerContainer: {
		width: "100%",
		backgroundColor: "#FFFFFF",
	},
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		height: "100%",
		backgroundColor: "#FFFFFF",
	},
	separatorContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 4,
	},
	separatorLine: {
		flex: 1,
		height: 1.5,
		backgroundColor: "#6B2FBC",
		opacity: 0.2,
		marginBottom: 4,
	},
	profileButton: {
		padding: 4,
	},
	profilePicture: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
	},
	profileInitial: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 16,
	},
	logoContainer: {
		alignItems: "center",
	},
	logoText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#6B2FBC",
	},
	notificationButton: {
		padding: 4,
	},
});
