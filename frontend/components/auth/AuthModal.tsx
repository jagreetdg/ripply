import React, { useEffect } from "react";
import {
	StyleSheet,
	View,
	Modal,
	Pressable,
	Dimensions,
	Platform,
	Text,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import SocialAuthButtons from "./SocialAuthButtons";

type AuthModalProps = {
	isVisible: boolean;
	onClose: () => void;
	type: "login" | "signup";
	onSwitchToLogin: () => void;
	onSwitchToSignup: () => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function AuthModal({
	isVisible,
	onClose,
	type,
	onSwitchToLogin,
	onSwitchToSignup,
}: AuthModalProps) {
	const { colors } = useTheme();

	// Reset form when modal opens/closes or type changes
	useEffect(() => {
		// Any cleanup or initialization logic can go here
	}, [isVisible, type]);

	const handleClose = () => {
		onClose();
	};

	const handleAuth = () => {
		// The AuthForm component handles the actual authentication
		// This is called after successful auth to close the modal
		onClose();
	};

	// Handle Google/Apple/Facebook auth using the working implementation
	const handleGoogleAuth = () => {
		console.log("Starting Google authentication...");
		// SocialAuthButtons component handles the actual implementation
	};

	const handleAppleAuth = () => {
		console.log("Starting Apple authentication...");
		// SocialAuthButtons component handles the actual implementation
	};

	const handleFacebookAuth = () => {
		console.log("Starting Facebook authentication...");
		// SocialAuthButtons component handles the actual implementation
	};

	return (
		<Modal
			visible={isVisible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				{/* Header with close button */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>
						{type === "login" ? "Sign In" : "Sign Up"}
					</Text>
					<Pressable onPress={handleClose} style={styles.closeButton}>
						<Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
					</Pressable>
				</View>

				{/* Social Auth - Simple and Effective */}
				<View style={styles.content}>
					<SocialAuthButtons
						onGoogleAuth={handleGoogleAuth}
						onAppleAuth={handleAppleAuth}
						onFacebookAuth={handleFacebookAuth}
					/>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		maxHeight: Platform.OS === "web" ? screenHeight * 0.9 : screenHeight,
		maxWidth:
			Platform.OS === "web" ? Math.min(500, screenWidth * 0.9) : screenWidth,
		alignSelf: "center",
		borderRadius: Platform.OS === "web" ? 16 : 0,
		overflow: "hidden",
		marginTop: Platform.OS === "web" ? screenHeight * 0.05 : 0,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
		paddingTop: 40,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
	},
	closeButton: {
		padding: 10,
	},
	closeText: {
		fontSize: 18,
		fontWeight: "bold",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: "center",
	},
});
