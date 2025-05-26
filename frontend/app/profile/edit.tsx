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
	Animated,
	ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { updateUserProfile } from "../../services/api/userService";
import { checkUsernameAvailability } from "../../services/api/authService";
import DefaultAvatar from "../../components/DefaultAvatar";
import { LinearGradient } from "expo-linear-gradient";
import { getDefaultCoverPhoto } from "../../utils/defaultImages";

// Define response types to fix TypeScript errors
interface UsernameAvailabilityResponse {
	available: boolean;
}

interface UpdateProfileResponse {
	success: boolean;
}

// Extended user type to include cover_photo_url
interface ExtendedUser {
	cover_photo_url?: string | null;
}

// Create a custom hover component for web
const HoverableView = ({
	children,
	onHoverIn,
	onHoverOut,
	style,
	...props
}: any) => {
	// Only add hover styles on web platform
	if (Platform.OS === "web") {
		return (
			<View
				style={[style, { position: "relative" }]}
				onMouseEnter={onHoverIn}
				onMouseLeave={onHoverOut}
				{...props}
			>
				{children}
			</View>
		);
	}

	// Return regular view for mobile platforms
	return (
		<View style={style} {...props}>
			{children}
		</View>
	);
};

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
	const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [usernameError, setUsernameError] = useState("");
	const [isImageHovered, setIsImageHovered] = useState(false);
	const [isCoverHovered, setIsCoverHovered] = useState(false);
	const [isUsernameValid, setIsUsernameValid] = useState(true);
	const [isUsernameEdited, setIsUsernameEdited] = useState(false);

	// Animation values
	const [fadeAnim] = useState(new Animated.Value(0));
	const [scaleAnim] = useState(new Animated.Value(0.95));

	// Initialize form with user data
	useEffect(() => {
		if (user) {
			setDisplayName(user.display_name || "");
			setBio(user.bio || "");
			setUsername(user.username || "");
			setOriginalUsername(user.username || "");
			setAvatarUrl(user.avatar_url);
			// Safely access cover_photo_url which might not be in the User type
			setCoverPhotoUrl(
				(user as unknown as ExtendedUser).cover_photo_url || null
			);

			// Start entrance animation
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [user]);

	// Validate username with debounce
	useEffect(() => {
		// Skip validation if username hasn\'t changed
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
					const response = (await checkUsernameAvailability(
						username
					)) as UsernameAvailabilityResponse;
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

	// Handle cover photo selection
	const handleSelectCoverPhoto = async () => {
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
				aspect: [3, 1], // Cover photo aspect ratio
				quality: 0.8,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setCoverPhotoUrl(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Error selecting cover photo:", error);
			Alert.alert("Error", "Failed to select cover photo");
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
				// Only include cover photo if it changed
				...(coverPhotoUrl !==
					(user as unknown as ExtendedUser).cover_photo_url && {
					cover_photo_url: coverPhotoUrl,
				}),
			};

			// Call API to update profile
			const result = (await updateUserProfile(
				user.id,
				userData
			)) as UpdateProfileResponse;

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
			<View
				style={[
					styles.header,
					{
						paddingTop: insets.top,
						backgroundColor: colors.background,
						borderBottomColor: colors.border,
					},
				]}
			>
				<View style={styles.headerContent}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Feather name="arrow-left" size={24} color={colors.text} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: colors.text }]}>
						Edit Profile
					</Text>
					<TouchableOpacity
						onPress={handleSave}
						style={[styles.saveButton, isSaveDisabled && styles.disabledButton]}
						disabled={isSaveDisabled}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text style={styles.saveButtonText}>Save</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView style={styles.content}>
				<Animated.View
					style={{
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],
					}}
				>
					{/* Cover Photo Section */}
					<View style={styles.coverPhotoSection}>
						<HoverableView
							style={styles.coverPhotoContainer}
							onHoverIn={() => setIsCoverHovered(true)}
							onHoverOut={() => setIsCoverHovered(false)}
						>
							<TouchableOpacity
								onPress={handleSelectCoverPhoto}
								style={styles.coverPhotoTouchable}
								activeOpacity={0.8}
							>
								{coverPhotoUrl ? (
									<ImageBackground
										source={{ uri: coverPhotoUrl }}
										style={styles.coverPhoto}
										resizeMode="cover"
									>
										<View
											style={[
												styles.coverEditOverlay,
												{ opacity: isCoverHovered ? 1 : 0.7 },
											]}
										>
											<LinearGradient
												colors={["transparent", "rgba(0,0,0,0.7)"]}
												style={styles.coverGradient}
											>
												<View style={styles.coverEditButton}>
													<Feather name="edit-2" size={16} color="#fff" />
												</View>
											</LinearGradient>
										</View>
									</ImageBackground>
								) : (
									<View
										style={[
											styles.coverPhoto,
											{
												backgroundColor: `${colors.tint}20`,
												justifyContent: "center",
												alignItems: "center",
											},
										]}
									>
										<View
											style={[
												styles.coverEditOverlay,
												{ opacity: isCoverHovered ? 1 : 0.7 },
											]}
										>
											<LinearGradient
												colors={["transparent", "rgba(0,0,0,0.5)"]}
												style={styles.coverGradient}
											>
												<View style={styles.coverEditButton}>
													<Feather name="plus" size={16} color="#fff" />
													<Text style={styles.coverEditText}>
														Add Cover Photo
													</Text>
												</View>
											</LinearGradient>
										</View>
									</View>
								)}
							</TouchableOpacity>
						</HoverableView>
					</View>

					<View style={styles.avatarSection}>
						<HoverableView
							style={styles.avatarContainer}
							onHoverIn={() => setIsImageHovered(true)}
							onHoverOut={() => setIsImageHovered(false)}
						>
							<TouchableOpacity
								onPress={handleSelectImage}
								style={styles.avatarTouchable}
								activeOpacity={0.8}
							>
								{avatarUrl ? (
									<Image source={{ uri: avatarUrl }} style={styles.avatar} />
								) : (
									<DefaultAvatar size={100} userId={user.id || ""} />
								)}
								<View
									style={[
										styles.editOverlay,
										{
											opacity: isImageHovered
												? 1
												: Platform.OS === "web"
												? 0
												: 0.8,
										},
									]}
								>
									<LinearGradient
										colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
										style={styles.editGradient}
									>
										<Feather name="edit-2" size={20} color="#fff" />
									</LinearGradient>
								</View>
							</TouchableOpacity>
						</HoverableView>
					</View>

					<View style={styles.formSection}>
						<View style={styles.inputContainer}>
							<Text style={[styles.inputLabel, { color: colors.text }]}>
								Display Name
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										color: colors.text,
										backgroundColor: colors.card,
										borderColor: colors.border,
									},
								]}
								value={displayName}
								onChangeText={setDisplayName}
								placeholder="Your display name"
								placeholderTextColor={colors.textSecondary}
							/>
						</View>

						<View style={styles.inputContainer}>
							<Text style={[styles.inputLabel, { color: colors.text }]}>
								Username
							</Text>
							<View style={styles.usernameInputContainer}>
								<TextInput
									style={[
										styles.input,
										{
											color: colors.text,
											backgroundColor: colors.card,
											borderColor: colors.border,
										},
									]}
									value={username}
									onChangeText={setUsername}
									placeholder={originalUsername}
									placeholderTextColor={colors.textSecondary}
								/>
								{isCheckingUsername && (
									<ActivityIndicator
										style={styles.usernameIndicator}
										size="small"
										color={colors.tint}
									/>
								)}
								{isUsernameEdited && isUsernameValid && !isCheckingUsername && (
									<View style={styles.validIndicator}>
										<Feather
											name="check"
											size={16}
											color={colors.success || "#34C759"}
										/>
									</View>
								)}
							</View>
							{usernameError ? (
								<Text style={[styles.errorText, { color: colors.error }]}>
									{usernameError}
								</Text>
							) : (
								<Text
									style={[styles.helperText, { color: colors.textSecondary }]}
								>
									Choose a unique username
								</Text>
							)}
						</View>

						<View style={styles.inputContainer}>
							<Text style={[styles.inputLabel, { color: colors.text }]}>
								Bio
							</Text>
							<TextInput
								style={[
									styles.input,
									styles.bioInput,
									{
										color: colors.text,
										backgroundColor: colors.card,
										borderColor: colors.border,
									},
								]}
								value={bio}
								onChangeText={setBio}
								placeholder="Tell us about yourself"
								placeholderTextColor={colors.textSecondary}
								multiline
								maxLength={160}
							/>
							<Text style={[styles.charCount, { color: colors.textSecondary }]}>
								{bio.length}/160
							</Text>
						</View>
					</View>
				</Animated.View>
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
	},
	saveButton: {
		backgroundColor: "#6B2FBC",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	disabledButton: {
		backgroundColor: "#A990D1",
	},
	saveButtonText: {
		color: "#fff",
		fontWeight: "600",
	},
	content: {
		flex: 1,
	},
	coverPhotoSection: {
		width: "100%",
	},
	coverPhotoContainer: {
		width: "100%",
		height: 150,
		position: "relative",
	},
	coverPhotoTouchable: {
		width: "100%",
		height: "100%",
	},
	coverPhoto: {
		width: "100%",
		height: 150,
	},
	coverEditOverlay: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: "100%",
		justifyContent: "flex-end",
	},
	coverGradient: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: 60,
		justifyContent: "center",
		alignItems: "center",
	},
	coverEditButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
		padding: 8,
		borderRadius: 20,
		position: "absolute",
		top: 10,
		right: 10,
		width: 32,
		height: 32,
	},
	coverEditText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "500",
		marginLeft: 4,
	},
	avatarSection: {
		alignItems: "center",
		paddingVertical: 24,
		marginTop: -50,
	},
	avatarContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
		backgroundColor: "#fff",
	},
	avatarTouchable: {
		width: "100%",
		height: "100%",
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
		justifyContent: "center",
		alignItems: "center",
	},
	editGradient: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
	},
	formSection: {
		paddingHorizontal: 16,
		paddingBottom: 40,
	},
	inputContainer: {
		marginBottom: 20,
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
		marginBottom: 8,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
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
		marginTop: 4,
	},
	errorText: {
		fontSize: 12,
		marginTop: 4,
	},
	charCount: {
		fontSize: 12,
		textAlign: "right",
		marginTop: 4,
	},
});
