import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthType } from "../types";
import { useTheme } from "../../../context/ThemeContext";

interface AuthHeaderProps {
	type: AuthType;
	onClose: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ type, onClose }) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.header, { borderBottomColor: colors.border }]}>
			<View style={styles.headerContent}>
				<Text style={[styles.title, { color: colors.text }]}>
					{type === "login" ? "Welcome Back" : "Create Account"}
				</Text>
				<TouchableOpacity onPress={onClose} style={styles.closeButton}>
					<Feather name="x" size={24} color={colors.text} />
				</TouchableOpacity>
			</View>
			<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
				{type === "login"
					? "Sign in to your account"
					: "Join the Ripply community"}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 16,
		borderBottomWidth: 1,
	},
	headerContent: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
	},
	subtitle: {
		fontSize: 16,
	},
	closeButton: {
		padding: 4,
	},
});
