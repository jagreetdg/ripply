import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Platform,
	Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

interface HelpItemProps {
	icon: keyof typeof Feather.glyphMap;
	title: string;
	description: string;
	onPress: () => void;
	isExternal?: boolean;
}

const HelpItem: React.FC<HelpItemProps> = ({
	icon,
	title,
	description,
	onPress,
	isExternal = false,
}) => {
	const { colors } = useTheme();

	return (
		<TouchableOpacity
			style={[styles.helpItem, { backgroundColor: colors.background }]}
			onPress={onPress}
		>
			<View
				style={[
					styles.helpIconContainer,
					{ backgroundColor: colors.tint + "20" },
				]}
			>
				<Feather name={icon} size={20} color={colors.tint} />
			</View>
			<View style={styles.helpContent}>
				<Text style={[styles.helpTitle, { color: colors.text }]}>{title}</Text>
				<Text
					style={[styles.helpDescription, { color: colors.tabIconDefault }]}
				>
					{description}
				</Text>
			</View>
			<Feather
				name={isExternal ? "external-link" : "chevron-right"}
				size={22}
				color={colors.tabIconDefault}
			/>
		</TouchableOpacity>
	);
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({
	question,
	answer,
}) => {
	const { colors } = useTheme();
	const [isExpanded, setIsExpanded] = React.useState(false);

	return (
		<TouchableOpacity
			style={[
				styles.faqItem,
				{
					backgroundColor: colors.background,
					borderBottomColor: colors.border,
				},
			]}
			onPress={() => setIsExpanded(!isExpanded)}
		>
			<View style={styles.faqHeader}>
				<Text style={[styles.faqQuestion, { color: colors.text }]}>
					{question}
				</Text>
				<Feather
					name={isExpanded ? "chevron-up" : "chevron-down"}
					size={20}
					color={colors.tabIconDefault}
				/>
			</View>
			{isExpanded && (
				<Text style={[styles.faqAnswer, { color: colors.tabIconDefault }]}>
					{answer}
				</Text>
			)}
		</TouchableOpacity>
	);
};

export default function HelpSupportScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { colors } = useTheme();

	const handleGoBack = () => {
		router.back();
	};

	const handleContactSupport = () => {
		const email = "support@ripply.app";
		const subject = "Ripply Support Request";
		const body = "Hi Ripply team,\n\nI need help with...\n\n";
		const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
			subject
		)}&body=${encodeURIComponent(body)}`;

		Linking.openURL(mailtoUrl).catch((err) => {
			console.error("Failed to open email:", err);
		});
	};

	const handleReportBug = () => {
		console.log("Report bug functionality");
	};

	const handleFeatureRequest = () => {
		console.log("Feature request functionality");
	};

	const handleCommunityForum = () => {
		const forumUrl = "https://community.ripply.app";
		Linking.openURL(forumUrl).catch((err) => {
			console.error("Failed to open community forum:", err);
		});
	};

	const handleUserGuide = () => {
		const guideUrl = "https://help.ripply.app/user-guide";
		Linking.openURL(guideUrl).catch((err) => {
			console.error("Failed to open user guide:", err);
		});
	};

	const handleStatus = () => {
		const statusUrl = "https://status.ripply.app";
		Linking.openURL(statusUrl).catch((err) => {
			console.error("Failed to open status page:", err);
		});
	};

	const faqData = [
		{
			question: "How do I record a voice note?",
			answer:
				"Tap the microphone button on the home screen, hold to record, and release when finished. You can then add a caption and share your voice note.",
		},
		{
			question: "Can I edit my voice notes after posting?",
			answer:
				"Currently, you cannot edit voice notes after posting, but you can delete and re-record them. We're working on adding editing features in future updates.",
		},
		{
			question: "How do I report inappropriate content?",
			answer:
				"Tap the three dots on any voice note and select 'Report'. Choose the appropriate reason and we'll review it promptly.",
		},
		{
			question: "Why can't I hear voice notes?",
			answer:
				"Check your device volume, ensure you're not in silent mode, and verify the app has permission to use audio. Try restarting the app if issues persist.",
		},
		{
			question: "How do I change my username?",
			answer:
				"Go to Settings > Profile, tap on your username field, and enter your new username. Note that usernames must be unique and follow our community guidelines.",
		},
		{
			question: "How do I delete my account?",
			answer:
				"Go to Settings > Privacy > Delete Account. This action is permanent and cannot be undone. All your data will be permanently removed.",
		},
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
				<TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
					<Feather name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					Help & Support
				</Text>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
			>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Get Help
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<HelpItem
						icon="mail"
						title="Contact Support"
						description="Get direct help from our support team"
						onPress={handleContactSupport}
						isExternal
					/>
					<HelpItem
						icon="book-open"
						title="User Guide"
						description="Learn how to use Ripply effectively"
						onPress={handleUserGuide}
						isExternal
					/>
					<HelpItem
						icon="users"
						title="Community Forum"
						description="Connect with other users and get tips"
						onPress={handleCommunityForum}
						isExternal
					/>
					<HelpItem
						icon="activity"
						title="Service Status"
						description="Check if Ripply services are operational"
						onPress={handleStatus}
						isExternal
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Report Issues
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					<HelpItem
						icon="alert-circle"
						title="Report a Bug"
						description="Help us fix issues you've encountered"
						onPress={handleReportBug}
					/>
					<HelpItem
						icon="zap"
						title="Feature Request"
						description="Suggest new features for Ripply"
						onPress={handleFeatureRequest}
					/>
				</View>

				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					Frequently Asked Questions
				</Text>
				<View
					style={[
						styles.sectionContainer,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					{faqData.map((faq, index) => (
						<FAQItem key={index} question={faq.question} answer={faq.answer} />
					))}
				</View>

				<View style={styles.helpNote}>
					<Text style={[styles.helpNoteText, { color: colors.tabIconDefault }]}>
						Can't find what you're looking for? Our support team is here to
						help. Contact us directly and we'll get back to you as soon as
						possible.
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
	helpItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
	helpIconContainer: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	helpContent: {
		flex: 1,
	},
	helpTitle: {
		fontSize: 16,
		fontWeight: "500",
	},
	helpDescription: {
		fontSize: 13,
		marginTop: 2,
	},
	faqItem: {
		paddingHorizontal: 15,
		paddingVertical: 15,
		borderBottomWidth: 1,
	},
	faqHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	faqQuestion: {
		fontSize: 16,
		fontWeight: "500",
		flex: 1,
		marginRight: 10,
	},
	faqAnswer: {
		fontSize: 14,
		marginTop: 10,
		lineHeight: 20,
	},
	helpNote: {
		marginTop: 20,
		paddingHorizontal: 16,
		paddingVertical: 16,
		marginHorizontal: 4,
	},
	helpNoteText: {
		fontSize: 14,
		textAlign: "center",
		lineHeight: 20,
	},
});
