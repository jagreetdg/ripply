import React, { useState, useEffect, useMemo } from "react";
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
	ViewStyle,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import { updateUserProfile } from "../../services/api/userService";
import { checkUsernameAvailability } from "../../services/api";
import DefaultAvatar from "../../components/DefaultAvatar";
import DefaultCoverPhoto from "../../components/DefaultCoverPhoto";
import { LinearGradient } from "expo-linear-gradient";
import { getDefaultCoverPhoto } from "../../utils/defaultImages";
import { useGlobalToast } from "../../components/common/Toast";
import { PhotoViewerModal } from "../../components/profile/PhotoViewerModal";

// Define response types to fix TypeScript errors
interface UsernameAvailabilityResponse {
	available: boolean;
}

// Note: cover_photo_url is now included in the main User interface

// Create a custom hover component for web
const HoverableView = ({
	children,
	onHoverIn,
	onHoverOut,
	style,
	...props
}: {
	children: React.ReactNode;
	onHoverIn: () => void;
	onHoverOut: () => void;
	style?: ViewStyle;
	[key: string]: any;
}) => {
	// Only add hover styles on web platform
	if (Platform.OS === "web") {
		return (
			<View
				style={[style, { position: "relative" }]}
				// onMouseEnter={onHoverIn}
				// onMouseLeave={onHoverOut}
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
	const { user, refreshUser, setUser } = useUser();
	const { colors, isDarkMode } = useTheme();
	const { showToast } = useGlobalToast();

	// Dynamic styles that need theme context
	const dynamicStyles = StyleSheet.create({
		avatarContainer: {
			width: 110, // Slightly larger than avatar for padding (like ProfileHeader)
			height: 110,
			borderRadius: 55,
			overflow: "hidden",
			backgroundColor: colors.background, // Use theme background color
			// Drop shadow for container (matching ProfileHeader)
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 3 },
			shadowOpacity: 0.25,
			shadowRadius: 6,
			elevation: 6,
			// Center the avatar inside
			alignItems: "center",
			justifyContent: "center",
			// Add a subtle ring/glow effect with border (matching ProfileHeader)
			borderWidth: 1,
			borderColor: isDarkMode
				? "rgba(255,255,255,0.15)" // Light border in dark mode
				: "rgba(0,0,0,0.05)", // Dark border in light mode
		},
		avatar: {
			width: 100, // Match touchable size
			height: 100,
			borderRadius: 50,
			borderWidth: isDarkMode ? 1 : 0, // Thin inner border in dark mode for definition
			borderColor: "rgba(255,255,255,0.2)", // Subtle white border
		},
	});

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

	// Photo viewer modal state
	const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
	const [photoViewerType, setPhotoViewerType] = useState<
		"profile" | "cover" | null
	>(null);

	// Animation values
	const [fadeAnim] = useState(new Animated.Value(0));
	const [scaleAnim] = useState(new Animated.Value(0.95));
	const [animationStarted, setAnimationStarted] = useState(false);

	// Initialize form with user data
	useEffect(() => {
		if (user) {
			setDisplayName(user.display_name || "");
			setBio(user.bio || "");
			setUsername(user.username || "");
			setOriginalUsername(user.username || "");
			setAvatarUrl(user.avatar_url);
			// Access cover_photo_url from the User interface
			setCoverPhotoUrl(user.cover_photo_url || null);

			// Start entrance animation only on first load
			if (!animationStarted) {
				setAnimationStarted(true);
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
		}
	}, [user]);

	// Check if any changes have been made
	const hasChanges = useMemo(() => {
		if (!user) return false;

		return (
			displayName.trim() !== (user.display_name || "") ||
			bio.trim() !== (user.bio || "") ||
			username.trim() !== (user.username || "") ||
			avatarUrl !== user.avatar_url ||
			coverPhotoUrl !== user.cover_photo_url
		);
	}, [user, displayName, bio, username, avatarUrl, coverPhotoUrl]);

	// Sync local photo state when user context changes (e.g., from PhotoViewerModal)
	useEffect(() => {
		if (user) {
			// Only update if the URLs are different to avoid unnecessary re-renders
			if (user.avatar_url !== avatarUrl) {
				console.log(
					"[EDIT PROFILE] Syncing avatar URL from user context:",
					user.avatar_url
				);
				setAvatarUrl(user.avatar_url);
			}

			const userCoverPhoto = user.cover_photo_url;
			if (userCoverPhoto !== coverPhotoUrl) {
				console.log(
					"[EDIT PROFILE] Syncing cover photo URL from user context:",
					userCoverPhoto
				);
				setCoverPhotoUrl(userCoverPhoto || null);
			}
		}
	}, [user?.avatar_url, user?.cover_photo_url]);

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

	// Handle opening photo viewer
	const handleOpenPhotoViewer = (type: "profile" | "cover") => {
		setPhotoViewerType(type);
		setPhotoViewerVisible(true);
	};

	// Handle closing photo viewer
	const handleClosePhotoViewer = () => {
		setPhotoViewerVisible(false);
		setPhotoViewerType(null);
	};

	// Handle photo updated from viewer
	const handlePhotoUpdated = (
		type: "profile" | "cover",
		newUrl: string | null
	) => {
		if (type === "profile") {
			setAvatarUrl(newUrl);
		} else if (type === "cover") {
			setCoverPhotoUrl(newUrl);
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

	// Update user in AsyncStorage to maintain consistent state
	const updateLocalUserData = async (updatedUser: any) => {
		console.log("[EDIT PROFILE] updateLocalUserData called with:", updatedUser);
		try {
			const USER_KEY = "@ripply_user";
			console.log(
				"[EDIT PROFILE] Attempting to save to AsyncStorage with key:",
				USER_KEY
			);
			await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
			console.log(
				"[EDIT PROFILE] ✅ Successfully saved to AsyncStorage:",
				updatedUser.username
			);

			// Verify the save by reading it back
			const savedData = await AsyncStorage.getItem(USER_KEY);
			const parsedData = savedData ? JSON.parse(savedData) : null;
			console.log(
				"[EDIT PROFILE] 🔍 Verification - data saved in AsyncStorage:",
				parsedData
					? { id: parsedData.id, username: parsedData.username }
					: "null"
			);
		} catch (error: any) {
			console.error("[EDIT PROFILE] ❌ Error updating local user data:", error);
			console.log("[EDIT PROFILE] AsyncStorage error details:", error.message);
		}
	};

	// Handle form submission
	const handleSave = async () => {
		console.log("[EDIT PROFILE] === SAVE PROCESS STARTED ===");
		console.log(
			"[EDIT PROFILE] Current user:",
			user ? { id: user.id, username: user.username } : "null"
		);
		console.log("[EDIT PROFILE] Form data:", {
			displayName: displayName.trim(),
			bio: bio.trim(),
			username: username.trim(),
			originalUsername,
			avatarUrl,
			coverPhotoUrl,
			usernameChanged: username !== originalUsername,
		});

		if (!user) {
			console.log("[EDIT PROFILE] ERROR: No user found, aborting save");
			return;
		}

		if (!displayName.trim()) {
			console.log("[EDIT PROFILE] ERROR: Display name is empty");
			showToast("Display name cannot be empty", "error");
			return;
		}

		// Validate username
		if (usernameError || !username.trim()) {
			console.log("[EDIT PROFILE] ERROR: Username validation failed:", {
				usernameError,
				username: username.trim(),
				isUsernameValid,
				isUsernameEdited,
			});
			showToast(usernameError || "Username cannot be empty", "error");
			return;
		}

		console.log("[EDIT PROFILE] Validation passed, starting API call");
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
				...(coverPhotoUrl !== user.cover_photo_url && {
					cover_photo_url: coverPhotoUrl,
				}),
			};

			console.log("[EDIT PROFILE] Prepared userData for API:", userData);
			console.log("[EDIT PROFILE] Making API call to updateUserProfile...");

			// 🔥 CRITICAL DEBUG: Check auth token before API call
			try {
				const authToken = await AsyncStorage.getItem("@ripply_auth_token");
				console.log("🔥 [AUTH DEBUG] Token exists:", !!authToken);
				if (authToken) {
					console.log(
						"🔥 [AUTH DEBUG] Token preview:",
						authToken.substring(0, 50) + "..."
					);
				} else {
					console.log("🔥 [AUTH DEBUG] NO TOKEN FOUND IN STORAGE!");
				}
			} catch (tokenError) {
				console.log("🔥 [AUTH DEBUG] Error getting token:", tokenError);
			}

			// Call API to update profile
			const result = (await updateUserProfile(user.id, userData)) as any;

			console.log("[EDIT PROFILE] API response received:", result);

			// Check if the API call was successful
			// The API returns the updated user object directly, not a wrapper with success property
			if (result && result.id && result.username) {
				console.log(
					"[EDIT PROFILE] ✅ API call successful - user object received"
				);

				// Check if username was changed
				const usernameChanged = username !== originalUsername;
				console.log("[EDIT PROFILE] Username changed:", usernameChanged);

				// Create the complete updated user object using the API response
				const updatedUserData = {
					...user,
					...result, // Use the API response data
					// Ensure we have the latest data
					display_name: result.display_name || displayName.trim(),
					bio: result.bio || bio.trim(),
					username: result.username || username.trim(),
				};

				console.log(
					"[EDIT PROFILE] Created updated user data:",
					updatedUserData
				);

				// Update AsyncStorage first
				console.log("[EDIT PROFILE] Updating AsyncStorage...");
				await updateLocalUserData(updatedUserData);
				console.log("[EDIT PROFILE] ✅ AsyncStorage updated");

				// Update the user context immediately
				console.log("[EDIT PROFILE] Updating user context...");
				setUser(updatedUserData);
				console.log("[EDIT PROFILE] ✅ User context updated");

				// Show success message immediately
				console.log("[EDIT PROFILE] Showing success toast...");
				showToast("Profile updated successfully", "success");
				console.log("[EDIT PROFILE] ✅ Success toast shown");

				// Navigate back to profile page with updated username after brief delay
				// This gives the toast time to appear before navigation
				setTimeout(() => {
					console.log("[EDIT PROFILE] Setting up navigation...");
					if (usernameChanged) {
						console.log(
							`[EDIT PROFILE] 🔄 Username changed from ${originalUsername} to ${result.username}`
						);
						console.log("[EDIT PROFILE] Navigating to new username profile...");
						// Use replace to avoid navigation stack issues
						router.replace({
							pathname: "/profile/[username]",
							params: { username: result.username },
						});
					} else {
						console.log(
							"[EDIT PROFILE] 🔄 No username change, navigating to current profile..."
						);
						// Navigate to current username if no change
						router.replace({
							pathname: "/profile/[username]",
							params: { username: result.username },
						});
					}
					console.log("[EDIT PROFILE] ✅ Navigation initiated");
				}, 100); // Brief delay to let toast appear before navigation
			} else {
				console.log(
					"[EDIT PROFILE] ❌ API call failed - invalid response:",
					result
				);
				// Show error message and stay on edit screen
				const errorMessage = "Failed to update profile - invalid response";
				console.log("[EDIT PROFILE] Showing error toast:", errorMessage);
				showToast(errorMessage, "error");
			}
		} catch (error: any) {
			console.log("[EDIT PROFILE] ❌ Exception during save:", error);
			console.error("[EDIT PROFILE] Full error object:", error);
			console.log("[EDIT PROFILE] Error message:", error.message);
			console.log("[EDIT PROFILE] Error stack:", error.stack);

			const errorMessage =
				error.message || "An error occurred while updating your profile";
			console.log("[EDIT PROFILE] Showing error toast:", errorMessage);
			showToast(errorMessage, "error");
		} finally {
			console.log("[EDIT PROFILE] Setting loading to false");
			setIsLoading(false);
			console.log("[EDIT PROFILE] === SAVE PROCESS COMPLETED ===");
		}
	};

	// Determine if save button should be disabled
	const isSaveDisabled =
		isLoading ||
		!!usernameError ||
		isCheckingUsername ||
		(isUsernameEdited && !isUsernameValid) ||
		!hasChanges; // Disable if no changes have been made

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
							{/* Background touchable for viewing photo */}
							<TouchableOpacity
								onPress={() => handleOpenPhotoViewer("cover")}
								style={styles.coverPhotoTouchable}
								activeOpacity={0.8}
							>
								{coverPhotoUrl ? (
									<ImageBackground
										source={{ uri: coverPhotoUrl }}
										style={styles.coverPhoto}
										resizeMode="cover"
									/>
								) : (
									<DefaultCoverPhoto
										width={400}
										height={150}
										style={styles.coverPhoto}
									/>
								)}
							</TouchableOpacity>

							{/* Edit overlay */}
							<View
								style={[
									styles.coverEditOverlay,
									{ opacity: isCoverHovered ? 1 : 0 },
								]}
								pointerEvents="box-none"
							>
								<View style={styles.coverShade} pointerEvents="none" />
								<TouchableOpacity
									onPress={handleSelectCoverPhoto}
									style={styles.coverEditButton}
									activeOpacity={0.8}
								>
									<Feather
										name={coverPhotoUrl ? "edit-2" : "plus"}
										size={16}
										color="#fff"
									/>
								</TouchableOpacity>
								{!coverPhotoUrl && (
									<View style={styles.coverAddText} pointerEvents="none">
										<Text style={styles.coverEditText}>Add Cover Photo</Text>
									</View>
								)}
							</View>
						</HoverableView>
					</View>

					<View style={styles.avatarSection}>
						<HoverableView
							style={dynamicStyles.avatarContainer}
							onHoverIn={() => setIsImageHovered(true)}
							onHoverOut={() => setIsImageHovered(false)}
						>
							{/* Background touchable for viewing avatar */}
							<TouchableOpacity
								onPress={() => handleOpenPhotoViewer("profile")}
								style={styles.avatarTouchable}
								activeOpacity={0.8}
							>
								{avatarUrl ? (
									<Image
										source={{ uri: avatarUrl }}
										style={dynamicStyles.avatar}
									/>
								) : (
									<DefaultAvatar size={100} userId={user.id || ""} />
								)}
							</TouchableOpacity>

							{/* Edit overlay */}
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
								pointerEvents="box-none"
							>
								<LinearGradient
									colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
									style={styles.editGradient}
									pointerEvents="none"
								>
									<TouchableOpacity
										onPress={handleSelectImage}
										style={styles.avatarEditButton}
										activeOpacity={0.8}
									>
										<Feather name="edit-2" size={20} color="#fff" />
									</TouchableOpacity>
								</LinearGradient>
							</View>
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

			{/* Photo Viewer Modal */}
			<PhotoViewerModal
				visible={photoViewerVisible}
				onClose={handleClosePhotoViewer}
				photoType={photoViewerType || "profile"}
				imageUrl={photoViewerType === "profile" ? avatarUrl : coverPhotoUrl}
				userId={user.id}
				isOwnProfile={true}
				onPhotoUpdated={handlePhotoUpdated}
			/>
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
	coverEditTouchable: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 2,
	},
	coverPhoto: {
		width: "100%",
		height: 150,
	},
	coverEditOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "flex-start",
	},
	coverShade: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.6)",
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
		marginBottom: 50,
	},
	coverAddText: {
		position: "absolute",
		bottom: 20,
		left: 0,
		right: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarSection: {
		alignItems: "center",
		paddingVertical: 24,
		marginTop: -50,
	},
	avatarTouchable: {
		width: 100, // Slightly smaller than container (like ProfileHeader)
		height: 100,
		borderRadius: 50,
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
	avatarEditButton: {
		width: "100%",
		height: "100%",
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
