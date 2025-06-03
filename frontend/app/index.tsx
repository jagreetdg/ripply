import React, { useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	Dimensions,
	Platform,
	ScrollView,
	SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import AuthModal from "../components/auth/AuthModal";
import { useAuthHandler } from "../hooks/useAuthHandler";
import HeroSection from "../components/landing/HeroSection";
import Footer from "../components/landing/Footer";
import BackgroundRippleEffect from "../components/landing/BackgroundRippleEffect";

export default function LandingPage() {
	const [loginModalVisible, setLoginModalVisible] = useState(false);
	const [signupModalVisible, setSignupModalVisible] = useState(false);

	const {
		user,
		isLoading: isAuthLoading,
		authError,
		initiateSocialAuth,
	} = useAuthHandler();

	const handleLoginModalOpen = () => {
		setLoginModalVisible(true);
	};

	const handleSignupModalOpen = () => {
		setSignupModalVisible(true);
	};

	if (isAuthLoading) {
		return (
			<View style={styles.container}>
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<StatusBar
				style="light"
				translucent={true}
				backgroundColor="transparent"
				hidden={false}
			/>

			<LinearGradient
				colors={[
					"#0F0524",
					"#1A0B2E",
					"#321A5B",
					"#4B2A89",
					"#6B2FBC",
					"#8A4FD6",
				]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				locations={[0, 0.15, 0.35, 0.6, 0.85, 1]}
				style={styles.gradient}
			>
				<BackgroundRippleEffect />

				<SafeAreaView style={styles.safeArea}>
					<ScrollView contentContainerStyle={styles.scrollContent}>
						<HeroSection
							onShowLoginModal={handleLoginModalOpen}
							onShowSignupModal={handleSignupModalOpen}
							onGoogleSignIn={() => initiateSocialAuth("google")}
							onAppleSignIn={() => initiateSocialAuth("apple")}
							isAuthLoading={isAuthLoading}
						/>
					</ScrollView>
				</SafeAreaView>

				<Footer />
			</LinearGradient>

			<AuthModal
				isVisible={loginModalVisible}
				onClose={() => setLoginModalVisible(false)}
				type="login"
				onSwitchToSignup={() => {
					setLoginModalVisible(false);
					setSignupModalVisible(true);
				}}
			/>

			<AuthModal
				isVisible={signupModalVisible}
				onClose={() => setSignupModalVisible(false)}
				type="signup"
				onSwitchToLogin={() => {
					setSignupModalVisible(false);
					setLoginModalVisible(true);
				}}
			/>
		</View>
	);
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0F0524",
	},
	loadingText: {
		color: "#FFFFFF",
		fontSize: 18,
		textAlign: "center",
		marginTop: "50%",
	},
	gradient: {
		flex: 1,
		position: "relative",
		overflow: "hidden",
	},
	safeArea: {
		flex: 1,
		paddingTop: Platform.OS === "android" ? 25 : 0,
	},
	scrollContent: {
		flexGrow: 1,
		alignItems: "center",
	},
});
