import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import * as ImagePicker from "expo-image-picker";
import { updateUserProfile } from "../../services/api/userService";
import { checkUsernameAvailability } from "../../services/api/authService";
import DefaultAvatar from "../../components/DefaultAvatar";
import { useTheme } from "../../context/ThemeContext";

export default function EditProfileScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { user, refreshUser } = useUser();
	const { colors, isDarkMode } = useTheme();

	const [displayName, setDisplayName] = useState("");
	const [bio, setBio] = useState("");
	const [username, setUsername] = useState("");
	const [originalUsername, setOriginalUsername] = useState("");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [usernameError, setUsernameError] = useState("");
	const [isImageHovered, setIsImageHovered] = useState(false);
	const [isUsernameValid, setIsUsernameValid] = useState(true);
	const [isUsernameEdited, setIsUsernameEdited] = useState(false);

	// Initialize form with user data
	useEffect(() => {
		if (user) {
			setDisplayName(user.display_name || "");
			setBio(user.bio || "");
			setUsername(user.username || "");
			setOriginalUsername(user.username || "");
			setAvatarUrl(user.avatar_url);
		}
	}, [user]);

	// Validate username with debounce
	useEffect(() => {
		// Skip validation if username hasn't changed
		if (username === originalUsername) {
			setUsernameError("");
			setIsUsernameEdited(false);
			setIsUsernameValid(true);
			return;
		}

		// Mark as edited when username changes
		setIsUsernameEdited(true);

		// Assume invalid until proven otherwise
		setIsUsernameValid(false);

		// Clear previous errors
		setUsernameError("");

		if (!username) {
			setUsernameError("Username cannot be empty");
			return;
		}

		// Basic validation
		if (username.length < 3) {
			setUsernameError("Username must be at least 3 characters");
			return;
		}

		// Check if username contains only allowed characters
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			setUsernameError(
				"Username can only contain letters, numbers, and underscores"
			);
			return;
		}

		// Debounce the API call
		const timer = setTimeout(async () => {
			if (username.length >= 3) {
				setIsCheckingUsername(true);
				try {
					const response = await checkUsernameAvailability(username);
					if (response && !response.available) {
						setUsernameError("Username is already taken");
					} else {
						// Set as valid only if backend confirms availability
						setIsUsernameValid(true);
					}
				} catch (error) {
					console.error("Error checking username:", error);
					setUsernameError("Error checking username availability");
				} finally {
					setIsCheckingUsername(false);
				}
			}
		}, 500); // 500ms debounce

		return () => clearTimeout(timer);
	}, [username, originalUsername]);

	// Handle profile image selection
	const handleSelectImage = async () => {
		try {
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permissionResult.granted) {
				Alert.alert(
					"Permission Required",
					"You need to grant permission to access your photos"
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setAvatarUrl(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error selecting image:", error);
			Alert.alert("Error", "Failed to select image");
		}
	};

	// Handle form submission
	const handleSave = async () => {
		if (!user) return;

		if (!displayName.trim()) {
			Alert.alert("Error", "Display name cannot be empty");
			return;
		}

		// Validate username
		if (usernameError || !username.trim()) {
			Alert.alert("Error", usernameError || "Username cannot be empty");
			return;
		}

		setIsLoading(true);

		try {
			// Prepare the data to update
			const userData = {
				display_name: displayName.trim(),
				bio: bio.trim(),
				// Include username if it changed
				...(username !== originalUsername && { username: username.trim() }),
				// Only include avatar if it changed
				...(avatarUrl !== user.avatar_url && { avatar_url: avatarUrl }),
			};

			// Call API to update profile
			const result = await updateUserProfile(user.id, userData);

			if (result.success) {
				// Refresh user data
				await refreshUser();
				Alert.alert("Success", "Profile updated successfully", [
					{ text: "OK", onPress: () => router.back() },
				]);
			} else {
				Alert.alert("Error", "Failed to update profile");
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			Alert.alert("Error", "An error occurred while updating your profile");
		} finally {
			setIsLoading(false);
		}
	};

	// Determine if save button should be disabled
	const isSaveDisabled =
		isLoading ||
		!!usernameError ||
		isCheckingUsername ||
		(isUsernameEdited && !isUsernameValid);

	// If no user is logged in, redirect to login
	if (!user) {
		router.replace("/auth/login");
		return null;
	}

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<View style={[styles.header, { paddingTop: insets.top }]}>
				<View style={styles.headerContent}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Feather name="arrow-left" size={24} color="#333" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Edit Profile</Text>
					<TouchableOpacity
						onPress={handleSave}
						style={[
							styles.saveButton,
							{ backgroundColor: colors.tint },
							isSaveDisabled && styles.disabledButton,
						]}
						disabled={isSaveDisabled}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text style={{ color: colors.card, fontWeight: "bold" }}>
								Save
							</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView style={styles.content}>
				<View style={styles.avatarSection}>
					<TouchableOpacity
						onPress={handleSelectImage}
						style={styles.avatarContainer}
						onMouseEnter={() => setIsImageHovered(true)}
						onMouseLeave={() => setIsImageHovered(false)}
					>
						{avatarUrl ? (
							<Image source={{ uri: avatarUrl }} style={styles.avatar} />
						) : (
							<DefaultAvatar size={100} />
						)}
						<View
							style={[
								styles.editOverlay,
								Platform.OS === "web" && { opacity: isImageHovered ? 1 : 0 },
								{
									backgroundColor: isDarkMode
										? "rgba(0, 0, 0, 0.7)"
										: "rgba(0, 0, 0, 0.5)",
								},
							]}
						>
							<Feather name="edit-2" size={20} color="#fff" />
						</View>
					</TouchableOpacity>
				</View>

				<View style={styles.formSection}>
					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Display Name</Text>
						<TextInput
							style={[styles.input, { borderColor: colors.border }]}
							value={displayName}
							onChangeText={setDisplayName}
							placeholder="Your display name"
							placeholderTextColor="#999"
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Username</Text>
						<View style={styles.usernameInputContainer}>
							<TextInput
								style={[styles.input, { borderColor: colors.border }]}
								value={username}
								onChangeText={setUsername}
								placeholder={originalUsername}
								placeholderTextColor="#999"
							/>
							{isCheckingUsername && (
								<ActivityIndicator
									style={[
										styles.usernameIndicator,
										{ borderColor: colors.tint },
									]}
									size="small"
									color={colors.tint}
								/>
							)}
							{isUsernameEdited && isUsernameValid && !isCheckingUsername && (
								<View
									style={[
										styles.validIndicator,
										{ backgroundColor: colors.success },
									]}
								>
									<Feather name="check" size={16} color={colors.success} />
								</View>
							)}
						</View>
						{usernameError ? (
							<Text style={[styles.errorText, { color: colors.error }]}>
								{usernameError}
							</Text>
						) : (
							<Text style={[styles.helperText, { color: colors.helper }]}>
								Choose a unique username
							</Text>
						)}
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.inputLabel}>Bio</Text>
						<TextInput
							style={[
								styles.input,
								styles.bioInput,
								{ borderColor: colors.border },
							]}
							value={bio}
							onChangeText={setBio}
							placeholder="Tell us about yourself"
							placeholderTextColor="#999"
							multiline
							maxLength={160}
						/>
						<Text style={[styles.charCount, { color: colors.helper }]}>
							{bio.length}/160
						</Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		height: 60,
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
	},
	saveButton: {
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 24,
	},
	disabledButton: {
		backgroundColor: "#A990D1",
	},
	content: {
		flex: 1,
	},
	avatarSection: {
		alignItems: "center",
		paddingVertical: 24,
	},
	avatarContainer: {
		position: "relative",
		width: 100,
		height: 100,
		borderRadius: 50,
		overflow: "hidden",
	},
	avatar: {
		width: "100%",
		height: "100%",
	},
	editOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		opacity: Platform.OS === "web" ? 0 : 1, // Only hidden on web by default
	},
	formSection: {
		paddingHorizontal: 16,
		paddingBottom: 40,
	},
	inputContainer: {
		marginBottom: 20,
		borderRadius: 8,
	},
	usernameInputContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	usernameIndicator: {
		position: "absolute",
		right: 12,
	},
	validIndicator: {
		position: "absolute",
		right: 12,
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
		marginBottom: 8,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: "#333",
	},
	disabledInput: {
		backgroundColor: "#f0f0f0",
		color: "#999",
	},
	bioInput: {
		height: 100,
		textAlignVertical: "top",
	},
	helperText: {
		fontSize: 12,
		color: "#999",
		marginTop: 4,
	},
	errorText: {
		fontSize: 12,
		color: "#FF3B30",
		marginTop: 4,
	},
	charCount: {
		fontSize: 12,
		color: "#999",
		textAlign: "right",
		marginTop: 4,
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		opacity: Platform.OS === "web" ? 0 : 1, // Only hidden on web by default
	},
});

// This hover effect is now handled with React state
