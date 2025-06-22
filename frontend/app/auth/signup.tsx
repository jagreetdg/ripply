import React, { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	TextInput,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { useSignupValidation } from "../../components/auth/hooks/useSignupValidation";
import { useSignupSubmission } from "../../components/auth/hooks/useSignupSubmission";
import { FormField } from "../../components/auth/components/FormField";
import { ErrorMessage } from "../../components/auth/components/ErrorMessage";

export default function SignupScreen() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);

	// Custom hooks for form logic
	const {
		username,
		email,
		password,
		confirmPassword,
		displayName,
		usernameError,
		emailError,
		passwordError,
		confirmPasswordError,
		isCheckingUsername,
		isCheckingEmail,
		isUsernameValid,
		isEmailValid,
		setUsername,
		setEmail,
		setPassword,
		setConfirmPassword,
		setDisplayName,
		validateForm,
	} = useSignupValidation();

	const { isLoading, error, submitSignup } = useSignupSubmission();

	const handleSignup = async () => {
		const isFormValid = validateForm();
		await submitSignup(
			{ username, email, password, confirmPassword, displayName },
			isFormValid
		);
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
		>
			<StatusBar style="dark" />
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()} style={styles.backButton}>
						<Feather name="arrow-left" size={24} color="#333" />
					</Pressable>
					<Text style={styles.title}>Create Account</Text>
				</View>

				<View style={styles.formContainer}>
					{error ? (
						<View style={styles.errorContainer}>
							<Feather name="alert-circle" size={18} color="#e74c3c" />
							<Text style={styles.errorText}>{error}</Text>
						</View>
					) : null}

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Username</Text>
						<View
							style={[
								styles.inputWrapper,
								usernameError ? styles.inputError : null,
							]}
						>
							<Feather
								name="user"
								size={20}
								color={usernameError ? "#e74c3c" : "#999"}
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								placeholder="Choose a username"
								placeholderTextColor="#999"
								autoCapitalize="none"
								value={username}
								onChangeText={setUsername}
							/>
							{isCheckingUsername && (
								<ActivityIndicator
									size="small"
									color="#6B2FBC"
									style={{ marginRight: 8 }}
								/>
							)}
						</View>
						{usernameError ? (
							<Text style={styles.fieldErrorText}>{usernameError}</Text>
						) : null}
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Email</Text>
						<View
							style={[
								styles.inputWrapper,
								emailError ? styles.inputError : null,
							]}
						>
							<Feather
								name="mail"
								size={20}
								color={emailError ? "#e74c3c" : "#999"}
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								placeholder="Enter your email"
								placeholderTextColor="#999"
								keyboardType="email-address"
								autoCapitalize="none"
								value={email}
								onChangeText={setEmail}
								textContentType="emailAddress"
							/>
							{isCheckingEmail && (
								<ActivityIndicator
									size="small"
									color="#6B2FBC"
									style={{ marginRight: 8 }}
								/>
							)}
						</View>
						{emailError ? (
							<Text style={styles.fieldErrorText}>{emailError}</Text>
						) : null}
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Password</Text>
						<View
							style={[
								styles.inputWrapper,
								passwordError ? styles.inputError : null,
							]}
						>
							<Feather
								name="lock"
								size={20}
								color={passwordError ? "#e74c3c" : "#999"}
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								placeholder="Create a password (min. 8 characters)"
								placeholderTextColor="#999"
								secureTextEntry={!showPassword}
								value={password}
								onChangeText={setPassword}
								textContentType="newPassword"
							/>
							<Pressable
								onPress={() => setShowPassword(!showPassword)}
								style={styles.passwordToggle}
							>
								<Feather
									name={showPassword ? "eye-off" : "eye"}
									size={20}
									color="#999"
								/>
							</Pressable>
						</View>
						{passwordError ? (
							<Text style={styles.fieldErrorText}>{passwordError}</Text>
						) : null}
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Confirm Password</Text>
						<View
							style={[
								styles.inputWrapper,
								confirmPasswordError ? styles.inputError : null,
							]}
						>
							<Feather
								name="lock"
								size={20}
								color={confirmPasswordError ? "#e74c3c" : "#999"}
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								placeholder="Confirm your password"
								placeholderTextColor="#999"
								secureTextEntry={!showPassword}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
							/>
						</View>
						{confirmPasswordError ? (
							<Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
						) : null}
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Display Name (Optional)</Text>
						<View style={styles.inputWrapper}>
							<Feather
								name="user-check"
								size={20}
								color="#999"
								style={styles.inputIcon}
							/>
							<TextInput
								style={styles.input}
								placeholder="How you want to be called"
								placeholderTextColor="#999"
								value={displayName}
								onChangeText={setDisplayName}
							/>
						</View>
					</View>

					<Text style={styles.termsText}>
						By signing up, you agree to our{" "}
						<Text style={styles.termsLink}>Terms of Service</Text> and{" "}
						<Text style={styles.termsLink}>Privacy Policy</Text>
					</Text>

					<Pressable
						style={[
							styles.signupButton,
							isLoading ||
							isCheckingUsername ||
							isCheckingEmail ||
							!isUsernameValid ||
							!isEmailValid
								? styles.signupButtonDisabled
								: null,
						]}
						onPress={handleSignup}
						disabled={
							isLoading ||
							isCheckingUsername ||
							isCheckingEmail ||
							!isUsernameValid ||
							!isEmailValid
						}
					>
						{isLoading ? (
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<ActivityIndicator
									size="small"
									color="#fff"
									style={{ marginRight: 8 }}
								/>
								<Text style={styles.signupButtonText}>Creating Account...</Text>
							</View>
						) : (
							<Text style={styles.signupButtonText}>Create Account</Text>
						)}
					</Pressable>
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<Text style={styles.footerText}>Already have an account? </Text>
				<Link href="/auth/login" asChild>
					<Pressable>
						<Text style={styles.footerLink}>Log In</Text>
					</Pressable>
				</Link>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollContainer: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: Platform.OS === "ios" ? 60 : 40,
		paddingBottom: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 40,
	},
	backButton: {
		padding: 8,
		marginRight: 16,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#333",
	},
	formContainer: {
		width: "100%",
		maxWidth: 400,
		alignSelf: "center",
	},
	errorContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fdeaea",
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
	},
	errorText: {
		color: "#e74c3c",
		marginLeft: 8,
		fontSize: 14,
	},
	inputContainer: {
		marginBottom: 20,
	},
	inputLabel: {
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
	fieldErrorText: {
		color: "#e74c3c",
		fontSize: 12,
		marginTop: 4,
		marginLeft: 4,
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
	passwordToggle: {
		padding: 8,
	},
	termsText: {
		fontSize: 14,
		color: "#666",
		marginBottom: 24,
		textAlign: "center",
	},
	termsLink: {
		color: "#6B2FBC",
		fontWeight: "500",
	},
	signupButton: {
		backgroundColor: "#6B2FBC",
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 24,
		shadowColor: "#6B2FBC",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
	},
	signupButtonDisabled: {
		backgroundColor: "#9D7BC7",
	},
	signupButtonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 20,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
	},
	footerText: {
		fontSize: 14,
		color: "#666",
	},
	footerLink: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B2FBC",
	},
});
