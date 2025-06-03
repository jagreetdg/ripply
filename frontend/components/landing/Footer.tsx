import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Linking,
} from "react-native";

const Footer = () => {
	// TODO: Implement actual navigation or linking for these
	const handlePrivacy = () => Linking.openURL("#"); // Placeholder
	const handleTerms = () => Linking.openURL("#"); // Placeholder
	const handleContact = () => Linking.openURL("#"); // Placeholder

	return (
		<View style={styles.footer}>
			<View style={styles.footerLinks}>
				<TouchableOpacity onPress={handlePrivacy}>
					<Text style={styles.footerLink}>Privacy</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={handleTerms}>
					<Text style={styles.footerLink}>Terms</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={handleContact}>
					<Text style={styles.footerLink}>Contact</Text>
				</TouchableOpacity>
			</View>
			<Text style={styles.footerText}>
				© {new Date().getFullYear()} Ripply. All rights reserved.
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	footer: {
		// position: "absolute", // This will be handled by parent layout if needed
		// bottom: 0,
		// left: 0,
		// right: 0,
		paddingVertical: 16,
		alignItems: "center",
		backgroundColor: "rgba(26, 11, 46, 0.8)", // From original styles
		borderTopWidth: 1,
		borderTopColor: "rgba(255, 255, 255, 0.1)", // From original styles
		width: "100%", // Ensure it takes full width if not absolutely positioned
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

export default Footer;
