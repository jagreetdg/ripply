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
import UniversalSocialAuthButtons from "./UniversalSocialAuthButtons";

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

	// Handle social authentication success
	const handleSocialAuthSuccess = (result: { user: any; token: string }) => {
		console.log(
			"[Auth Modal] Social authentication successful:",
			result.user.email
		);
		// Close modal and let the app handle the authenticated state
		onClose();
	};

	// Handle social authentication error
	const handleSocialAuthError = (error: string) => {
		console.error("[Auth Modal] Social authentication error:", error);
		// The UniversalSocialAuthButtons component will handle showing the error
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

					{/* Universal Social Auth Buttons */}
					<UniversalSocialAuthButtons
						onAuthSuccess={handleSocialAuthSuccess}
						onAuthError={handleSocialAuthError}
					/>
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
