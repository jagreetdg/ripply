import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthType } from "../types";
import { useTheme } from "../../../context/ThemeContext";

interface AuthFooterProps {
	type: AuthType;
	onSwitchToLogin?: () => void;
	onSwitchToSignup?: () => void;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({
	type,
	onSwitchToLogin,
	onSwitchToSignup,
}) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.footer, { borderTopColor: colors.border }]}>
			<Text style={[styles.footerText, { color: colors.textSecondary }]}>
				{type === "login"
					? "Don't have an account?"
					: "Already have an account?"}
			</Text>
			<TouchableOpacity
				onPress={type === "login" ? onSwitchToSignup : onSwitchToLogin}
				style={styles.switchButton}
			>
				<Text style={[styles.switchButtonText, { color: colors.tint }]}>
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
		paddingVertical: 20,
		paddingHorizontal: 24,
		borderTopWidth: 1,
		gap: 8,
	},
	footerText: {
		fontSize: 16,
	},
	switchButton: {
		padding: 4,
	},
	switchButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
});
