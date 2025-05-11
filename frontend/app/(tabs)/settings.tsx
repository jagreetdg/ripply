import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Token storage keys
const TOKEN_KEY = "@ripply_auth_token";
const USER_KEY = "@ripply_user";

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { setUser } = useUser();

	const handleProfilePress = () => {
		router.push("/profile/jamiejones");
	};

	const handleLogout = async () => {
		try {
			// Clear stored data
			await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

			// Clear user context
			setUser(null);

			// Navigate to landing page
			router.replace("/");
		} catch (error) {
			console.error("Error logging out:", error);
			alert("Failed to logout. Please try again.");
		}
	};

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Settings</Text>
			</View>

			<ScrollView style={styles.scrollView}>
				<TouchableOpacity
					style={styles.settingItem}
					onPress={handleProfilePress}
				>
					<View style={styles.settingIconContainer}>
						<Feather name="user" size={22} color="#6B2FBC" />
					</View>
					<View style={styles.settingContent}>
						<Text style={styles.settingTitle}>Profile</Text>
						<Text style={styles.settingDescription}>
							View and edit your profile
						</Text>
					</View>
					<Feather name="chevron-right" size={22} color="#666666" />
				</TouchableOpacity>

				<TouchableOpacity style={styles.settingItem}>
					<View style={styles.settingIconContainer}>
						<Feather name="bell" size={22} color="#6B2FBC" />
					</View>
					<View style={styles.settingContent}>
						<Text style={styles.settingTitle}>Notification Preferences</Text>
						<Text style={styles.settingDescription}>
							Manage notification settings
						</Text>
					</View>
					<Feather name="chevron-right" size={22} color="#666666" />
				</TouchableOpacity>

				<TouchableOpacity style={styles.settingItem}>
					<View style={styles.settingIconContainer}>
						<Feather name="shield" size={22} color="#6B2FBC" />
					</View>
					<View style={styles.settingContent}>
						<Text style={styles.settingTitle}>Privacy</Text>
						<Text style={styles.settingDescription}>
							Manage privacy settings
						</Text>
					</View>
					<Feather name="chevron-right" size={22} color="#666666" />
				</TouchableOpacity>

				<TouchableOpacity style={styles.settingItem}>
					<View style={styles.settingIconContainer}>
						<Feather name="help-circle" size={22} color="#6B2FBC" />
					</View>
					<View style={styles.settingContent}>
						<Text style={styles.settingTitle}>Help & Support</Text>
						<Text style={styles.settingDescription}>Get help with Ripply</Text>
					</View>
					<Feather name="chevron-right" size={22} color="#666666" />
				</TouchableOpacity>

				<TouchableOpacity style={styles.settingItem}>
					<View style={styles.settingIconContainer}>
						<Feather name="info" size={22} color="#6B2FBC" />
					</View>
					<View style={styles.settingContent}>
						<Text style={styles.settingTitle}>About</Text>
						<Text style={styles.settingDescription}>
							App version and information
						</Text>
					</View>
					<Feather name="chevron-right" size={22} color="#666666" />
				</TouchableOpacity>

				{/* Logout Button */}
				<TouchableOpacity
					style={[styles.settingItem, styles.logoutButton]}
					onPress={handleLogout}
				>
					<View
						style={[styles.settingIconContainer, styles.logoutIconContainer]}
					>
						<Feather name="log-out" size={22} color="#FF3B30" />
					</View>
					<View style={styles.settingContent}>
						<Text style={[styles.settingTitle, styles.logoutText]}>Logout</Text>
						<Text style={[styles.settingDescription, styles.logoutDescription]}>
							Sign out of your account
						</Text>
					</View>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	header: {
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#E1E1E1",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#6B2FBC",
	},
	scrollView: {
		flex: 1,
	},
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 16,
		paddingVertical: 14,
		marginBottom: 1,
		borderBottomWidth: 1,
		borderBottomColor: "#F0F0F0",
	},
	settingIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#F0F0F0",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	settingContent: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333333",
		marginBottom: 2,
	},
	settingDescription: {
		fontSize: 14,
		color: "#666666",
	},
	logoutButton: {
		marginTop: 20,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
	},
	logoutIconContainer: {
		backgroundColor: "#FFE5E5",
	},
	logoutText: {
		color: "#FF3B30",
	},
	logoutDescription: {
		color: "#FF3B30",
		opacity: 0.8,
	},
});
