import React, { useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { CustomToggle } from "../../components/common";

interface PrivacySettingProps {
	icon: keyof typeof Feather.glyphMap;
	title: string;
	description: string;
	value?: boolean;
	onValueChange?: (value: boolean) => void;
	onPress?: () => void;
	rightContent?: React.ReactNode;
}

const PrivacySetting: React.FC<PrivacySettingProps> = ({
	icon,
	title,
	description,
	value,
	onValueChange,
	onPress,
	rightContent,
}) => {
	const { colors } = useTheme();

	return (
		<TouchableOpacity
			style={[styles.settingItem, { backgroundColor: colors.background }]}
			onPress={onPress}
			disabled={!onPress}
		>
			<View
				style={[
					styles.settingIconContainer,
					{ backgroundColor: colors.tint + "20" },
				]}
			>
				<Feather name={icon} size={20} color={colors.tint} />
			</View>
			<View style={styles.settingContent}>
				<Text style={[styles.settingTitle, { color: colors.text }]}>
					{title}
				</Text>
				<Text
					style={[styles.settingDescription, { color: colors.tabIconDefault }]}
				>
					{description}
				</Text>
			</View>
			{rightContent ||
				(value !== undefined && onValueChange ? (
					<CustomToggle value={value} onValueChange={onValueChange} />
				) : onPress ? (
					<Feather
						name="chevron-right"
						size={22}
						color={colors.tabIconDefault}
					/>
				) : null)}
		</TouchableOpacity>
	);
};

export default function PrivacyScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { colors } = useTheme();

	// Mock privacy settings state
	const [settings, setSettings] = useState({
		privateProfile: false,
		showFollowerCount: true,
		allowDiscovery: true,
		allowVoiceNoteDownload: false,
		dataCollection: true,
		locationSharing: false,
		twoFactorAuth: false,
	});

	const updateSetting = (key: keyof typeof settings, value: boolean) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const handleGoBack = () => {
		router.back();
	};

	const handleBlockedUsers = () => {
		// Mock navigation to blocked users
		console.log("Navigate to blocked users");
	};

	const handleDataRequest = () => {
		// Mock data download request
		console.log("Request data download");
	};

	const handleDeleteAccount = () => {
		// Mock account deletion
		console.log("Delete account requested");
	};

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
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
					<Feather name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					Privacy
				</Text>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
			>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Profile Privacy
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<PrivacySetting
						icon="lock"
						title="Private Profile"
						description="Only followers can see your voice notes"
						value={settings.privateProfile}
						onValueChange={(value) => updateSetting("privateProfile", value)}
					/>
					<PrivacySetting
						icon="users"
						title="Show Follower Count"
						description="Display your follower count on your profile"
						value={settings.showFollowerCount}
						onValueChange={(value) => updateSetting("showFollowerCount", value)}
					/>
					<PrivacySetting
						icon="search"
						title="Allow Discovery"
						description="Let others find you through search"
						value={settings.allowDiscovery}
						onValueChange={(value) => updateSetting("allowDiscovery", value)}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Voice Note Privacy
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<PrivacySetting
						icon="download"
						title="Allow Voice Note Downloads"
						description="Let others download your voice notes"
						value={settings.allowVoiceNoteDownload}
						onValueChange={(value) =>
							updateSetting("allowVoiceNoteDownload", value)
						}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Data & Location
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<PrivacySetting
						icon="map-pin"
						title="Location Sharing"
						description="Share your location with voice notes"
						value={settings.locationSharing}
						onValueChange={(value) => updateSetting("locationSharing", value)}
					/>
					<PrivacySetting
						icon="bar-chart-2"
						title="Data Collection"
						description="Allow anonymous analytics collection"
						value={settings.dataCollection}
						onValueChange={(value) => updateSetting("dataCollection", value)}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Security
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<PrivacySetting
						icon="shield"
						title="Two-Factor Authentication"
						description="Add an extra layer of security"
						value={settings.twoFactorAuth}
						onValueChange={(value) => updateSetting("twoFactorAuth", value)}
					/>
					<PrivacySetting
						icon="user-x"
						title="Blocked Users"
						description="Manage your blocked users list"
						onPress={handleBlockedUsers}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Data Management
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<PrivacySetting
						icon="download-cloud"
						title="Download Your Data"
						description="Get a copy of your data"
						onPress={handleDataRequest}
					/>
				</View>

				<View
					style={[
						styles.sectionContainer,
						{
							marginTop: 20,
							backgroundColor: colors.card,
							borderColor: colors.error + "50",
						},
					]}
				>
					<PrivacySetting
						icon="trash-2"
						title="Delete Account"
						description="Permanently delete your account and data"
						onPress={handleDeleteAccount}
						rightContent={
							<Feather name="chevron-right" size={22} color={colors.error} />
						}
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
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 15,
		borderBottomWidth: 1,
	},
	backButton: {
		marginRight: 16,
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "600",
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
});
