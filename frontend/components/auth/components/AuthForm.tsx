import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { AuthFormProps } from "../types";

export const AuthForm: React.FC<AuthFormProps> = ({ type, onAuth }) => {
	const { colors } = useTheme();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async () => {
		if (!email || !password) return;
		if (type === "signup" && password !== confirmPassword) return;

		setIsLoading(true);

		// Simulate auth request
		setTimeout(() => {
			setIsLoading(false);
			onAuth();
		}, 1500);
	};

	const isValid =
		email && password && (type === "login" || password === confirmPassword);

	return (
		<View style={styles.container}>
			<View style={styles.inputContainer}>
				<Text style={[styles.label, { color: colors.text }]}>Email</Text>
				<TextInput
					style={[
						styles.input,
						{
							borderColor: colors.border,
							backgroundColor: colors.surface,
							color: colors.text,
						},
					]}
					value={email}
					onChangeText={setEmail}
					placeholder="Enter your email"
					placeholderTextColor={colors.textSecondary}
					keyboardType="email-address"
					autoCapitalize="none"
				/>
			</View>

			<View style={styles.inputContainer}>
				<Text style={[styles.label, { color: colors.text }]}>Password</Text>
				<View style={styles.passwordContainer}>
					<TextInput
						style={[
							styles.passwordInput,
							{
								borderColor: colors.border,
								backgroundColor: colors.surface,
								color: colors.text,
							},
						]}
						value={password}
						onChangeText={setPassword}
						placeholder="Enter your password"
						placeholderTextColor={colors.textSecondary}
						secureTextEntry={!showPassword}
					/>
					<TouchableOpacity
						onPress={() => setShowPassword(!showPassword)}
						style={styles.eyeButton}
					>
						<Feather
							name={showPassword ? "eye-off" : "eye"}
							size={20}
							color={colors.textSecondary}
						/>
					</TouchableOpacity>
				</View>
			</View>

			{type === "signup" && (
				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>
						Confirm Password
					</Text>
					<TextInput
						style={[
							styles.input,
							{
								borderColor: colors.border,
								backgroundColor: colors.surface,
								color: colors.text,
							},
						]}
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						placeholder="Confirm your password"
						placeholderTextColor={colors.textSecondary}
						secureTextEntry={true}
					/>
				</View>
			)}

			<TouchableOpacity
				style={[
					styles.submitButton,
					{
						backgroundColor: isValid ? colors.primary : colors.border,
						opacity: isValid ? 1 : 0.6,
					},
				]}
				onPress={handleSubmit}
				disabled={!isValid || isLoading}
			>
				{isLoading ? (
					<ActivityIndicator color="white" />
				) : (
					<Text style={styles.submitButtonText}>
						{type === "login" ? "Sign In" : "Create Account"}
					</Text>
				)}
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	passwordContainer: {
		position: "relative",
	},
	passwordInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		paddingRight: 40,
		fontSize: 16,
	},
	eyeButton: {
		position: "absolute",
		right: 12,
		top: 12,
	},
	submitButton: {
		borderRadius: 8,
		padding: 16,
		alignItems: "center",
		marginTop: 8,
	},
	submitButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
});
