import React, { useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { AuthType } from "../types";
import { useTheme } from "../../../context/ThemeContext";
import { useAuthForm } from "../hooks/useAuthForm";
import { ValidationIndicator } from "./ValidationIndicator";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface AuthFormProps {
	type: AuthType;
	onAuth: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onAuth }) => {
	const { colors } = useTheme();
	const {
		formData,
		updateField,
		isLoading,
		error,
		showPassword,
		setShowPassword,
		showConfirmPassword,
		setShowConfirmPassword,
		focusState,
		updateFocus,
		passwordStrength,
		validationState,
		checkUsername,
		checkEmail,
		handleAuth,
		isAuthButtonDisabled,
		scrollViewRef,
	} = useAuthForm(type);

	// Debounced validation checks
	useEffect(() => {
		if (type === "signup" && formData.username) {
			const timer = setTimeout(() => {
				checkUsername(formData.username);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [formData.username, type, checkUsername]);

	useEffect(() => {
		if (formData.email) {
			const timer = setTimeout(() => {
				checkEmail(formData.email);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [formData.email, checkEmail]);

	const handleSubmit = () => {
		handleAuth();
		onAuth();
	};

	return (
		<ScrollView
			ref={scrollViewRef}
			style={styles.container}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.formContent}>
				{/* Error Message */}
				{error ? (
					<View style={[styles.errorContainer, { backgroundColor: "#FFEBEE" }]}>
						<Feather
							name="alert-circle"
							size={16}
							color={colors.error || "#F44336"}
						/>
						<Text
							style={[styles.errorText, { color: colors.error || "#F44336" }]}
						>
							{error}
						</Text>
					</View>
				) : null}

				{/* Username Field (Signup only) */}
				{type === "signup" && (
					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>Username</Text>
						<View style={styles.inputWrapper}>
							<TextInput
								style={[
									styles.input,
									{
										backgroundColor: colors.card,
										borderColor: focusState.username
											? colors.tint
											: colors.border,
										color: colors.text,
									},
								]}
								value={formData.username}
								onChangeText={(text) => updateField("username", text)}
								onFocus={() => updateFocus("username", true)}
								onBlur={() => updateFocus("username", false)}
								placeholder="Enter your username"
								placeholderTextColor={colors.textSecondary}
								autoCapitalize="none"
								autoCorrect={false}
								editable={!isLoading}
							/>
							<View style={styles.inputIcon}>
								<ValidationIndicator
									isChecking={validationState.isCheckingUsername}
									isValid={validationState.usernameAvailable}
								/>
							</View>
						</View>
					</View>
				)}

				{/* Email Field */}
				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Email</Text>
					<View style={styles.inputWrapper}>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.card,
									borderColor: focusState.email ? colors.tint : colors.border,
									color: colors.text,
								},
							]}
							value={formData.email}
							onChangeText={(text) => updateField("email", text)}
							onFocus={() => updateFocus("email", true)}
							onBlur={() => updateFocus("email", false)}
							placeholder="Enter your email"
							placeholderTextColor={colors.textSecondary}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isLoading}
						/>
						{type === "signup" && (
							<View style={styles.inputIcon}>
								<ValidationIndicator
									isChecking={validationState.isCheckingEmail}
									isValid={validationState.emailAvailable}
								/>
							</View>
						)}
					</View>
				</View>

				{/* Password Field */}
				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Password</Text>
					<View style={styles.inputWrapper}>
						<TextInput
							style={[
								styles.input,
								styles.passwordInput,
								{
									backgroundColor: colors.card,
									borderColor: focusState.password
										? colors.tint
										: colors.border,
									color: colors.text,
								},
							]}
							value={formData.password}
							onChangeText={(text) => updateField("password", text)}
							onFocus={() => updateFocus("password", true)}
							onBlur={() => updateFocus("password", false)}
							placeholder="Enter your password"
							placeholderTextColor={colors.textSecondary}
							secureTextEntry={!showPassword}
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isLoading}
						/>
						<TouchableOpacity
							style={styles.passwordToggle}
							onPress={() => setShowPassword(!showPassword)}
						>
							<Feather
								name={showPassword ? "eye-off" : "eye"}
								size={20}
								color={colors.textSecondary}
							/>
						</TouchableOpacity>
					</View>
					{type === "signup" && (
						<PasswordStrengthIndicator
							strength={passwordStrength}
							password={formData.password}
						/>
					)}
				</View>

				{/* Confirm Password Field (Signup only) */}
				{type === "signup" && (
					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Confirm Password
						</Text>
						<View style={styles.inputWrapper}>
							<TextInput
								style={[
									styles.input,
									styles.passwordInput,
									{
										backgroundColor: colors.card,
										borderColor: focusState.confirmPassword
											? colors.tint
											: colors.border,
										color: colors.text,
									},
								]}
								value={formData.confirmPassword}
								onChangeText={(text) => updateField("confirmPassword", text)}
								onFocus={() => updateFocus("confirmPassword", true)}
								onBlur={() => updateFocus("confirmPassword", false)}
								placeholder="Confirm your password"
								placeholderTextColor={colors.textSecondary}
								secureTextEntry={!showConfirmPassword}
								autoCapitalize="none"
								autoCorrect={false}
								editable={!isLoading}
							/>
							<TouchableOpacity
								style={styles.passwordToggle}
								onPress={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								<Feather
									name={showConfirmPassword ? "eye-off" : "eye"}
									size={20}
									color={colors.textSecondary}
								/>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Submit Button */}
				<TouchableOpacity
					style={[
						styles.submitButton,
						{
							backgroundColor: isAuthButtonDisabled() ? "#CCCCCC" : colors.tint,
						},
					]}
					onPress={handleSubmit}
					disabled={isAuthButtonDisabled()}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="white" />
					) : (
						<Text style={styles.submitButtonText}>
							{type === "login" ? "Sign In" : "Create Account"}
						</Text>
					)}
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	formContent: {
		padding: 24,
	},
	errorContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
		gap: 8,
	},
	errorText: {
		fontSize: 14,
		flex: 1,
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	inputWrapper: {
		position: "relative",
	},
	input: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		paddingRight: 50,
	},
	passwordInput: {
		paddingRight: 50,
	},
	inputIcon: {
		position: "absolute",
		right: 16,
		top: 14,
	},
	passwordToggle: {
		position: "absolute",
		right: 16,
		top: 14,
		padding: 4,
	},
	submitButton: {
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 8,
	},
	submitButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
});
