import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { AuthHeaderProps } from "../types";

export const AuthHeader: React.FC<AuthHeaderProps> = ({ type, onClose }) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.header, { borderBottomColor: colors.border }]}>
			<Text style={[styles.title, { color: colors.text }]}>
				{type === "login" ? "Welcome Back" : "Create Account"}
			</Text>
			<TouchableOpacity onPress={onClose} style={styles.closeButton}>
				<Feather name="x" size={24} color={colors.text} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
	},
	closeButton: {
		padding: 4,
	},
});
