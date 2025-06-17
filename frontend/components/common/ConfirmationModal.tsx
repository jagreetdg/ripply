import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	Pressable,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

interface ConfirmationModalProps {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	confirmButtonColor?: string;
	isDestructive?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	icon?: keyof typeof Feather.glyphMap;
}

export function ConfirmationModal({
	visible,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	confirmButtonColor,
	isDestructive = false,
	onConfirm,
	onCancel,
	icon,
}: ConfirmationModalProps) {
	const { colors, isDarkMode } = useTheme();

	const defaultConfirmColor = isDestructive ? "#ff4757" : colors.tint;
	const finalConfirmColor = confirmButtonColor || defaultConfirmColor;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
		>
			{/* Backdrop */}
			<Pressable style={styles.backdrop} onPress={onCancel}>
				<View style={styles.backdropOverlay} />
			</Pressable>

			{/* Modal Container */}
			<View style={styles.container}>
				<View
					style={[
						styles.modal,
						{
							backgroundColor: colors.card,
							borderColor: colors.border,
						},
					]}
				>
					{/* Header with Icon */}
					{icon && (
						<View style={styles.iconContainer}>
							<View
								style={[
									styles.iconCircle,
									{
										backgroundColor: isDestructive
											? "#ff475720"
											: `${colors.tint}20`,
									},
								]}
							>
								<Feather
									name={icon}
									size={24}
									color={isDestructive ? "#ff4757" : colors.tint}
								/>
							</View>
						</View>
					)}

					{/* Title */}
					<Text style={[styles.title, { color: colors.text }]}>{title}</Text>

					{/* Message */}
					<Text style={[styles.message, { color: colors.textSecondary }]}>
						{message}
					</Text>

					{/* Buttons */}
					<View style={styles.buttonContainer}>
						{/* Cancel Button */}
						<TouchableOpacity
							style={[
								styles.button,
								styles.cancelButton,
								{
									backgroundColor: colors.background,
									borderColor: colors.border,
								},
							]}
							onPress={onCancel}
							activeOpacity={0.7}
						>
							<Text style={[styles.cancelButtonText, { color: colors.text }]}>
								{cancelText}
							</Text>
						</TouchableOpacity>

						{/* Confirm Button */}
						<TouchableOpacity
							style={[
								styles.button,
								styles.confirmButton,
								{ backgroundColor: finalConfirmColor },
							]}
							onPress={onConfirm}
							activeOpacity={0.8}
						>
								<Text style={styles.confirmButtonText}>{confirmText}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 9999,
	},
	backdropOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		zIndex: 9999,
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
		zIndex: 10000,
	},
	modal: {
		width: "100%",
		maxWidth: 400,
		borderRadius: 16,
		padding: 24,
		borderWidth: 1,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.25,
		shadowRadius: 16,
		elevation: 8,
	},
	iconContainer: {
		alignItems: "center",
		marginBottom: 16,
	},
	iconCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		textAlign: "center",
		marginBottom: 8,
	},
	message: {
		fontSize: 16,
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 24,
	},
	buttonContainer: {
		flexDirection: "row",
		gap: 12,
	},
	button: {
		flex: 1,
		height: 48,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	cancelButton: {
		borderWidth: 1,
	},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: "500",
	},
	confirmButton: {
		justifyContent: "center",
		alignItems: "center",
	},
	confirmButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
