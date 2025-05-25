import React, { useState, useEffect, useRef } from "react";
import {
	StyleSheet,
	View,
	Text,
	Dimensions,
	Image,
	Animated,
	Easing,
	TouchableOpacity,
	Platform,
	ScrollView,
	ViewStyle,
	TextStyle,
	ImageStyle,
	SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";
import AuthModal from "../components/auth/AuthModal";
import AnimatedButton from "../components/landing/AnimatedButton";
import SocialAuthButton from "../components/landing/SocialAuthButton";
import AudioWaveform from "../components/landing/AudioWaveform";
import FeatureCard from "../components/landing/FeatureCard";
import TestimonialCard from "../components/landing/TestimonialCard";
import Section from "../components/landing/Section";
import GoogleIcon from "../assets/icons/googleIcon";
import AppleIcon from "../assets/icons/appleIcon";
import { getCurrentUser } from "../services/api/authService";
import { SocialAuthButtons } from "../components/auth/SocialAuthButtons";
import Colors from "../constants/Colors";
import { Redirect } from "expo-router";

// Register for the auth callback
WebBrowser.maybeCompleteAuthSession();

// API URL for authentication
const API_URL = "https://ripply-backend.onrender.com";

// Token storage keys
const TOKEN_KEY = "@ripply_auth_token";
const USER_KEY = "@ripply_user";

export default function LandingPage() {
	const router = useRouter();
	const { user, loading } = useUser();
	const [authModalVisible, setAuthModalVisible] = useState(false);
	const [authMode, setAuthMode] = useState<"login" | "signup">("login");

	// Animation refs
	const rippleAnims = useRef([
		new Animated.Value(1),
		new Animated.Value(1),
		new Animated.Value(1),
		new Animated.Value(1),
		new Animated.Value(1),
		new Animated.Value(1),
		new Animated.Value(1),
		new Animated.Value(1),
	]).current;

	// If user is authenticated, redirect to home
	useEffect(() => {
		if (!loading && user) {
			router.replace("/(tabs)/home");
		}
	}, [user, loading, router]);

	// Start ripple animations
	useEffect(() => {
		const createRippleAnimation = (
			animValue: Animated.Value,
			delay: number
		) => {
			return Animated.loop(
				Animated.sequence([
					Animated.timing(animValue, {
						toValue: 1.2,
						duration: 2000,
						delay,
						easing: Easing.inOut(Easing.sin),
						useNativeDriver: true,
					}),
					Animated.timing(animValue, {
						toValue: 1,
						duration: 2000,
						easing: Easing.inOut(Easing.sin),
						useNativeDriver: true,
					}),
				])
			);
		};

		// Start all ripple animations with different delays
		const animations = rippleAnims.map((anim, index) =>
			createRippleAnimation(anim, index * 300)
		);

		animations.forEach((animation) => animation.start());

		return () => {
			animations.forEach((animation) => animation.stop());
		};
	}, []);

	const handleAuthPress = (mode: "login" | "signup") => {
		setAuthMode(mode);
		setAuthModalVisible(true);
	};

	const handleSocialAuth = async (provider: "google" | "apple") => {
		try {
			const authUrl = `${API_URL}/api/auth/${provider}`;
			const result = await WebBrowser.openAuthSessionAsync(
				authUrl,
				`${API_URL}/auth/callback`
			);

			if (result.type === "success" && result.url) {
				const url = new URL(result.url);
				const token = url.searchParams.get("token");
				const userData = url.searchParams.get("user");

				if (token && userData) {
					await AsyncStorage.setItem(TOKEN_KEY, token);
					await AsyncStorage.setItem(USER_KEY, userData);
					router.replace("/(tabs)/home");
				}
			}
		} catch (error) {
			console.error(`${provider} auth error:`, error);
		}
	};

	// Show loading while checking auth state
	if (loading) {
		return (
			<View
				style={[
					styles.container,
					{ justifyContent: "center", alignItems: "center" },
				]}
			>
				<Text style={{ color: "#FFFFFF", fontSize: 18 }}>Loading...</Text>
			</View>
		);
	}

	// If user is authenticated, don't show landing page
	if (user) {
		return null;
	}

	return (
		<View style={styles.container}>
			<StatusBar style="light" />
			<LinearGradient
				colors={["#0F0524", "#1A0B2E", "#2D1B69"]}
				style={styles.gradient}
			>
				{/* Background Animations */}
				<View style={styles.backgroundAnimations}>
					<View style={styles.rippleContainer}>
						{rippleAnims.slice(0, 6).map((anim, index) => (
							<Animated.View
								key={index}
								style={[
									styles.ripple,
									styles[`ripple${index + 1}` as keyof typeof styles],
									{ transform: [{ scale: anim }] },
								]}
							/>
						))}
					</View>
					<View style={styles.rippleContainer2}>
						{rippleAnims.slice(6, 8).map((anim, index) => (
							<Animated.View
								key={index + 6}
								style={[
									styles.ripple,
									styles[`ripple${index + 7}` as keyof typeof styles],
									{ transform: [{ scale: anim }] },
								]}
							/>
						))}
					</View>
				</View>

				<SafeAreaView style={styles.safeArea}>
					<ScrollView
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
					>
						{/* Hero Section */}
						<View style={styles.heroSection}>
							<View style={styles.heroContent}>
								<Text style={styles.heroTitle}>
									Share Your Voice,{"\n"}Shape the World
								</Text>
								<Text style={styles.heroSubtitle}>
									Connect through authentic voice notes and discover stories
									that matter to you
								</Text>

								{/* Auth Buttons */}
								<View style={styles.authButtonsContainer}>
									<View style={styles.buttonRow}>
										<AnimatedButton
											text="Log In"
											onPress={() => handleAuthPress("login")}
											primary={false}
											style={[styles.authButton, styles.loginButton]}
										/>
										<AnimatedButton
											text="Sign Up"
											onPress={() => handleAuthPress("signup")}
											primary={true}
											style={styles.authButton}
										/>
									</View>

									<View style={styles.divider}>
										<View style={styles.dividerLine} />
										<Text style={styles.dividerText}>or continue with</Text>
										<View style={styles.dividerLine} />
									</View>

									<View style={styles.socialButtonsRow}>
										<TouchableOpacity
											style={styles.iconButton}
											onPress={() => handleSocialAuth("google")}
										>
											<GoogleIcon width={24} height={24} />
										</TouchableOpacity>
										<TouchableOpacity
											style={styles.iconButton}
											onPress={() => handleSocialAuth("apple")}
										>
											<AppleIcon width={24} height={24} />
										</TouchableOpacity>
									</View>
								</View>
							</View>
						</View>

						{/* Features Section */}
						<Section
							title="Why Choose Ripply?"
							subtitle="Discover what makes our platform special"
						>
							<View style={styles.featuresContainer}>
								<FeatureCard
									icon="mic"
									title="Voice-First Experience"
									description="Share your thoughts through authentic voice notes that capture emotion and personality"
									style={styles.featureCard}
									index={1}
								/>
								<FeatureCard
									icon="users"
									title="Meaningful Connections"
									description="Build genuine relationships through voice-based conversations and shared interests"
									style={styles.featureCard}
									index={2}
								/>
								<FeatureCard
									icon="trending-up"
									title="Discover & Grow"
									description="Find trending topics, follow creators, and grow your own voice in the community"
									style={styles.featureCard}
									index={3}
								/>
							</View>
						</Section>

						{/* Highlights Section */}
						<Section
							title="Key Features"
							subtitle="Everything you need to express yourself"
						>
							<View style={styles.highlightsContainer}>
								<View style={styles.highlightItem}>
									<LinearGradient
										colors={["#6B2FBC", "#9D7BC7"]}
										style={styles.highlightIcon}
									>
										<Feather name="headphones" size={24} color="#FFFFFF" />
									</LinearGradient>
									<Text style={styles.highlightTitle}>High-Quality Audio</Text>
								</View>
								<View style={styles.highlightItem}>
									<LinearGradient
										colors={["#6B2FBC", "#9D7BC7"]}
										style={styles.highlightIcon}
									>
										<Feather name="shield" size={24} color="#FFFFFF" />
									</LinearGradient>
									<Text style={styles.highlightTitle}>Privacy First</Text>
								</View>
								<View style={styles.highlightItem}>
									<LinearGradient
										colors={["#6B2FBC", "#9D7BC7"]}
										style={styles.highlightIcon}
									>
										<Feather name="zap" size={24} color="#FFFFFF" />
									</LinearGradient>
									<Text style={styles.highlightTitle}>Real-time Updates</Text>
								</View>
								<View style={styles.highlightItem}>
									<LinearGradient
										colors={["#6B2FBC", "#9D7BC7"]}
										style={styles.highlightIcon}
									>
										<Feather name="globe" size={24} color="#FFFFFF" />
									</LinearGradient>
									<Text style={styles.highlightTitle}>Global Community</Text>
								</View>
							</View>
						</Section>

						{/* Testimonials Section */}
						<Section
							title="What People Say"
							subtitle="Join thousands of users sharing their voices"
						>
							<View style={styles.testimonialsContainer}>
								<TestimonialCard
									quote="Ripply changed how I connect with others. Voice notes feel so much more personal than text."
									name="Sarah M."
									role="Content Creator"
									style={styles.testimonialCard}
								/>
								<TestimonialCard
									quote="The audio quality is amazing and the community is so welcoming. Love discovering new voices!"
									name="Mike R."
									role="Podcast Host"
									style={styles.testimonialCard}
								/>
								<TestimonialCard
									quote="Finally, a platform that values authentic communication over quick reactions."
									name="Emma L."
									role="Teacher"
									style={styles.testimonialCard}
								/>
							</View>
						</Section>

						{/* CTA Section */}
						<View style={styles.ctaSection}>
							<BlurView intensity={20} style={styles.ctaContainer}>
								<Text style={styles.ctaTitle}>Ready to Get Started?</Text>
								<Text style={styles.ctaSubtitle}>
									Join our community and start sharing your voice today
								</Text>
								<View style={styles.ctaButtonContainer}>
									<AnimatedButton
										text="Sign Up Now"
										onPress={() => handleAuthPress("signup")}
										style={styles.ctaButton}
										icon="arrow-right"
										iconPosition="right"
									/>
								</View>
							</BlurView>
						</View>
					</ScrollView>
				</SafeAreaView>

				{/* Footer */}
				<View style={styles.footer}>
					<View style={styles.footerLinks}>
						<Text style={styles.footerLink}>Privacy</Text>
						<Text style={styles.footerLink}>Terms</Text>
						<Text style={styles.footerLink}>Support</Text>
					</View>
					<Text style={styles.footerText}>
						© 2024 Ripply. All rights reserved.
					</Text>
				</View>
			</LinearGradient>

			{/* Auth Modal */}
			<AuthModal
				visible={authModalVisible}
				onClose={() => setAuthModalVisible(false)}
				mode={authMode}
				onModeChange={setAuthMode}
			/>
		</View>
	);
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0F0524", // Very dark purple background
	},
	gradient: {
		flex: 1,
		position: "relative",
		overflow: "hidden",
	},
	backgroundAnimations: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 0,
	},
	rippleContainer: {
		position: "absolute",
		width: width * 0.9,
		height: width * 0.9,
		top: height * 0.05,
		left: -width * 0.4,
		opacity: 0.5,
		justifyContent: "center",
		alignItems: "center",
	},
	rippleContainer2: {
		position: "absolute",
		width: width * 0.7,
		height: width * 0.7,
		bottom: height * 0.1,
		right: -width * 0.3,
		opacity: 0.5,
		justifyContent: "center",
		alignItems: "center",
	},
	ripple: {
		position: "absolute",
		borderWidth: 2,
		borderColor: "rgba(107, 47, 188, 0.5)",
		borderRadius: 1000,
	},
	ripple1: {
		width: width * 0.9,
		height: width * 0.9,
		borderRadius: width * 0.45,
		borderColor: "rgba(138, 79, 214, 0.7)",
		borderWidth: 3,
	},
	ripple2: {
		width: width * 0.75,
		height: width * 0.75,
		borderRadius: width * 0.375,
		borderColor: "rgba(157, 123, 199, 0.65)",
		borderWidth: 2.5,
	},
	ripple3: {
		width: width * 0.6,
		height: width * 0.6,
		borderRadius: width * 0.3,
		borderColor: "rgba(212, 193, 236, 0.7)",
	},
	ripple4: {
		width: width * 0.45,
		height: width * 0.45,
		borderRadius: width * 0.225,
		borderColor: "rgba(138, 79, 214, 0.75)",
		borderWidth: 2,
	},
	ripple5: {
		width: width * 0.3,
		height: width * 0.3,
		borderRadius: width * 0.15,
		borderColor: "rgba(157, 123, 199, 0.8)",
		borderWidth: 2,
	},
	ripple6: {
		width: width * 0.15,
		height: width * 0.15,
		borderRadius: width * 0.075,
		borderColor: "rgba(212, 193, 236, 0.85)",
	},
	ripple7: {
		width: width * 0.7,
		height: width * 0.7,
		borderRadius: width * 0.35,
		borderColor: "rgba(138, 79, 214, 0.7)",
		borderWidth: 2.5,
	},
	ripple8: {
		width: width * 0.4,
		height: width * 0.4,
		borderRadius: width * 0.2,
		borderColor: "rgba(157, 123, 199, 0.8)",
		borderWidth: 2,
	},
	safeArea: {
		flex: 1,
		paddingTop: Platform.OS === "android" ? 25 : 0, // Add padding for Android status bar
	},
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 80, // Space for footer
		alignItems: "center",
	},
	heroSection: {
		width: "100%",
		minHeight: height - 100,
		justifyContent: "center",
		alignItems: "center",
		paddingTop: 60,
		paddingHorizontal: 20,
	},
	heroContent: {
		width: "100%",
		maxWidth: 800,
		alignItems: "center",
	},
	heroTitle: {
		fontSize: width < 380 ? 32 : 42,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 16,
		textAlign: "center",
		textShadowColor: "rgba(138, 79, 209, 0.6)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 10,
	},
	heroSubtitle: {
		fontSize: 18,
		color: "#E0D1FF",
		textAlign: "center",
		fontWeight: "500",
		marginBottom: 30,
		maxWidth: 600,
	},
	featuresContainer: {
		flexDirection: width > 768 ? "row" : "column",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		maxWidth: 1000,
	},
	featureCard: {
		marginBottom: 24,
		width: width > 768 ? "30%" : "100%",
		maxWidth: 320,
	},
	highlightsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "flex-start",
		width: "100%",
		maxWidth: 1000,
	},
	highlightItem: {
		width: width > 600 ? "30%" : "45%",
		alignItems: "center",
		marginBottom: 30,
		marginHorizontal: 10,
	},
	highlightIcon: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	highlightTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#FFFFFF",
		textAlign: "center",
	},
	testimonialsContainer: {
		flexDirection: width > 768 ? "row" : "column",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		maxWidth: 1000,
	},
	testimonialCard: {
		marginBottom: 24,
		width: width > 768 ? "30%" : "100%",
		maxWidth: 320,
	},
	ctaSection: {
		width: "100%",
		paddingVertical: 60,
		paddingHorizontal: 20,
		alignItems: "center",
	},
	ctaContainer: {
		width: "100%",
		maxWidth: 800,
		borderRadius: 20,
		padding: 40,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
	},
	ctaTitle: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 12,
		textAlign: "center",
	},
	ctaSubtitle: {
		fontSize: 18,
		color: "#E0D1FF",
		textAlign: "center",
		marginBottom: 30,
	},
	ctaButtonContainer: {
		width: "100%",
		maxWidth: 300,
	},
	ctaButton: {
		height: 56,
	},
	authButtonsContainer: {
		width: "100%",
		maxWidth: 500,
		alignSelf: "center",
		alignItems: "center",
	},
	buttonRow: {
		flexDirection: "row",
		width: "80%",
		justifyContent: "center",
		marginBottom: 16,
		alignItems: "center",
		paddingHorizontal: 0,
		alignSelf: "center",
		gap: 20,
	},
	socialButtonsRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		marginBottom: 16,
		gap: 20,
	},
	authButton: {
		width: "45%",
		height: 56,
		minWidth: 130,
		marginHorizontal: 0,
		flex: 1,
		maxWidth: "45%",
	},
	loginButton: {
		borderColor: "#D4C1EC",
		borderWidth: 2,
		backgroundColor: "rgba(212, 193, 236, 0.25)",
	},
	signupButton: {
		borderColor: "#FFFFFF",
		borderWidth: 2,
	},
	iconButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.35)",
		borderWidth: 1,
		borderColor: "rgba(157, 123, 199, 0.6)",
		overflow: "hidden",
	},
	divider: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 16,
		width: "100%",
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
	},
	dividerText: {
		paddingHorizontal: 12,
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 14,
	},
	footer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingVertical: 16,
		alignItems: "center",
		backgroundColor: "rgba(26, 11, 46, 0.8)",
		borderTopWidth: 1,
		borderTopColor: "rgba(255, 255, 255, 0.1)",
	},
	footerLinks: {
		flexDirection: "row",
		marginBottom: 10,
	},
	footerLink: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 14,
		marginHorizontal: 10,
	},
	footerText: {
		color: "rgba(255, 255, 255, 0.5)",
		fontSize: 12,
	},
});
