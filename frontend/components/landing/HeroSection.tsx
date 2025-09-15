import React, { useRef, useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Easing,
	Dimensions,
	Platform,
	ViewStyle,
	TextStyle,
	Image,
} from "react-native";
import * as Font from "expo-font";
import AnimatedButton from "./AnimatedButton"; // Assuming AnimatedButton is in the same folder
import SocialAuthButton from "./SocialAuthButton"; // Assuming SocialAuthButton is in the same folder
import AudioWaveform from "./AudioWaveform"; // Assuming AudioWaveform is in the same folder
import GoogleIcon from "../../assets/icons/googleIcon"; // Adjusted path
import AppleIcon from "../../assets/icons/appleIcon"; // Adjusted path

const { width, height } = Dimensions.get("window");

interface HeroSectionProps {
	onShowLoginModal: () => void;
	onShowSignupModal: () => void;
	onGoogleSignIn: () => void;
	onAppleSignIn: () => void;
	isAuthLoading: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
	onShowLoginModal,
	onShowSignupModal,
	onGoogleSignIn,
	onAppleSignIn,
	isAuthLoading,
}) => {
	// State to track if fonts are loaded
	const [fontsLoaded, setFontsLoaded] = useState(false);
	// Add state for logo animation
	const logoAnim = useRef(new Animated.Value(0)).current;

	// Animation values - kept from original LandingPage
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;
	const titleAnim = useRef(new Animated.Value(0)).current;
	const subtitleAnim = useRef(new Animated.Value(0)).current;
	const buttonAnim = useRef(new Animated.Value(0)).current;
	const waveAnim = useRef(new Animated.Value(0)).current;

	// Simplified font handling - no longer loading custom fonts here to avoid iOS issues
	useEffect(() => {
		// For now, set fonts as loaded immediately and use system fonts as fallback
		setFontsLoaded(true);
	}, []);

	useEffect(() => {
		// Only start animations once fonts are loaded
		if (!fontsLoaded) return;

		// Staggered entrance animations - kept from original LandingPage
		Animated.sequence([
			// Start with logo animation
			Animated.timing(logoAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			}),
			Animated.timing(titleAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			}),
			Animated.timing(subtitleAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			}),
			Animated.timing(waveAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: Platform.OS !== "web", // waveAnim might not work with native driver on web for some properties
				easing: Easing.out(Easing.cubic),
			}),
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
					easing: Easing.out(Easing.cubic),
				}),
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 800,
					useNativeDriver: true,
					easing: Easing.out(Easing.cubic),
				}),
			]),
			Animated.timing(buttonAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			}),
		]).start();
	}, [
		titleAnim,
		subtitleAnim,
		waveAnim,
		fadeAnim,
		slideAnim,
		buttonAnim,
		logoAnim,
		fontsLoaded,
	]);

	// If fonts aren't loaded yet, don't render anything visible
	if (!fontsLoaded) {
		return <View style={styles.heroSection} />;
	}

	return (
		<View style={styles.heroSection}>
			<Animated.View
				style={[
					styles.heroContent,
					{
						opacity: fadeAnim, // Use fadeAnim for the whole block if slideAnim is for text only
						transform: [{ translateY: slideAnim }],
					},
				]}
			>
				{/* Logo Image */}
				<Animated.View style={[styles.logoContainer, { opacity: logoAnim }]}>
					<Image
						source={require("../../assets/images/logo_transparent.png")}
						style={styles.logo}
						resizeMode="contain"
					/>
				</Animated.View>

				<Animated.Text style={[styles.heroTitle, { opacity: titleAnim }]}>
					Your Voice. Your Vibe.
				</Animated.Text>

				<Animated.Text style={[styles.heroSubtitle, { opacity: subtitleAnim }]}>
					Some words can't type, Some voices glow {"\n"}
					No more filters, Let Ripply show !
				</Animated.Text>

				<Animated.View
					style={{ opacity: waveAnim, width: "100%", marginBottom: 30 }}
				>
					<AudioWaveform
						color="#6B2FBC"
						secondaryColor="#9D7BC7"
						height={60}
						barCount={36}
					/>
				</Animated.View>

				<Animated.View
					style={[styles.authButtonsContainer, { opacity: buttonAnim }]}
				>
					<View style={styles.buttonRow}>
						<AnimatedButton
							text="Log In"
							onPress={onShowLoginModal}
							primary={false}
							icon="log-in"
							style={styles.authButton as ViewStyle} // Cast for safety, ensure AnimatedButton accepts this
							textStyle={styles.loginButtonText as TextStyle}
						/>
						<AnimatedButton
							text="Sign Up"
							onPress={onShowSignupModal}
							primary={true}
							icon="user-plus"
							style={styles.authButton as ViewStyle}
							textStyle={styles.signupButtonText as TextStyle}
						/>
					</View>

					<View style={styles.divider}>
						<View style={styles.dividerLine} />
						<Text style={styles.dividerText}>or continue with</Text>
						<View style={styles.dividerLine} />
					</View>

					<View style={styles.socialButtonsRow}>
						<SocialAuthButton
							onPress={onGoogleSignIn}
							icon={<GoogleIcon size={24} />}
							style={styles.iconButton as ViewStyle} // Cast for safety
							isLoading={isAuthLoading} // Pass loading state
						/>
						<SocialAuthButton
							onPress={onAppleSignIn}
							icon={<AppleIcon size={24} />}
							style={styles.iconButton as ViewStyle} // Cast for safety
							isLoading={isAuthLoading} // Pass loading state
						/>
					</View>
				</Animated.View>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	heroSection: {
		width: "100%",
		minHeight: Platform.OS === "web" ? height - 100 : height - 150, // Adjusted minHeight for web vs native
		justifyContent: "center",
		alignItems: "center",
		paddingTop: 60, // From original
		paddingHorizontal: 20, // From original
		// backgroundColor: 'rgba(255,0,0,0.1)', // For debugging layout
	},
	heroContent: {
		width: "100%",
		maxWidth: 800, // From original
		alignItems: "center",
		// opacity: fadeAnim, // This was part of Animated.View style prop directly
		// transform: [{ translateY: slideAnim }], // This was part of Animated.View style prop directly
	},
	logoContainer: {
		marginBottom: 20,
		alignItems: "center",
	},
	logo: {
		width: 120,
		height: 120,
	},
	heroTitle: {
		fontSize: width < 380 ? 32 : 48,
		fontFamily: Platform.OS === "ios" ? "Palatino" : "sans-serif",
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 16,
		textAlign: "center",
		...(Platform.OS === "web"
			? {
					textShadow: "0px 2px 10px rgba(138, 79, 209, 0.6)",
			  }
			: {
					textShadowColor: "rgba(138, 79, 209, 0.6)",
					textShadowOffset: { width: 0, height: 2 },
					textShadowRadius: 10,
			  }),
		letterSpacing: 1,
		// opacity: titleAnim, // This was part of Animated.Text style prop directly
	},
	heroSubtitle: {
		fontSize: 16,
		color: "#E0D1FF",
		textAlign: "center",
		fontWeight: "500",
		marginBottom: 30,
		maxWidth: 600,
		// opacity: subtitleAnim, // This was part of Animated.Text style prop directly
	},
	authButtonsContainer: {
		width: "100%",
		maxWidth: 500,
		alignSelf: "center",
		alignItems: "center",
		// opacity: buttonAnim, // This was part of Animated.View style prop directly
	},
	buttonRow: {
		flexDirection: "row",
		width: "80%", // From original
		justifyContent: "center",
		marginBottom: 16,
		alignItems: "center",
		paddingHorizontal: 0,
		alignSelf: "center",
		gap: 20,
	},
	authButton: {
		// This style is for the AnimatedButton component's container
		// width: "45%", // Managed by flex in buttonRow with gap
		height: 56,
		minWidth: 130,
		marginHorizontal: 0, // Reset if AnimatedButton has its own margins
		flex: 1, // Allows buttons to grow equally
		// maxWidth: "45%", // Not needed with flex:1 and gap
		// Specific styling for login/signup is better applied directly or via primary prop logic in AnimatedButton
	},
	loginButtonText: {
		// Example: if AnimatedButton takes textStyle prop
		// color: '#D4C1EC', // Example if primary=false means outlined with this text color
	},
	signupButtonText: {
		// color: '#FFFFFF', // Example if primary=true means filled with this text color
	},
	divider: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 16,
		width: "100%", // From original
		maxWidth: 350, // Added to constrain divider line width a bit
		alignSelf: "center",
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
	socialButtonsRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		marginBottom: 16,
		gap: 20,
	},
	iconButton: {
		// Style for SocialAuthButton container
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
});

export default HeroSection;
