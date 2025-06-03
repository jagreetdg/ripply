import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
// import AnimatedButton from './AnimatedButton'; // Assuming AnimatedButton component exists

const { width } = Dimensions.get("window");

interface CtaSectionProps {
	onSignupPress: () => void;
	// onCtaAction?: () => void; // Example if you had a CTA button
}

const CtaSection: React.FC<CtaSectionProps> = ({ onSignupPress }) => {
	// This section is currently not rendered in the main LandingPage.
	// If you want to render it, uncomment its usage in app/index.tsx.
	return (
		<View style={styles.ctaSectionContainer}>
			<LinearGradient
				colors={["#6B2FBC", "#4B2A89"]}
				style={styles.ctaGradientContainer}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			>
				<Text style={styles.ctaTitle}>Ready to Make Some Waves?</Text>
				<Text style={styles.ctaSubtitle}>
					Join Ripply today and let your voice be heard across the digital
					ocean.
				</Text>
				<TouchableOpacity style={styles.ctaButton} onPress={onSignupPress}>
					<Text style={styles.ctaButtonText}>Get Started Now</Text>
					<Feather
						name="arrow-right-circle"
						size={22}
						color="#FFF"
						style={{ marginLeft: 8 }}
					/>
				</TouchableOpacity>
			</LinearGradient>
		</View>
	);
};

const styles = StyleSheet.create({
	ctaSectionContainer: {
		width: "100%",
		paddingVertical: 60,
		paddingHorizontal: 20,
		alignItems: "center",
		marginTop: 30,
		marginBottom: 50,
	},
	ctaGradientContainer: {
		width: "100%",
		maxWidth: 850,
		borderRadius: 20,
		paddingVertical: 40,
		paddingHorizontal: 30,
		alignItems: "center",
		shadowColor: "#6B2FBC",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 8,
	},
	ctaTitle: {
		fontSize: width > 768 ? 34 : 28,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 15,
		textAlign: "center",
	},
	ctaSubtitle: {
		fontSize: width > 768 ? 18 : 16,
		color: "#E0D1FF",
		textAlign: "center",
		marginBottom: 30,
		lineHeight: 24,
		maxWidth: 600,
	},
	ctaButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#AD5EFF",
		paddingVertical: 15,
		paddingHorizontal: 30,
		borderRadius: 30,
		shadowColor: "#AD5EFF",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 6,
	},
	ctaButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
	},
});

export default CtaSection;
