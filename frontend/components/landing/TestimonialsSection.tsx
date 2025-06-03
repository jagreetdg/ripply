import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	ScrollView,
	Image,
} from "react-native";
// import TestimonialCard from './TestimonialCard'; // Assuming TestimonialCard component exists
import { testimonials } from "../../constants/landingPageData"; // Adjusted path

const { width } = Dimensions.get("window");

const TestimonialsSection = () => {
	// This section is currently not rendered in the main LandingPage.
	// If you want to render it, uncomment its usage in app/index.tsx and ensure TestimonialCard component is implemented.
	return (
		<View style={styles.sectionContainer}>
			<Text style={styles.sectionTitle}>Loved by Users Worldwide</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.testimonialsContentContainer}
			>
				{testimonials.map((testimonial, index) => (
					<View key={index} style={styles.testimonialCard}>
						<Image
							source={{ uri: testimonial.avatar }}
							style={styles.testimonialAvatar}
						/>
						<Text
							style={styles.testimonialText}
						>{`"${testimonial.quote}"`}</Text>
						<Text style={styles.testimonialName}>{testimonial.name}</Text>
						<Text style={styles.testimonialRole}>{testimonial.role}</Text>
					</View>
				))}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	sectionContainer: {
		width: "100%",
		paddingVertical: 40,
		// paddingHorizontal: 20, // Horizontal padding will be on the ScrollView content
		alignItems: "center",
		// backgroundColor: 'rgba(255, 255, 255, 0.03)', // Optional: subtle background for the section
		marginTop: 20,
		marginBottom: 30,
	},
	sectionTitle: {
		fontSize: width > 768 ? 36 : 28,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 40,
		textAlign: "center",
		paddingHorizontal: 20, // Add padding here if sectionContainer doesn't have it
	},
	testimonialsContentContainer: {
		// For ScrollView
		flexDirection: "row",
		paddingHorizontal: 20, // Padding for the first and last items
		alignItems: "stretch", // Make cards of same height if content varies
	},
	testimonialCard: {
		backgroundColor: "rgba(255, 255, 255, 0.07)", // Slightly different card background
		borderRadius: 12,
		padding: 25,
		marginHorizontal: 10, // Space between cards
		width: width * 0.8, // Each card takes up 80% of screen width
		maxWidth: 320, // Max width for a card, similar to features
		minHeight: 250, // Min height to give some space
		justifyContent: "space-between", // Distribute space within card
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	testimonialAvatar: {
		width: 70,
		height: 70,
		borderRadius: 35,
		marginBottom: 15,
		borderWidth: 2,
		borderColor: "#AD5EFF",
	},
	testimonialText: {
		fontSize: 15,
		color: "#E0E0E0",
		textAlign: "center",
		marginBottom: 15,
		fontStyle: "italic",
		lineHeight: 22,
	},
	testimonialName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFFFFF",
		marginBottom: 3,
	},
	testimonialRole: {
		fontSize: 13,
		color: "#AD5EFF", // Accent color for role
	},
	// Add other styles from the original StyleSheet that were for testimonials here
});

export default TestimonialsSection;
