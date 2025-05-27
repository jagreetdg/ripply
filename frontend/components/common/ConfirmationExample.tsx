import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
	useConfirmation,
	confirmationPresets,
} from "../../hooks/useConfirmation";
import { useTheme } from "../../context/ThemeContext";

// Example component showing how to use the confirmation modal
export function ConfirmationExample() {
	const { colors } = useTheme();
	const { showConfirmation, ConfirmationComponent } = useConfirmation();

	const handleDeleteExample = async () => {
		// Using a preset
		const confirmed = await showConfirmation(
			confirmationPresets.delete("this item")
		);

		if (confirmed) {
			console.log("Item deleted!");
		}
	};

	const handleLogoutExample = async () => {
		// Using another preset
		const confirmed = await showConfirmation(confirmationPresets.logout());

		if (confirmed) {
			console.log("User logged out!");
		}
	};

	const handleCustomExample = async () => {
		// Custom confirmation
		const confirmed = await showConfirmation({
			title: "Custom Action",
			message: "This is a custom confirmation dialog with custom styling.",
			confirmText: "Do It",
			cancelText: "Nope",
			confirmButtonColor: "#10b981",
			icon: "star",
		});

		if (confirmed) {
			console.log("Custom action confirmed!");
		}
	};

	return (
		<>
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<Text style={[styles.title, { color: colors.text }]}>
					Confirmation Modal Examples
				</Text>

				<TouchableOpacity
					style={[styles.button, { backgroundColor: colors.tint }]}
					onPress={handleDeleteExample}
				>
					<Text style={styles.buttonText}>Delete Item (Preset)</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, { backgroundColor: colors.tint }]}
					onPress={handleLogoutExample}
				>
					<Text style={styles.buttonText}>Logout (Preset)</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.button, { backgroundColor: colors.tint }]}
					onPress={handleCustomExample}
				>
					<Text style={styles.buttonText}>Custom Confirmation</Text>
				</TouchableOpacity>
			</View>

			{/* This is all you need to add to use confirmations! */}
			<ConfirmationComponent />
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		gap: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		marginBottom: 16,
	},
	button: {
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "500",
	},
});
