import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import DefaultAvatar from "../../components/DefaultAvatar";
import { useTheme } from "../../context/ThemeContext";

interface HomeHeaderProps {
	onLogoPress?: () => void;
}

export function HomeHeader({ onLogoPress }: HomeHeaderProps) {
	const router = useRouter();
	const { user, loading } = useUser();
	const { colors, isDarkMode } = useTheme();

	const handleProfilePress = () => {
		if (user) {
			router.push("/profile");
		} else {
			router.push("/auth/login");
		}
	};

	const handleNotificationsPress = () => {
		router.push("/(tabs)/notifications");
	};

	return (
		<View style={[styles.outerContainer, { backgroundColor: colors.card }]}>
			<View style={[styles.container, { backgroundColor: colors.card }]}>
				{/* Left section - Profile button */}
				<View style={styles.sideSection}>
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
				</View>

				{/* Center section - Logo and text */}
				<View style={styles.centerSection}>
					<TouchableOpacity
						style={styles.logoContainer}
						onPress={onLogoPress}
						activeOpacity={0.7}
					>
						<View style={styles.logoWithTextContainer}>
							<Image
								source={require("../../assets/images/logo.png")}
								style={styles.logo}
								resizeMode="contain"
							/>
							<Text style={[styles.logoText, { color: colors.tint }]}>
								Ripply
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				{/* Right section - Notification button */}
				<View style={styles.sideSection}>
					<TouchableOpacity
						style={styles.notificationButton}
						onPress={handleNotificationsPress}
					>
						<Feather name="bell" size={22} color={colors.text} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Simple bottom separator */}
			<View style={styles.separatorContainer}>
				<View
					style={[
						styles.separatorLine,
						{ backgroundColor: colors.tint, opacity: 0.2 },
					]}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outerContainer: {
		width: "100%",
	},
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		height: "100%",
	},
	sideSection: {
		width: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	centerSection: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
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
		justifyContent: "center",
		transform: [{ translateX: -16 }], // Shift slightly to the left to compensate for visual balance
	},
	logoWithTextContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	logo: {
		width: 24,
		height: 24,
		marginRight: 6,
	},
	logoText: {
		fontSize: 20,
		fontWeight: "bold",
	},
	notificationButton: {
		padding: 4,
	},
});
