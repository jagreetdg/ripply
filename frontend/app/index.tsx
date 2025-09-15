import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	Text,
	Dimensions,
	Platform,
	ScrollView,
	SafeAreaView,
	TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AuthModal from "../components/auth/AuthModal";
import { useUser } from "../context/UserContext";
import { UniversalAuth } from "../services/api/universalAuth";
import HeroSection from "../components/landing/HeroSection";
import BackgroundRippleEffect from "../components/landing/BackgroundRippleEffect";
import Colors from "../constants/Colors";

export default function LandingPage() {
	const [loginModalVisible, setLoginModalVisible] = useState(false);
	const [signupModalVisible, setSignupModalVisible] = useState(false);
	const router = useRouter();

	const { user, loading: userLoading, refreshUser } = useUser();
	const [socialAuthLoading, setSocialAuthLoading] = useState(false);

	// Combine loading states
	const isAuthLoading = userLoading || socialAuthLoading;

	// Handle OAuth token from URL parameters (web OAuth flow)
	useEffect(() => {
		const handleOAuthCallback = async () => {
			if (typeof window !== "undefined") {
				const urlParams = new URLSearchParams(window.location.search);
				const authToken = urlParams.get("auth_token");
				const authError = urlParams.get("auth_error");

				if (authError) {
					console.error("[Landing Page] OAuth error:", authError);
					// Clear URL parameters
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname
					);
					return;
				}

				if (authToken) {
					console.log("[Landing Page] OAuth token received from URL");
					try {
						// Store the token
						await UniversalAuth.storeToken(authToken);

						// Clear URL parameters
						window.history.replaceState(
							{},
							document.title,
							window.location.pathname
						);

						// Close any open modals
						setLoginModalVisible(false);
						setSignupModalVisible(false);

						console.log("[Landing Page] OAuth authentication successful");

						// Trigger UserContext to refresh and detect the new token
						console.log("[Landing Page] Refreshing user context after OAuth");
						await refreshUser();
					} catch (error) {
						console.error(
							"[Landing Page] Error processing OAuth token:",
							error
						);
					}
				}
			}
		};

		handleOAuthCallback();
	}, []);

	// Handle universal social authentication
	const handleSocialAuth = async (provider: string) => {
		if (socialAuthLoading) return;

		setSocialAuthLoading(true);

		try {
			console.log(`[Landing Page] Starting ${provider} authentication`);

			const result = await UniversalAuth.authenticateWithProvider(provider);

			if (result.success && result.user && result.token) {
				console.log(`[Landing Page] ${provider} authentication successful`);
				// Close any open modals and let UserContext handle the redirect
				setLoginModalVisible(false);
				setSignupModalVisible(false);
			} else {
				console.error(
					`[Landing Page] ${provider} authentication failed:`,
					result.error
				);
				// You could show an error message here if desired
			}
		} catch (error) {
			console.error(`[Landing Page] ${provider} authentication error:`, error);
		} finally {
			setSocialAuthLoading(false);
		}
	};

	// Remove the redirect logic - RequireAuth handles this now

	const handleLoginModalOpen = () => {
		setLoginModalVisible(true);
	};

	const handleSignupModalOpen = () => {
		setSignupModalVisible(true);
	};

	// Show loading while checking authentication
	if (isAuthLoading) {
		return (
			<View style={styles.container}>
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		);
	}

	// Let RequireAuth handle the redirect logic instead of duplicating it here
	// Just render the landing page content

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
							onGoogleSignIn={() => handleSocialAuth("google")}
							onAppleSignIn={() => handleSocialAuth("apple")}
							isAuthLoading={socialAuthLoading}
						/>
					</ScrollView>
				</SafeAreaView>
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
