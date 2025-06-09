import React, { useEffect } from "react";
import {
	StyleSheet,
	View,
	Modal,
	Pressable,
	Dimensions,
	Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { AuthModalProps } from "./types";
import { AuthHeader, AuthFooter, AuthForm } from "./components";

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

	// Handle Google/Apple/Facebook auth (placeholder functions)
	const handleGoogleAuth = () => {
		console.log("Google auth not implemented yet");
	};

	const handleAppleAuth = () => {
		console.log("Apple auth not implemented yet");
	};

	const handleFacebookAuth = () => {
		console.log("Facebook auth not implemented yet");
	};

	return (
		<Modal
			visible={isVisible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				{/* Header */}
				<AuthHeader type={type} onClose={handleClose} />

				{/* Form */}
				<View style={styles.formContainer}>
					<AuthForm type={type} onAuth={handleAuth} />
				</View>

				{/* Footer */}
				<AuthFooter
					type={type}
					onSwitchToLogin={onSwitchToLogin}
					onSwitchToSignup={onSwitchToSignup}
				/>

				{/* Background overlay for modal */}
				<Pressable
					style={styles.overlay}
					onPress={handleClose}
					pointerEvents="none"
				/>
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
	formContainer: {
		flex: 1,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "transparent",
	},
});
