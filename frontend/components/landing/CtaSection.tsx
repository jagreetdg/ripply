import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
// import AnimatedButton from './AnimatedButton'; // Assuming AnimatedButton component exists

const { width } = Dimensions.get("window");

interface CtaSectionProps {
	// onCtaAction?: () => void; // Example if you had a CTA button
}

const CtaSection: React.FC<CtaSectionProps> = ({}) => {
	// This section is currently not rendered in the main LandingPage.
	// If you want to render it, uncomment its usage in app/index.tsx.
	return (
		<View style={styles.ctaSection}>
			<View style={styles.ctaContainer}>
				<Text style={styles.ctaTitle}>Ready to Make Some Waves?</Text>{" "}
				{/* Example Title */}
				<Text style={styles.ctaSubtitle}>
					Join Ripply today and let your voice be heard.
				</Text>
				{/* <View style={styles.ctaButtonContainer}>
                    <AnimatedButton 
                        text="Get Started Now"
                        onPress={() => {if(onCtaAction) onCtaAction()}}
                        primary={true}
                        style={styles.ctaButton}
                    />
                </View> */}
				<Text style={{ color: "white" }}>CTA would be here.</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	ctaSection: {
		width: "100%",
		paddingVertical: 60,
		paddingHorizontal: 20,
		alignItems: "center",
		// backgroundColor: 'rgba(255,255,0,0.1)', // For layout debugging
	},
	ctaContainer: {
		width: "100%",
		maxWidth: 800,
		borderRadius: 20,
		padding: 40,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		backgroundColor: "rgba(40, 20, 70, 0.5)", // Added a subtle background for distinction
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
		// Add any specific styling for the CTA button if AnimatedButton needs it
	},
});

export default CtaSection;
