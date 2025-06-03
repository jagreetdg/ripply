import React from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

const BackgroundRippleEffect = () => {
	return (
		<View style={styles.backgroundAnimations}>
			<View style={styles.rippleContainer}>
				<View style={[styles.ripple, styles.ripple1]} />
				<View style={[styles.ripple, styles.ripple2]} />
				<View style={[styles.ripple, styles.ripple3]} />
				<View style={[styles.ripple, styles.ripple4]} />
			</View>
			<View style={styles.rippleContainer2}>
				<View style={[styles.ripple, styles.ripple5]} />
				<View style={[styles.ripple, styles.ripple6]} />
				<View style={[styles.ripple, styles.ripple7]} />
				<View style={[styles.ripple, styles.ripple8]} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	backgroundAnimations: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 0, // Ensure it's behind other content
	},
	rippleContainer: {
		position: "absolute",
		width: width * 0.9,
		height: width * 0.9,
		top: height * 0.05,
		left: -width * 0.4,
		opacity: Platform.OS === "web" ? 0.3 : 0.5, // Adjusted for web
		justifyContent: "center",
		alignItems: "center",
	},
	rippleContainer2: {
		position: "absolute",
		width: width * 0.7,
		height: width * 0.7,
		bottom: height * 0.1,
		right: -width * 0.3,
		opacity: Platform.OS === "web" ? 0.3 : 0.5, // Adjusted for web
		justifyContent: "center",
		alignItems: "center",
	},
	ripple: {
		position: "absolute",
		borderWidth: 2,
		borderColor: "rgba(107, 47, 188, 0.5)", // Base ripple color
		borderRadius: 1000, // Large value to ensure circular shape
	},
	// Specific ripple styles for variation
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
});

export default BackgroundRippleEffect;
