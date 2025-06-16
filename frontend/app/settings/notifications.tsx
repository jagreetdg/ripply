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

interface NotificationSettingProps {
	icon: keyof typeof Feather.glyphMap;
	title: string;
	description: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}

const NotificationSetting: React.FC<NotificationSettingProps> = ({
	icon,
	title,
	description,
	value,
	onValueChange,
}) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.settingItem, { backgroundColor: colors.background }]}>
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
			<CustomToggle value={value} onValueChange={onValueChange} />
		</View>
	);
};

export default function NotificationPreferencesScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { colors } = useTheme();

	// Mock notification settings state
	const [settings, setSettings] = useState({
		pushNotifications: true,
		newFollowers: true,
		voiceNoteComments: true,
		voiceNoteLikes: false,
		voiceNoteShares: true,
		weeklyDigest: true,
		emailNotifications: false,
		soundEnabled: true,
		vibrationEnabled: true,
	});

	const updateSetting = (key: keyof typeof settings, value: boolean) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
	};

	const handleGoBack = () => {
		router.back();
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
					Notification Preferences
				</Text>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
			>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Push Notifications
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<NotificationSetting
						icon="bell"
						title="Push Notifications"
						description="Receive notifications on this device"
						value={settings.pushNotifications}
						onValueChange={(value) => updateSetting("pushNotifications", value)}
					/>
					<NotificationSetting
						icon="user-plus"
						title="New Followers"
						description="When someone follows you"
						value={settings.newFollowers}
						onValueChange={(value) => updateSetting("newFollowers", value)}
					/>
					<NotificationSetting
						icon="message-circle"
						title="Voice Note Comments"
						description="When someone comments on your voice notes"
						value={settings.voiceNoteComments}
						onValueChange={(value) => updateSetting("voiceNoteComments", value)}
					/>
					<NotificationSetting
						icon="heart"
						title="Voice Note Likes"
						description="When someone likes your voice notes"
						value={settings.voiceNoteLikes}
						onValueChange={(value) => updateSetting("voiceNoteLikes", value)}
					/>
					<NotificationSetting
						icon="share"
						title="Voice Note Shares"
						description="When someone shares your voice notes"
						value={settings.voiceNoteShares}
						onValueChange={(value) => updateSetting("voiceNoteShares", value)}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Email & Digest
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<NotificationSetting
						icon="mail"
						title="Email Notifications"
						description="Receive important updates via email"
						value={settings.emailNotifications}
						onValueChange={(value) =>
							updateSetting("emailNotifications", value)
						}
					/>
					<NotificationSetting
						icon="calendar"
						title="Weekly Digest"
						description="Get a summary of your week on Ripply"
						value={settings.weeklyDigest}
						onValueChange={(value) => updateSetting("weeklyDigest", value)}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Device Settings
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<NotificationSetting
						icon="volume-2"
						title="Sound"
						description="Play sound for notifications"
						value={settings.soundEnabled}
						onValueChange={(value) => updateSetting("soundEnabled", value)}
					/>
					<NotificationSetting
						icon="smartphone"
						title="Vibration"
						description="Vibrate for notifications"
						value={settings.vibrationEnabled}
						onValueChange={(value) => updateSetting("vibrationEnabled", value)}
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
