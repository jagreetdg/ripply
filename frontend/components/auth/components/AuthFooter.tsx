import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { AuthFooterProps } from "../types";

export const AuthFooter: React.FC<AuthFooterProps> = ({
	type,
	onSwitchToLogin,
	onSwitchToSignup,
}) => {
	const { colors } = useTheme();

	const handleSwitch = () => {
		if (type === "login" && onSwitchToSignup) {
			onSwitchToSignup();
		} else if (type === "signup" && onSwitchToLogin) {
			onSwitchToLogin();
		}
	};

	return (
		<View style={styles.footer}>
			<Text style={[styles.switchText, { color: colors.textSecondary }]}>
				{type === "login"
					? "Don't have an account? "
					: "Already have an account? "}
			</Text>
			<TouchableOpacity onPress={handleSwitch}>
				<Text style={[styles.switchButton, { color: colors.primary }]}>
					{type === "login" ? "Sign Up" : "Sign In"}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	switchText: {
		fontSize: 14,
	},
	switchButton: {
		fontSize: 14,
		fontWeight: "600",
	},
});
