import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Platform,
	Linking,
	Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

interface AboutItemProps {
	icon: keyof typeof Feather.glyphMap;
	title: string;
	description: string;
	onPress?: () => void;
	isExternal?: boolean;
}

const AboutItem: React.FC<AboutItemProps> = ({
	icon,
	title,
	description,
	onPress,
	isExternal = false,
}) => {
	const { colors } = useTheme();

	return (
		<TouchableOpacity
			style={[styles.aboutItem, { backgroundColor: colors.background }]}
			onPress={onPress}
			disabled={!onPress}
		>
			<View
				style={[
					styles.aboutIconContainer,
					{ backgroundColor: colors.tint + "20" },
				]}
			>
				<Feather name={icon} size={20} color={colors.tint} />
			</View>
			<View style={styles.aboutContent}>
				<Text style={[styles.aboutTitle, { color: colors.text }]}>{title}</Text>
				<Text
					style={[styles.aboutDescription, { color: colors.tabIconDefault }]}
				>
					{description}
				</Text>
			</View>
			{onPress && (
				<Feather
					name={isExternal ? "external-link" : "chevron-right"}
					size={22}
					color={colors.tabIconDefault}
				/>
			)}
		</TouchableOpacity>
	);
};

export default function AboutScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { colors } = useTheme();

	const handleGoBack = () => {
		router.back();
	};

	const handleTermsOfService = () => {
		const termsUrl = "https://ripply.app/terms";
		Linking.openURL(termsUrl).catch((err) => {
			console.error("Failed to open terms:", err);
		});
	};

	const handlePrivacyPolicy = () => {
		const privacyUrl = "https://ripply.app/privacy";
		Linking.openURL(privacyUrl).catch((err) => {
			console.error("Failed to open privacy policy:", err);
		});
	};

	const handleLicenses = () => {
		console.log("Show open source licenses");
	};

	const handleRateApp = () => {
		const storeUrl =
			Platform.OS === "ios"
				? "https://apps.apple.com/app/ripply/id123456789"
				: "https://play.google.com/store/apps/details?id=com.ripply.app";

		Linking.openURL(storeUrl).catch((err) => {
			console.error("Failed to open app store:", err);
		});
	};

	const handleWebsite = () => {
		const websiteUrl = "https://ripply.app";
		Linking.openURL(websiteUrl).catch((err) => {
			console.error("Failed to open website:", err);
		});
	};

	const handleTwitter = () => {
		const twitterUrl = "https://twitter.com/ripplyapp";
		Linking.openURL(twitterUrl).catch((err) => {
			console.error("Failed to open Twitter:", err);
		});
	};

	const handleInstagram = () => {
		const instagramUrl = "https://instagram.com/ripplyapp";
		Linking.openURL(instagramUrl).catch((err) => {
			console.error("Failed to open Instagram:", err);
		});
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
				<Text style={[styles.headerTitle, { color: colors.text }]}>About</Text>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
			>
				{/* App Logo and Info */}
				<View style={styles.appInfoContainer}>
					<View style={[styles.appLogo, { backgroundColor: colors.tint }]}>
						<Feather name="mic" size={48} color={colors.background} />
					</View>
					<Text style={[styles.appName, { color: colors.text }]}>Ripply</Text>
					<Text style={[styles.appTagline, { color: colors.tabIconDefault }]}>
						Share your voice with the world
					</Text>
					<Text style={[styles.appVersion, { color: colors.tabIconDefault }]}>
						Version 1.0.0 (Build 100)
					</Text>
				</View>

				{/* App Details */}
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					App Information
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<AboutItem
						icon="globe"
						title="Website"
						description="Visit our official website"
						onPress={handleWebsite}
						isExternal
					/>
					<AboutItem
						icon="star"
						title="Rate Ripply"
						description="Rate us on the App Store"
						onPress={handleRateApp}
						isExternal
					/>
					<AboutItem
						icon="file-text"
						title="Terms of Service"
						description="Read our terms and conditions"
						onPress={handleTermsOfService}
						isExternal
					/>
					<AboutItem
						icon="shield"
						title="Privacy Policy"
						description="Learn how we protect your data"
						onPress={handlePrivacyPolicy}
						isExternal
					/>
					<AboutItem
						icon="code"
						title="Open Source Licenses"
						description="View third-party licenses"
						onPress={handleLicenses}
					/>
				</View>

				{/* Social Media */}
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Connect With Us
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<AboutItem
						icon="twitter"
						title="Twitter"
						description="@ripplyapp - Latest updates and news"
						onPress={handleTwitter}
						isExternal
					/>
					<AboutItem
						icon="instagram"
						title="Instagram"
						description="@ripplyapp - Behind the scenes content"
						onPress={handleInstagram}
						isExternal
					/>
				</View>

				{/* Technical Info */}
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Technical Information
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<AboutItem
						icon="smartphone"
						title="Platform"
						description={`${Platform.OS === "ios" ? "iOS" : "Android"} ${
							Platform.Version
						}`}
					/>
					<AboutItem icon="database" title="App Size" description="~45 MB" />
					<AboutItem
						icon="calendar"
						title="Last Updated"
						description="December 2024"
					/>
				</View>

				{/* Credits */}
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Credits
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<AboutItem
						icon="users"
						title="Development Team"
						description="Built with ❤️ by the Ripply team"
					/>
					<AboutItem
						icon="heart"
						title="Special Thanks"
						description="To our beta testers and early adopters"
					/>
				</View>

				{/* Copyright */}
				<View style={styles.copyrightContainer}>
					<Text
						style={[styles.copyrightText, { color: colors.tabIconDefault }]}
					>
						© 2024 Ripply Inc. All rights reserved.
					</Text>
					<Text style={[styles.madeWithText, { color: colors.tabIconDefault }]}>
						Made with React Native & Expo
					</Text>
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
	appInfoContainer: {
		alignItems: "center",
		paddingVertical: 30,
	},
	appLogo: {
		width: 80,
		height: 80,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	appName: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 8,
	},
	appTagline: {
		fontSize: 16,
		textAlign: "center",
		marginBottom: 8,
	},
	appVersion: {
		fontSize: 14,
		opacity: 0.7,
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
	aboutItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
	aboutIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	aboutContent: {
		flex: 1,
	},
	aboutTitle: {
		fontSize: 16,
		fontWeight: "500",
	},
	aboutDescription: {
		fontSize: 13,
		marginTop: 2,
	},
	copyrightContainer: {
		alignItems: "center",
		paddingVertical: 30,
		paddingHorizontal: 20,
	},
	copyrightText: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 8,
	},
	madeWithText: {
		fontSize: 12,
		textAlign: "center",
		opacity: 0.7,
	},
});
