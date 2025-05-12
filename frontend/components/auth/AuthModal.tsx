import React, { useState, useRef, useEffect } from "react";
import {
	StyleSheet,
	View,
	Modal,
	Pressable,
	Text,
	TextInput,
	Dimensions,
	Platform,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
	loginUser,
	registerUser,
	checkUsernameAvailability,
	checkEmailAvailability,
} from "../../services/api/authService";
import { useUser } from "../../context/UserContext";

type AuthModalProps = {
	isVisible: boolean;
	onClose: () => void;
	type: "login" | "signup";
	onSwitchToLogin?: () => void;
	onSwitchToSignup?: () => void;
};

// Define interfaces for API responses
interface AvailabilityResponse {
	available: boolean;
	message?: string;
}

interface User {
	id: string;
	username: string;
	email: string;
	display_name?: string;
	avatar_url?: string | null;
	bio?: string | null;
	is_verified?: boolean;
	created_at: string;
	updated_at: string;
	[key: string]: any; // For any other properties
}

interface AuthResponse {
	user: User;
	token: string;
	message?: string;
}

export default function AuthModal({
	isVisible,
	onClose,
	type,
	onSwitchToLogin,
	onSwitchToSignup,
}: AuthModalProps) {
	const router = useRouter();
	const { setUser } = useUser();
	const scrollViewRef = useRef<ScrollView>(null);
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [passwordStrength, setPasswordStrength] = useState<
		"weak" | "medium" | "strong" | null
	>(null);
	const [rememberMe, setRememberMe] = useState(false);

	// Focus states for input fields
	const [usernameIsFocused, setUsernameIsFocused] = useState(false);
	const [emailIsFocused, setEmailIsFocused] = useState(false);
	const [passwordIsFocused, setPasswordIsFocused] = useState(false);
	const [confirmPasswordIsFocused, setConfirmPasswordIsFocused] =
		useState(false);

	// Validation states
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
		null
	);
	const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [isCheckingEmail, setIsCheckingEmail] = useState(false);

	// Validate username format
	const isValidUsername = (username: string): boolean => {
		// Username must be at least 5 characters and only contain alphanumeric characters and underscores
		const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
		return usernameRegex.test(username);
	};

	// Check username availability
	const checkUsername = async (value: string) => {
		if (!value) return;

		// First check if username format is valid
		if (!isValidUsername(value)) {
			setUsernameAvailable(false);
			return;
		}

		try {
			setIsCheckingUsername(true);
			const response = (await checkUsernameAvailability(
				value
			)) as AvailabilityResponse;
			setUsernameAvailable(response.available);
		} catch (err) {
			console.error("Error checking username:", err);
			setUsernameAvailable(null);
		} finally {
			setIsCheckingUsername(false);
		}
	};

	// Check email availability
	const checkEmail = async (value: string) => {
		if (!value) return;

		// First check if email format is valid
		if (!isValidEmail(value)) {
			setEmailAvailable(false);
			return;
		}

		try {
			setIsCheckingEmail(true);
			const response = (await checkEmailAvailability(
				value
			)) as AvailabilityResponse;
			setEmailAvailable(response.available);
		} catch (err) {
			console.error("Error checking email:", err);
			setEmailAvailable(null);
		} finally {
			setIsCheckingEmail(false);
		}
	};

	// Validation functions
	const isValidEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const checkPasswordStrength = (
		password: string
	): "weak" | "medium" | "strong" => {
		// Password must be at least 8 characters
		if (password.length < 8) return "weak";

		// Check for complexity
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumbers = /\d/.test(password);
		const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':",.<>/?]/.test(password);

		const complexity = [
			hasUpperCase,
			hasLowerCase,
			hasNumbers,
			hasSpecialChars,
		].filter(Boolean).length;

		if (complexity >= 3 && password.length >= 10) return "strong";
		if (complexity >= 2 && password.length >= 8) return "medium";
		return "weak";
	};

	// Handle password change with strength check
	const handlePasswordChange = (value: string) => {
		setPassword(value);
		clearError();

		if (value) {
			// Only check password strength on signup screen
			if (type === "signup") {
				setPasswordStrength(checkPasswordStrength(value));
			}
		} else {
			setPasswordStrength(null);
		}
	};

	// Function to scroll to top of modal
	const scrollToTop = () => {
		if (scrollViewRef.current) {
			scrollViewRef.current.scrollTo({ y: 0, animated: true });
		}
	};

	const handleAuth = async () => {
		if (type === "login") {
			if (!email || !password) {
				setError("Please enter both email and password");
				scrollToTop();
				return;
			}
			// For login, we don't do any static checks - just attempt the login
		} else {
			if (!username || !email || !password || !confirmPassword) {
				setError("Please fill in all fields");
				scrollToTop();
				return;
			}

			if (password !== confirmPassword) {
				setError("Passwords do not match");
				scrollToTop();
				return;
			}

			if (usernameAvailable === false) {
				setError("Username is already taken");
				scrollToTop();
				return;
			}

			if (emailAvailable === false) {
				setError("Email is already registered");
				scrollToTop();
				return;
			}

			if (!isValidEmail(email)) {
				setError("Invalid email format");
				scrollToTop();
				return;
			}

			if (passwordStrength === "weak") {
				setError("Password is too weak");
				scrollToTop();
				return;
			}
		}

		setError("");
		setIsLoading(true);

		try {
			if (type === "login") {
				// Call the login API
				const response = (await loginUser({
					email,
					password,
					rememberMe,
				})) as AuthResponse;

				// Check if login was successful
				if (response && response.token && response.user) {
					console.log("Login successful through modal");

					// Update the user context
					setUser({
						id: response.user.id,
						username: response.user.username,
						email: response.user.email,
						display_name: response.user.display_name || response.user.username,
						avatar_url: response.user.avatar_url || null,
						bio: response.user.bio || null,
						is_verified: response.user.is_verified || false,
						created_at: response.user.created_at,
						updated_at: response.user.updated_at,
					});

					// Close modal and redirect to home page
					handleClose();
					router.replace("/(tabs)/home");
				} else {
					setError("Authentication failed. Please check your credentials.");
				}
			} else {
				// Call the register API
				const response = (await registerUser({
					username,
					email,
					password,
					displayName: username, // Use username as display name by default
				})) as AuthResponse;

				// Check if registration was successful
				if (response && response.token && response.user) {
					console.log("Registration successful through modal");

					// Update the user context
					setUser({
						id: response.user.id,
						username: response.user.username,
						email: response.user.email,
						display_name: response.user.display_name || response.user.username,
						avatar_url: response.user.avatar_url || null,
						bio: response.user.bio || null,
						is_verified: response.user.is_verified || false,
						created_at: response.user.created_at,
						updated_at: response.user.updated_at,
					});

					// Close modal and redirect to home page
					handleClose();
					router.replace("/(tabs)/home");
				} else {
					setError("Registration failed. Please try again.");
				}
			}
		} catch (err) {
			console.error("Auth error:", err);
			// Display user-friendly error message
			const error = err as Error;

			if (error.message && error.message.includes("401")) {
				setError(
					"Invalid email or password. Please check your credentials and try again."
				);
			} else if (error.message && error.message.includes("404")) {
				setError(
					"User not found. Please check your email or register for a new account."
				);
			} else if (error.message && error.message.includes("409")) {
				if (type === "signup") {
					setError("Username or email already exists. Please try another.");
				} else {
					setError("Authentication failed. Please try again.");
				}
			} else if (error.message && error.message.includes("CORS")) {
				setError("Network error. Please try again later.");
			} else if (error.message && error.message.includes("fetch")) {
				setError(
					"Cannot connect to server. Please check your internet connection."
				);
			} else {
				setError(
					type === "login"
						? "Login failed. Invalid email or password."
						: "Registration failed. Please try again later."
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setUsername("");
		setEmail("");
		setPassword("");
		setConfirmPassword("");
		setError("");
		setIsLoading(false);
		setUsernameAvailable(null);
		setEmailAvailable(null);
		setPasswordStrength(null);
	};

	// Clear error when input changes
	const clearError = () => {
		if (error) {
			setError("");
		}
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	// State for password match validation
	const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

	// Check password match whenever either password field changes
	useEffect(() => {
		if (type === "signup" && password && confirmPassword) {
			setPasswordsMatch(password === confirmPassword);
		} else {
			setPasswordsMatch(null);
		}
	}, [password, confirmPassword, type]);

	// Memoized value for auth button disabled state
	const [signupButtonDisabled, setSignupButtonDisabled] = useState(false);
	const [loginButtonDisabled, setLoginButtonDisabled] = useState(false);

	// Update auth buttons disabled state whenever relevant fields change
	useEffect(() => {
		// Handle signup button state
		if (type === "signup") {
			const hasValidationErrors =
				usernameAvailable === false ||
				emailAvailable === false ||
				(!isValidEmail(email) && email.length > 0) ||
				passwordsMatch === false ||
				(passwordStrength === "weak" && password.length >= 8) ||
				(username.length > 0 && username.length < 5);

			const hasEmptyRequiredFields =
				!username || !email || !password || !confirmPassword;

			setSignupButtonDisabled(
				isLoading || hasValidationErrors || hasEmptyRequiredFields
			);
		} else {
			setSignupButtonDisabled(false);
		}

		// Handle login button state
		if (type === "login") {
			const hasValidationErrors = !isValidEmail(email) && email.length > 0;

			const hasEmptyRequiredFields = !email || !password;

			setLoginButtonDisabled(
				isLoading || hasValidationErrors || hasEmptyRequiredFields
			);
		} else {
			setLoginButtonDisabled(false);
		}
	}, [
		type,
		isLoading,
		usernameAvailable,
		emailAvailable,
		email,
		password,
		confirmPassword,
		passwordsMatch,
		passwordStrength,
		username,
	]);

	// Check if auth button should be disabled
	const isAuthButtonDisabled = () => {
		return type === "signup" ? signupButtonDisabled : loginButtonDisabled;
	};

	// Social auth handlers
	const handleGoogleAuth = () => {
		console.log("Google auth initiated");
		// TODO: Implement Google authentication
	};

	const handleAppleAuth = () => {
		console.log("Apple auth initiated");
		// TODO: Implement Apple authentication
	};

	const handleFacebookAuth = () => {
		console.log("Facebook auth initiated");
		// TODO: Implement Facebook authentication
	};

	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={isVisible}
			onRequestClose={handleClose}
		>
			<Pressable style={styles.overlay} onPress={handleClose}>
				<Pressable
					style={styles.modalContent}
					onPress={(e) => e.stopPropagation()}
				>
					<View style={styles.header}>
						<Text style={styles.title}>
							{type === "login" ? "Log In" : "Create Account"}
						</Text>
						<Pressable onPress={handleClose} style={styles.closeButton}>
							<Feather name="x" size={24} color="#666" />
						</Pressable>
					</View>

					<ScrollView
						ref={scrollViewRef}
						style={styles.scrollView}
						contentContainerStyle={styles.scrollViewContent}
					>
						{error ? (
							<View style={styles.errorContainer}>
								<Feather name="alert-circle" size={18} color="#e74c3c" />
								<Text style={styles.errorText}>{error}</Text>
							</View>
						) : null}

						{type === "signup" && (
							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Username</Text>
								<View
									style={[
										styles.inputWrapper,
										usernameIsFocused && styles.inputWrapperFocused,
									]}
								>
									<Feather
										name="user"
										size={20}
										color={usernameIsFocused ? "#6B2FBC" : "#999"}
										style={styles.inputIcon}
									/>
									<TextInput
										style={[styles.input, webStyles]}
										placeholder="Choose a username"
										placeholderTextColor="#999"
										autoCapitalize="none"
										value={username}
										onChangeText={(text) => {
											setUsername(text);
											setUsernameAvailable(null);
											clearError();
										}}
										onFocus={() => setUsernameIsFocused(true)}
										onBlur={() => {
											setUsernameIsFocused(false);
											// Validate username on blur
											if (username.length > 0) {
												if (username.length < 5) {
													setUsernameAvailable(false);
												} else if (!isValidUsername(username)) {
													setUsernameAvailable(false);
												} else {
													checkUsername(username);
												}
											}
										}}
										blurOnSubmit
										textContentType="username"
									/>
								</View>
								{isCheckingUsername ? (
									<ActivityIndicator
										size="small"
										color="#6B2FBC"
										style={styles.checkingIndicator}
									/>
								) : usernameAvailable === false ? (
									<Text style={styles.unavailableText}>
										{!isValidUsername(username) && username.length > 0
											? username.length < 5
												? "Username must be at least 5 characters"
												: "Username can only contain letters, numbers, and underscores"
											: "Username is already taken"}
									</Text>
								) : null}
							</View>
						)}

						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>Email</Text>
							<View
								style={[
									styles.inputWrapper,
									emailIsFocused && styles.inputWrapperFocused,
								]}
							>
								<Feather
									name="mail"
									size={20}
									color={emailIsFocused ? "#6B2FBC" : "#999"}
									style={styles.inputIcon}
								/>
								<TextInput
									style={[styles.input, webStyles]}
									placeholder="Enter your email"
									placeholderTextColor="#999"
									keyboardType="email-address"
									autoCapitalize="none"
									value={email}
									onChangeText={(text) => {
										setEmail(text);
										setEmailAvailable(null);
										clearError();
									}}
									onFocus={() => setEmailIsFocused(true)}
									onBlur={() => {
										setEmailIsFocused(false);
										// Validate email on blur
										if (email.length > 0) {
											if (!isValidEmail(email)) {
												setEmailAvailable(false);
											} else {
												checkEmail(email);
											}
										}
									}}
									textContentType="emailAddress"
								/>
							</View>
							{isCheckingEmail ? (
								<ActivityIndicator
									size="small"
									color="#6B2FBC"
									style={styles.checkingIndicator}
								/>
							) : emailAvailable === false ? (
								<Text style={styles.unavailableText}>
									{!isValidEmail(email) && email.length > 0
										? "Please enter a valid email address"
										: "Email is already registered"}
								</Text>
							) : null}
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>Password</Text>
							<View
								style={[
									styles.inputWrapper,
									passwordIsFocused && styles.inputWrapperFocused,
								]}
							>
								<Feather
									name="lock"
									size={20}
									color={passwordIsFocused ? "#6B2FBC" : "#999"}
									style={styles.inputIcon}
								/>
								<TextInput
									style={[styles.input, webStyles]}
									placeholder={
										type === "login"
											? "Enter your password"
											: "Create a password"
									}
									placeholderTextColor="#999"
									secureTextEntry={!showPassword}
									value={password}
									onChangeText={handlePasswordChange}
									onFocus={() => setPasswordIsFocused(true)}
									onBlur={() => setPasswordIsFocused(false)}
									textContentType="password"
								/>
								<Pressable
									onPress={() => setShowPassword(!showPassword)}
									style={styles.passwordToggle}
								>
									<Feather
										name={showPassword ? "eye-off" : "eye"}
										size={20}
										color={passwordIsFocused ? "#6B2FBC" : "#999"}
									/>
								</Pressable>
							</View>
							{type === "signup" &&
								password.length > 0 &&
								(passwordStrength === "weak" ? (
									<Text style={styles.unavailableText}>
										{password.length < 8
											? "Password must be at least 8 characters"
											: "Password is too weak"}
									</Text>
								) : passwordStrength === "medium" ? (
									<Text style={styles.warningText}>
										Password is medium strength
									</Text>
								) : passwordStrength === "strong" ? (
									<Text style={styles.availableText}>Password is strong</Text>
								) : null)}
						</View>

						{type === "signup" && (
							<View style={styles.inputContainer}>
								<Text style={styles.inputLabel}>Confirm Password</Text>
								<View
									style={[
										styles.inputWrapper,
										confirmPasswordIsFocused && styles.inputWrapperFocused,
									]}
								>
									<Feather
										name="lock"
										size={20}
										color={confirmPasswordIsFocused ? "#6B2FBC" : "#999"}
										style={styles.inputIcon}
									/>
									<TextInput
										style={[styles.input, webStyles]}
										placeholder="Confirm your password"
										placeholderTextColor="#999"
										secureTextEntry={!showConfirmPassword}
										value={confirmPassword}
										onChangeText={(text) => {
											setConfirmPassword(text);
											clearError();
										}}
										onFocus={() => setConfirmPasswordIsFocused(true)}
										onBlur={() => setConfirmPasswordIsFocused(false)}
										textContentType="password"
									/>
									<Pressable
										onPress={() => setShowConfirmPassword(!showConfirmPassword)}
										style={styles.passwordToggle}
									>
										<Feather
											name={showConfirmPassword ? "eye-off" : "eye"}
											size={20}
											color={confirmPasswordIsFocused ? "#6B2FBC" : "#999"}
										/>
									</Pressable>
								</View>
								{confirmPassword.length > 0 && passwordsMatch === false && (
									<Text style={styles.unavailableText}>
										Passwords do not match
									</Text>
								)}
							</View>
						)}

						{type === "login" && (
							<Pressable style={styles.forgotPasswordButton}>
								<Text style={styles.forgotPasswordText}>Forgot Password?</Text>
							</Pressable>
						)}

						{type === "login" && (
							<View style={styles.inputContainer}>
								<Pressable
									style={styles.rememberMeContainer}
									onPress={() => setRememberMe(!rememberMe)}
								>
									<Feather
										name={rememberMe ? "check-square" : "square"}
										size={20}
										color={rememberMe ? "#6B2FBC" : "#999"}
										style={{ marginRight: 8 }}
									/>
									<Text style={styles.rememberMeText}>Remember Me</Text>
								</Pressable>
							</View>
						)}

						<View style={styles.termsText}>
							<Text style={styles.termsText}>
								By signing up, you agree to our{" "}
								<Text style={styles.termsLink}>Terms of Service</Text> and{" "}
								<Text style={styles.termsLink}>Privacy Policy</Text>
							</Text>
						</View>

						<Pressable
							style={[
								styles.authButton,
								isAuthButtonDisabled() && styles.authButtonDisabled,
							]}
							onPress={handleAuth}
							disabled={isAuthButtonDisabled()}
						>
							{isLoading ? (
								<Text style={styles.authButtonText}>
									{type === "login" ? "Logging in..." : "Creating account..."}
								</Text>
							) : (
								<Text style={styles.authButtonText}>
									{type === "login" ? "Log In" : "Create Account"}
								</Text>
							)}
						</Pressable>

						<View style={styles.divider}>
							<View style={styles.dividerLine} />
							<Text style={styles.dividerText}>OR</Text>
							<View style={styles.dividerLine} />
						</View>

						<View style={styles.switchContainer}>
							<Text style={styles.switchText}>
								{type === "login"
									? "Don't have an account?"
									: "Already have an account?"}
							</Text>
							<Pressable
								onPress={() => {
									resetForm();
									onClose();
									// Switch to the other modal
									if (type === "login" && onSwitchToSignup) {
										onSwitchToSignup();
									} else if (type === "signup" && onSwitchToLogin) {
										onSwitchToLogin();
									}
								}}
							>
								<Text style={styles.switchLink}>
									{type === "login" ? "Sign Up" : "Log In"}
								</Text>
							</Pressable>
						</View>
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const { width } = Dimensions.get("window");
const modalWidth = Math.min(width - 40, 400);

// Create a web-specific style object for input outlines
const webStyles = Platform.select({
	web: {
		outlineWidth: 0,
		outlineColor: "transparent",
		outlineStyle: "none",
	},
	default: {},
});

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: modalWidth,
		maxHeight: "90%",
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 15,
		elevation: 10,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
	},
	closeButton: {
		padding: 4,
	},
	errorContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fdeaea",
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	errorText: {
		color: "#e74c3c",
		marginLeft: 8,
		fontSize: 14,
	},
	inputContainer: {
		marginBottom: 16,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
		marginBottom: 6,
	},
	inputWrapper: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E1E1E1",
		borderRadius: 8,
		paddingLeft: 16,
		paddingRight: 12,
		backgroundColor: "#F9F9F9",
		overflow: "hidden",
	},
	inputWrapperFocused: {
		borderColor: "#6B2FBC",
		borderWidth: 2,
		paddingLeft: 15,
		paddingRight: 11,
		shadowColor: "#6B2FBC",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 3,
	},
	inputIcon: {
		marginRight: 16,
	},
	input: {
		flex: 1,
		height: 44,
		fontSize: 16,
		color: "#333",
		paddingLeft: 8,
		paddingRight: 8,
	},
	passwordToggle: {
		padding: 8,
		marginRight: -4,
	},
	forgotPasswordButton: {
		alignSelf: "flex-end",
		marginBottom: 16,
	},
	forgotPasswordText: {
		color: "#6B2FBC",
		fontSize: 14,
		fontWeight: "500",
	},
	termsText: {
		fontSize: 12,
		color: "#666",
		marginBottom: 16,
		textAlign: "center",
	},
	termsLink: {
		color: "#6B2FBC",
		fontWeight: "500",
	},
	authButton: {
		backgroundColor: "#6B2FBC",
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: "center",
		marginBottom: 16,
		shadowColor: "#6B2FBC",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
	},
	authButtonDisabled: {
		backgroundColor: "#9D7BC7",
	},
	authButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	divider: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: "#E1E1E1",
	},
	dividerText: {
		paddingHorizontal: 12,
		color: "#999",
		fontSize: 12,
	},
	switchContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	switchText: {
		fontSize: 14,
		color: "#666",
	},
	switchLink: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B2FBC",
		marginLeft: 4,
	},
	checkingIndicator: {
		marginTop: 4,
		alignSelf: "flex-start",
	},
	unavailableText: {
		fontSize: 12,
		color: "#e74c3c",
		marginTop: 4,
	},
	warningText: {
		fontSize: 12,
		color: "#FFC107",
		marginTop: 4,
	},
	availableText: {
		fontSize: 12,
		color: "#2ecc71",
		marginTop: 4,
	},
	rememberMeContainer: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "center", // Center align with the text below
	},
	rememberMeText: {
		fontSize: 14,
		color: "#333",
	},
	scrollView: {
		flex: 1,
		paddingRight: 10, // Add padding to prevent scrollbar from overlapping content
	},
	scrollViewContent: {
		paddingVertical: 16,
		paddingRight: 5, // Additional padding for content
	},
});
