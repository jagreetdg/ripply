import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
// import TestimonialCard from './TestimonialCard'; // Assuming TestimonialCard component exists
import { testimonials } from "../../constants/landingPageData"; // Adjusted path

const { width } = Dimensions.get("window");

const TestimonialsSection = () => {
	// This section is currently not rendered in the main LandingPage.
	// If you want to render it, uncomment its usage in app/index.tsx and ensure TestimonialCard component is implemented.
	return (
		<View style={styles.sectionContainer}>
			<Text style={styles.sectionTitle}>What Our Users Say</Text>{" "}
			{/* Example Title */}
			<View style={styles.testimonialsContainer}>
				{/* {testimonials.map((testimonial, index) => (
                    <TestimonialCard 
                        key={index}
                        quote={testimonial.quote}
                        name={testimonial.name}
                        role={testimonial.role}
                        style={styles.testimonialCard}
                    />
                ))} */}
				<Text style={{ color: "white" }}>
					Testimonials would be listed here.
				</Text>
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
		// backgroundColor: 'rgba(0,0,255,0.1)', // For layout debugging
	},
	sectionTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 30,
		textAlign: "center",
	},
	testimonialsContainer: {
		flexDirection: width > 768 ? "row" : "column",
		flexWrap: "wrap",
		justifyContent: "center",
		alignItems: "center", // Changed from flex-start to center if cards are centered
		width: "100%",
		maxWidth: 1000, // From original styles
	},
	testimonialCard: {
		// Style for individual TestimonialCard container if passed as prop
		marginBottom: 24,
		width: width > 768 ? "30%" : "100%", // From original styles
		maxWidth: 320, // From original styles
		marginHorizontal: width > 768 ? 10 : 0, // Add some horizontal spacing for row layout
	},
	// Add other styles from the original StyleSheet that were for testimonials here
});

export default TestimonialsSection;
