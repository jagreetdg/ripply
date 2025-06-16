import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ErrorMessageProps {
	message: string;
	visible: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
	message,
	visible,
}) => {
	if (!visible || !message) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Feather name="alert-circle" size={16} color="#e74c3c" />
			<Text style={styles.text}>{message}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fdeaea",
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
	},
	text: {
		color: "#e74c3c",
		marginLeft: 8,
		fontSize: 14,
		flex: 1,
	},
});
