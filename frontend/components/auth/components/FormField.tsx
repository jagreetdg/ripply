import React from "react";
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	Pressable,
	ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface FormFieldProps {
	label: string;
	placeholder: string;
	value: string;
	onChangeText: (text: string) => void;
	error?: string;
	icon: string;
	secureTextEntry?: boolean;
	showPassword?: boolean;
	onTogglePassword?: () => void;
	isLoading?: boolean;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
	keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export const FormField: React.FC<FormFieldProps> = ({
	label,
	placeholder,
	value,
	onChangeText,
	error,
	icon,
	secureTextEntry = false,
	showPassword = false,
	onTogglePassword,
	isLoading = false,
	autoCapitalize = "none",
	keyboardType = "default",
}) => {
	const hasError = Boolean(error);

	return (
		<View style={styles.container}>
			<Text style={styles.label}>{label}</Text>
			<View style={[styles.inputWrapper, hasError && styles.inputError]}>
				<Feather
					name={icon as any}
					size={20}
					color={hasError ? "#e74c3c" : "#999"}
					style={styles.inputIcon}
				/>
				<TextInput
					style={styles.input}
					placeholder={placeholder}
					placeholderTextColor="#999"
					value={value}
					onChangeText={onChangeText}
					secureTextEntry={secureTextEntry}
					autoCapitalize={autoCapitalize}
					keyboardType={keyboardType}
					autoCorrect={false}
				/>
				{isLoading && (
					<ActivityIndicator
						size="small"
						color="#6B2FBC"
						style={styles.loadingIndicator}
					/>
				)}
				{secureTextEntry && onTogglePassword && (
					<Pressable onPress={onTogglePassword} style={styles.passwordToggle}>
						<Feather
							name={showPassword ? "eye-off" : "eye"}
							size={20}
							color="#999"
						/>
					</Pressable>
				)}
			</View>
			{error && <Text style={styles.errorText}>{error}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E1E1E1",
		borderRadius: 12,
		paddingHorizontal: 16,
		backgroundColor: "#F9F9F9",
	},
	inputError: {
		borderColor: "#e74c3c",
		backgroundColor: "#fdeaea",
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		height: 50,
		fontSize: 16,
		color: "#333",
	},
	loadingIndicator: {
		marginRight: 8,
	},
	passwordToggle: {
		padding: 8,
	},
	errorText: {
		color: "#e74c3c",
		fontSize: 12,
		marginTop: 4,
		marginLeft: 4,
	},
});
