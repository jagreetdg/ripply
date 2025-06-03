import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
// import { Feather } from '@expo/vector-icons'; // Import if you use icons directly here
// import FeatureCard from './FeatureCard'; // Assuming FeatureCard component exists
import { features } from "../../constants/landingPageData"; // Adjusted path

const { width } = Dimensions.get("window");

const FeaturesSection = () => {
	// This section is currently not rendered in the main LandingPage as per comments in original file.
	// If you want to render it, uncomment its usage in app/index.tsx and ensure FeatureCard component is implemented.
	return (
		<View style={styles.sectionContainer}>
			<Text style={styles.sectionTitle}>Features</Text> {/* Example Title */}
			<View style={styles.featuresContainer}>
				{/* {features.map((feature, index) => (
                    <FeatureCard 
                        key={index}
                        icon={feature.icon} 
                        title={feature.title}
                        description={feature.description}
                        color={feature.color}
                        style={styles.featureCard} 
                    />
                ))} */}
				<Text style={{ color: "white" }}>Features would be listed here.</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	sectionContainer: {
		width: "100%",
		paddingVertical: 40,
		paddingHorizontal: 20,
		alignItems: "center",
		// backgroundColor: 'rgba(0,255,0,0.1)', // For layout debugging
	},
	sectionTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 30,
		textAlign: "center",
	},
	featuresContainer: {
		flexDirection: width > 768 ? "row" : "column",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center", // Changed from flex-start to center if cards are centered
		width: "100%",
		maxWidth: 1000, // From original styles
	},
	featureCard: {
		// Style for individual FeatureCard container if passed as prop
		marginBottom: 24,
		width: width > 768 ? "30%" : "100%", // From original styles
		maxWidth: 320, // From original styles
		marginHorizontal: width > 768 ? 10 : 0, // Add some horizontal spacing for row layout
	},
	// Add other styles from the original StyleSheet that were for features here
	// For example, if FeatureCard itself had specific styles defined in the main sheet.
});

export default FeaturesSection;
