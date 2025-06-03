import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons"; // Import Feather
import { features } from "../../constants/landingPageData";

const { width } = Dimensions.get("window");

const FeaturesSection = () => {
	return (
		<View style={styles.sectionContainer}>
			<Text style={styles.sectionTitle}>Discover What Sets Us Apart</Text>
			<View style={styles.featuresGrid}>
				{features.map((feature, index) => (
					<View key={index} style={styles.featureCard}>
						<Feather
							name={feature.icon as any}
							size={32}
							color="#AD5EFF"
							style={styles.featureIcon}
						/>
						<Text style={styles.featureTitle}>{feature.title}</Text>
						<Text style={styles.featureDescription}>{feature.description}</Text>
					</View>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	sectionContainer: {
		width: "100%",
		paddingVertical: 40, // Was 40
		paddingHorizontal: 20,
		alignItems: "center",
		// backgroundColor: 'rgba(255, 255, 255, 0.03)', // Subtle background for the section
		marginTop: 20, // Add some space above the section
		marginBottom: 20, // Add some space below the section
	},
	sectionTitle: {
		fontSize: width > 768 ? 36 : 28, // Responsive font size
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 40, // Increased margin
		textAlign: "center",
	},
	featuresGrid: {
		// Renamed from featuresContainer for clarity, matching original logic
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center", // Center cards in the grid
		alignItems: "flex-start", // Align cards to the top of their row
		width: "100%",
		maxWidth: 1100, // Max width for the grid
	},
	featureCard: {
		backgroundColor: "rgba(255, 255, 255, 0.05)", // Card background
		borderRadius: 12,
		padding: 20,
		margin: 10, // Margin around each card
		alignItems: "center", // Center content like icon and title
		width: width > 992 ? "30%" : width > 768 ? "45%" : "90%", // Responsive width: 3 per row on large, 2 on tablet, 1 on mobile
		maxWidth: 340, // Max width for a card
		minHeight: 220, // Minimum height to ensure some uniformity
		shadowColor: "#000", // Adding some shadow for depth (optional, more prominent on lighter themes)
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3, // For Android shadow
	},
	featureIcon: {
		marginBottom: 15,
	},
	featureTitle: {
		fontSize: 18, // Was 18
		fontWeight: "600", // Semi-bold
		color: "#FFFFFF",
		textAlign: "center",
		marginBottom: 8,
	},
	featureDescription: {
		fontSize: 14,
		color: "#E0E0E0", // Lighter text for description
		textAlign: "center",
		lineHeight: 20, // Improved readability
	},
});

export default FeaturesSection;
