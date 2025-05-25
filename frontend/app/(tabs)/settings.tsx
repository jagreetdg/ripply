import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Switch,
	Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../constants/Colors";

// Token storage keys
const TOKEN_KEY = "@ripply_auth_token";
const USER_KEY = "@ripply_user";

interface SettingsItemProps {
	icon: keyof typeof Feather.glyphMap;
	title: string;
	description?: string;
	onPress?: () => void;
	rightContent?: React.ReactNode;
	isDestructive?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
	icon,
	title,
	description,
	onPress,
	rightContent,
	isDestructive,
}) => {
	const { colors } = useTheme();
	return (
		<TouchableOpacity
			style={[styles.settingItem, { backgroundColor: colors.background }]}
			onPress={onPress}
			disabled={!onPress && !rightContent}
		>
			<View
				style={[
					styles.settingIconContainer,
					{
						backgroundColor: isDestructive ? "transparent" : colors.tint + "20",
					},
				]}
			>
				<Feather
					name={icon}
					size={20}
					color={isDestructive ? colors.error : colors.tint}
				/>
			</View>
			<View style={styles.settingContent}>
				<Text
					style={[
						styles.settingTitle,
						{ color: isDestructive ? colors.error : colors.text },
					]}
				>
					{title}
				</Text>
				{description && (
					<Text
						style={[
							styles.settingDescription,
							{ color: colors.tabIconDefault },
						]}
					>
						{description}
					</Text>
				)}
			</View>
			{rightContent ||
				(onPress && (
					<Feather
						name="chevron-right"
						size={22}
						color={colors.tabIconDefault}
					/>
				))}
		</TouchableOpacity>
	);
};

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { setUser, logout } = useUser();
	const { theme, setTheme, isDarkMode, colors } = useTheme();

	const handleLogout = async () => {
		try {
			// Call the proper logout service which handles both backend and frontend cleanup
			await logout();
			router.replace("/");
		} catch (error) {
			console.error("Error logging out:", error);
			alert("Failed to logout. Please try again.");
		}
	};

	const handleProfilePress = () => {
		router.push({ pathname: "/profile/edit" });
	};

	const themeOptions = [
		{ label: "System", value: "system" },
		{ label: "Light", value: "light" },
		{ label: "Dark", value: "dark" },
	];

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, backgroundColor: colors.background },
			]}
		>
			<View
				style={[
					styles.header,
					{
						backgroundColor: colors.background,
						borderBottomColor: colors.tabIconDefault + "50",
					},
				]}
			>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					Settings
				</Text>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
			>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Account
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<SettingsItem
						icon="user"
						title="Profile"
						description="View and edit your profile"
						onPress={handleProfilePress}
					/>
					<SettingsItem
						icon="bell"
						title="Notification Preferences"
						description="Manage notification settings"
						onPress={() => {
							/* Navigate to Notifications screen */
						}}
					/>
					<SettingsItem
						icon="shield"
						title="Privacy"
						description="Manage privacy settings"
						onPress={() => {
							/* Navigate to Privacy screen */
						}}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Appearance
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<View
						style={[styles.settingItem, { backgroundColor: colors.background }]}
					>
						<View
							style={[
								styles.settingIconContainer,
								{ backgroundColor: colors.tint + "20" },
							]}
						>
							<Feather
								name={isDarkMode ? "moon" : "sun"}
								size={20}
								color={colors.tint}
							/>
						</View>
						<View style={styles.settingContent}>
							<Text style={[styles.settingTitle, { color: colors.text }]}>
								Theme
							</Text>
						</View>
						<View style={styles.themeToggleContainer}>
							{themeOptions.map((option) => (
								<TouchableOpacity
									key={option.value}
									style={[
										styles.themeOptionButton,
										{
											backgroundColor:
												theme === option.value
													? colors.tint
													: colors.background,
											borderColor: colors.tint,
										},
									]}
									onPress={() =>
										setTheme(option.value as "light" | "dark" | "system")
									}
								>
									<Text
										style={[
											styles.themeOptionText,
											{
												color:
													theme === option.value
														? option.value === "light"
															? Colors.light.card
															: isDarkMode
															? colors.background
															: colors.text
														: colors.tint,
											},
										]}
									>
										{option.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Support & About
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<SettingsItem
						icon="help-circle"
						title="Help & Support"
						description="Get help with Ripply"
						onPress={() => {
							/* Navigate to Help & Support screen */
						}}
					/>
					<SettingsItem
						icon="info"
						title="About"
						description="App version and information"
						onPress={() => {
							/* Navigate to About screen */
						}}
					/>
				</View>

				<View
					style={[
						styles.sectionContainer,
						{
							marginTop: 20,
							backgroundColor: colors.card,
							borderColor: colors.border,
						},
					]}
				>
					<SettingsItem
						icon="log-out"
						title="Logout"
						onPress={handleLogout}
						isDestructive
					/>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 20,
		paddingVertical: 15,
		borderBottomWidth: 1,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContent: {
		paddingVertical: 20,
		paddingHorizontal: 16,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginLeft: 4,
		marginBottom: 10,
		marginTop: 20,
		textTransform: "uppercase",
		opacity: 0.7,
	},
	sectionContainer: {
		borderRadius: 12,
		overflow: "hidden",
		marginBottom: 10,
		borderWidth: Platform.OS === "ios" ? 0.5 : 1,
	},
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
	settingIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	settingContent: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: "500",
	},
	settingDescription: {
		fontSize: 13,
		marginTop: 2,
	},
	themeToggleContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	themeOptionButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 16,
		borderWidth: 1.5,
		marginLeft: 8,
	},
	themeOptionText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
