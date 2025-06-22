import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	Modal,
	Dimensions,
	ActivityIndicator,
	Alert,
	Platform,
	StatusBar,
	Pressable,
	ToastAndroid,
	TouchableWithoutFeedback,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { useTheme } from "../../context/ThemeContext";
import { useUser, User } from "../../context/UserContext";
import { updateUserProfile, UpdateUserProfileParams } from "../../services/api";
import { BlurView } from "expo-blur";
import { ENDPOINTS, apiRequest } from "../../services/api/config";
import { useGlobalToast } from "../common/Toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	useConfirmation,
	confirmationPresets,
} from "../../hooks/useConfirmation";

interface PhotoViewerModalProps {
	visible: boolean;
	onClose: () => void;
	photoType: "profile" | "cover" | null;
	imageUrl?: string | null;
	userId: string;
	isOwnProfile: boolean;
	onPhotoUpdated?: (type: "profile" | "cover", newUrl: string | null) => void;
}

// File size constants
// For web, we need to account for base64 encoding overhead (~33%), so target much smaller
const TARGET_FILE_SIZE = Platform.OS === "web" ? 150 * 1024 : 2 * 1024 * 1024; // 150KB for web (to account for base64 overhead), 2MB for native
const MAX_ALLOWED_SIZE = 100 * 1024 * 1024; // 100MB - absolute maximum we'll even attempt to process
const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024; // 20MB - considered "large"
const MEDIUM_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB - considered "medium"

// Base dimensions (will be scaled based on file size)
// Web dimensions are much smaller due to base64 overhead
const BASE_PROFILE_DIMENSION = Platform.OS === "web" ? 200 : 600;
const BASE_COVER_WIDTH = Platform.OS === "web" ? 400 : 1000;
const BASE_COVER_HEIGHT = Platform.OS === "web" ? 133 : 333;

// Calculate progressive compression settings based on file size
const getCompressionSettings = (
	originalSize: number,
	photoType: "profile" | "cover"
) => {
	// Calculate compression aggressiveness based on file size
	let compressionFactor = 1.0; // 1.0 = no extra compression, 0.5 = very aggressive
	let qualityReduction = 0; // Additional quality reduction for large files

	if (originalSize > LARGE_FILE_THRESHOLD) {
		// Very large files: aggressive compression
		compressionFactor = 0.3;
		qualityReduction = 0.4;
	} else if (originalSize > MEDIUM_FILE_THRESHOLD) {
		// Medium files: moderate compression
		compressionFactor = 0.6;
		qualityReduction = 0.2;
	} else if (originalSize > TARGET_FILE_SIZE) {
		// Slightly large files: light compression
		compressionFactor = 0.8;
		qualityReduction = 0.1;
	}

	// Calculate dimensions based on compression factor
	const isProfile = photoType === "profile";
	const maxWidth = Math.floor(
		(isProfile ? BASE_PROFILE_DIMENSION : BASE_COVER_WIDTH) * compressionFactor
	);
	const maxHeight = Math.floor(
		(isProfile ? BASE_PROFILE_DIMENSION : BASE_COVER_HEIGHT) * compressionFactor
	);

	// Calculate quality based on platform and file size
	// Web needs extremely aggressive compression due to base64 overhead
	const baseQuality = Platform.OS === "web" ? 0.3 : 0.8;
	const initialQuality = Math.max(0.02, baseQuality - qualityReduction);
	const minQuality = Math.max(0.005, initialQuality - 0.5);

	return {
		maxWidth,
		maxHeight,
		initialQuality,
		minQuality,
		compressionFactor,
		isAggressive: originalSize > MEDIUM_FILE_THRESHOLD,
	};
};

// Utility function to convert blob URL to base64 data URI (web only)
const blobToBase64 = (blob: Blob): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// Remove the data URL prefix to get just the base64 data
			const base64Data = result.split(",")[1];
			resolve(base64Data);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

// Utility function to convert blob URL to data URI if needed
const ensureDataUri = async (uri: string): Promise<string> => {
	try {
		if (Platform.OS === "web" && uri.startsWith("blob:")) {
			const response = await fetch(uri);
			const blob = await response.blob();
			const base64Data = await blobToBase64(blob);
			const dataUri = `data:${blob.type};base64,${base64Data}`;
			return dataUri;
		}
		return uri;
	} catch (error) {
		return uri; // Return original URI as fallback
	}
};

// Utility function to get file size (web-compatible)
const getFileSize = async (uri: string): Promise<number> => {
	const fileInfo = await FileSystem.getInfoAsync(uri);
	return fileInfo.exists ? fileInfo.size : 0;
};

// Utility function to format file size for display
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Utility function to show toast messages (kept for compression feedback)
const showCompressionToast = (message: string) => {
	if (Platform.OS === "android") {
		ToastAndroid.show(message, ToastAndroid.LONG);
	} else {
		// For web and iOS, use Alert with a more prominent display
		Alert.alert("Image Processing", message, [{ text: "OK" }]);
	}
};

/**
 * A robust, multi-pass image compression function for all platforms.
 * It progressively reduces image quality and dimensions until the file size is below the target.
 */
const compressImageIfNeeded = async (
	uri: string,
	photoType: "profile" | "cover"
): Promise<{
	uri: string;
	wasCompressed: boolean;
	originalSize: number;
	newSize: number;
	error?: string;
}> => {
	try {
		const originalSize = await getFileSize(uri);
		console.log(
			`[COMPRESSION_V2] Starting for ${photoType}. Original size: ${formatFileSize(
				originalSize
			)}`
		);

		const MAX_ALLOWED_SIZE = 2 * 1024 * 1024; // 2MB absolute max
		const TARGET_SIZE_BYTES = 750 * 1024; // Target 750KB

		if (originalSize < TARGET_SIZE_BYTES) {
			console.log(
				"[COMPRESSION_V2] Image is already under target size. No compression needed."
			);
			return {
				uri,
				wasCompressed: false,
				originalSize,
				newSize: originalSize,
			};
		}

		let currentUri = uri;
		let currentSize = originalSize;
		let compressionQuality = 0.9;
		let currentMaxWidth = photoType === "cover" ? 1920 : 1280;
		const minQuality = 0.5;
		let pass = 1;

		while (
			currentSize > TARGET_SIZE_BYTES &&
			compressionQuality >= minQuality
		) {
			console.log(
				`[COMPRESSION_V2] Pass ${pass}: Quality=${compressionQuality.toFixed(
					2
				)}, MaxWidth=${currentMaxWidth}, CurrentSize=${formatFileSize(
					currentSize
				)}`
			);

			const result = await ImageManipulator.manipulateAsync(
				currentUri,
				[{ resize: { width: currentMaxWidth } }],
				{
					compress: compressionQuality,
					format: ImageManipulator.SaveFormat.JPEG,
				}
			);

			currentUri = result.uri;
			currentSize = await getFileSize(currentUri);

			console.log(
				`[COMPRESSION_V2] Pass ${pass} complete. New size: ${formatFileSize(
					currentSize
				)}`
			);

			// Aggressively reduce quality and size for the next pass
			compressionQuality -= 0.1;
			if (currentMaxWidth > 1024) {
				currentMaxWidth -= 200;
			}
			pass++;
		}

		if (currentSize > MAX_ALLOWED_SIZE) {
			const errorMsg = `Could not compress image under ${formatFileSize(
				MAX_ALLOWED_SIZE
			)}. Final size: ${formatFileSize(currentSize)}`;
			console.error(`[COMPRESSION_V2] Error: ${errorMsg}`);
			return {
				uri,
				wasCompressed: true,
				originalSize,
				newSize: currentSize,
				error: errorMsg,
			};
		}

		console.log(
			`[COMPRESSION_V2] Finished. Final size: ${formatFileSize(currentSize)}`
		);
		return {
			uri: currentUri,
			wasCompressed: true,
			originalSize,
			newSize: currentSize,
		};
	} catch (error) {
		console.error(
			"[COMPRESSION_V2] Unexpected error during compression:",
			error
		);
		return {
			uri,
			wasCompressed: false,
			originalSize: await getFileSize(uri),
			newSize: await getFileSize(uri),
			error: "An unexpected error occurred during compression.",
		};
	}
};

export function PhotoViewerModal({
	visible,
	onClose,
	photoType,
	imageUrl,
	userId,
	isOwnProfile,
	onPhotoUpdated,
}: PhotoViewerModalProps) {
	const { colors, isDarkMode } = useTheme();
	const { user, setUser } = useUser();
	const { showToast } = useGlobalToast();
	const { showConfirmation } = useConfirmation();

	const [loading, setLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
	const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const defaultImageUrl =
		photoType === "profile"
			? "https://your-default-avatar-url.png" // Replace with your actual default
			: "https://your-default-cover-url.png"; // Replace with your actual default

	const styles = useMemo(
		() => getStyles(colors, isDarkMode),
		[colors, isDarkMode]
	);

	useEffect(() => {
		if (visible) {
			StatusBar.setHidden(true);
			setCurrentImageUrl(imageUrl);
		} else {
			StatusBar.setHidden(false);
			setShowDeleteConfirm(false); // Reset on close
		}
	}, [visible, imageUrl]);

	// Calculate modal image URL with proper fallbacks
	const modalImageUrl = useMemo(() => {
		if (!imageUrl) return null;

		// Handle different URL formats
		if (
			imageUrl.startsWith("http") ||
			imageUrl.startsWith("data:") ||
			imageUrl.startsWith("file:")
		) {
			return imageUrl;
		}

		// If it's a relative path, make it absolute
		if (imageUrl.startsWith("/")) {
			return `${
				process.env.EXPO_PUBLIC_API_URL || "https://ripply-backend.onrender.com"
			}${imageUrl}`;
		}

		return imageUrl;
	}, [imageUrl]);

	// Listen for orientation changes
	useEffect(() => {
		const subscription = Dimensions.addEventListener("change", ({ window }) => {
			setImageSize(window);
		});

		return () => subscription?.remove();
	}, []);

	// Reset image loading state when modal opens/closes or image changes
	useEffect(() => {
		if (visible && modalImageUrl) {
			setLoading(true);
		}
	}, [visible, modalImageUrl]);

	// Handle escape key press to close modal (web only)
	useEffect(() => {
		if (!visible) return;

		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (Platform.OS === "web") {
			document.addEventListener("keydown", handleKeyPress);
			return () => {
				document.removeEventListener("keydown", handleKeyPress);
			};
		}
	}, [visible, onClose]);

	if (!visible || !photoType) {
		return null;
	}

	// Responsive calculations
	const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = imageSize;
	const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
	const isTablet = SCREEN_WIDTH >= 768;
	const isLargeScreen = SCREEN_WIDTH >= 1024;

	// Dynamic sizing based on device and orientation
	const getImageDimensions = () => {
		if (photoType === "profile") {
			// Profile photo sizing
			if (isLargeScreen) {
				return { width: 400, height: 400 };
			} else if (isTablet) {
				return {
					width: isLandscape ? SCREEN_WIDTH * 0.4 : SCREEN_WIDTH * 0.6,
					height: isLandscape ? SCREEN_WIDTH * 0.4 : SCREEN_WIDTH * 0.6,
				};
			} else {
				return {
					width: isLandscape ? SCREEN_WIDTH * 0.5 : SCREEN_WIDTH * 0.8,
					height: isLandscape ? SCREEN_WIDTH * 0.5 : SCREEN_WIDTH * 0.8,
				};
			}
		} else {
			// Cover photo sizing (3:1 aspect ratio)
			if (isLargeScreen) {
				return { width: 600, height: 200 };
			} else if (isTablet) {
				const width = isLandscape ? SCREEN_WIDTH * 0.7 : SCREEN_WIDTH * 0.85;
				return { width, height: width / 3 };
			} else {
				const width = isLandscape ? SCREEN_WIDTH * 0.8 : SCREEN_WIDTH * 0.9;
				return { width, height: width / 3 };
			}
		}
	};

	// Dynamic padding and spacing
	const getSpacing = () => {
		if (isLargeScreen) {
			return {
				headerPadding: 40,
				contentPadding: 40,
				bottomPadding: 60,
				buttonGap: 24,
			};
		} else if (isTablet) {
			return {
				headerPadding: 30,
				contentPadding: 30,
				bottomPadding: 50,
				buttonGap: 20,
			};
		} else {
			return {
				headerPadding: 20,
				contentPadding: 20,
				bottomPadding: Platform.OS === "ios" ? 40 : 20,
				buttonGap: 16,
			};
		}
	};

	// Dynamic font sizes
	const getFontSizes = () => {
		if (isLargeScreen) {
			return {
				headerTitle: 24,
				placeholderText: 20,
				buttonText: 18,
			};
		} else if (isTablet) {
			return {
				headerTitle: 22,
				placeholderText: 19,
				buttonText: 17,
			};
		} else {
			return {
				headerTitle: 20,
				placeholderText: 18,
				buttonText: 16,
			};
		}
	};

	// Dynamic icon and button sizes
	const getSizes = () => {
		if (isLargeScreen) {
			return {
				closeButton: 52,
				closeIcon: 28,
				placeholderIcon: 120,
				placeholderIconSize: 56,
				actionButtonHeight: 56,
				actionButtonPadding: 32,
				padding: 40,
				borderRadius: 15,
				actionMarginTop: 40,
				buttonBorderRadius: 25,
			};
		} else if (isTablet) {
			return {
				closeButton: 48,
				closeIcon: 26,
				placeholderIcon: 110,
				placeholderIconSize: 52,
				actionButtonHeight: 52,
				actionButtonPadding: 28,
				padding: 30,
				borderRadius: 15,
				actionMarginTop: 30,
				buttonBorderRadius: 25,
			};
		} else {
			return {
				closeButton: 44,
				closeIcon: 24,
				placeholderIcon: 100,
				placeholderIconSize: 48,
				actionButtonHeight: 48,
				actionButtonPadding: 24,
				padding: 20,
				borderRadius: 15,
				actionMarginTop: 20,
				buttonBorderRadius: 25,
			};
		}
	};

	const imageDimensions = getImageDimensions();
	const spacing = getSpacing();
	const fontSizes = getFontSizes();
	const sizes = getSizes();

	const handleImagePicker = async () => {
		try {
			setLoading(true);

			if (Platform.OS !== "web") {
				const { status } =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (status !== "granted") {
					Alert.alert(
						"Permission needed",
						"Please grant permission to access your photos to continue."
					);
					return;
				}
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: photoType === "profile" ? [1, 1] : [16, 9],
				quality: 1, // Start with highest quality before our compression
			});

			if (result.canceled) {
				return;
			}

			const pickedUri = result.assets[0].uri;
			showToast("Processing image...", "info", 3000);

			const compressionResult = await compressImageIfNeeded(
				pickedUri,
				photoType
			);

			if (compressionResult.error) {
				showToast(compressionResult.error, "error");
				return;
			}

			await updatePhoto(compressionResult.uri);
		} catch (error) {
			console.error("Error picking image:", error);
			showToast("Failed to pick image. Please try again.", "error");
		} finally {
			setLoading(false);
		}
	};

	const updatePhoto = async (newImageUri: string) => {
		if (!user) return;
		setLoading(true);
		console.log(
			`[UPLOAD] Starting photo update for ${photoType} with URI: ${newImageUri.substring(
				0,
				100
			)}...`
		);

		try {
			const base64 = await FileSystem.readAsStringAsync(newImageUri, {
				encoding: FileSystem.EncodingType.Base64,
			});
			const base64Uri = `data:image/jpeg;base64,${base64}`;

			const updateData: UpdateUserProfileParams =
				photoType === "profile"
					? { avatar_url: base64Uri }
					: { cover_photo_url: base64Uri };

			const updatedProfile = await updateUserProfile(user.id, updateData);

			const updatedUser = { ...user, ...updatedProfile };
			setUser(updatedUser as User);
			await AsyncStorage.setItem("@ripply_user", JSON.stringify(updatedUser));

			const newUrl =
				photoType === "profile"
					? updatedProfile.avatar_url
					: updatedProfile.cover_photo_url;
			setCurrentImageUrl(newUrl || defaultImageUrl);

			if (onPhotoUpdated) {
				onPhotoUpdated(photoType, newUrl || null);
			}

			showToast("Photo updated successfully!", "success");
			onClose();
		} catch (error) {
			console.error("Failed to update photo:", error);
			showToast("Upload failed. The image might still be too large.", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleDeletePhoto = async () => {
		if (!user) return;

		// This is the first click, just show the confirmation buttons
		if (!showDeleteConfirm) {
			setShowDeleteConfirm(true);
			return;
		}

		// This is the second click (confirmation)
		setDeleteLoading(true);
		try {
			const updateData: UpdateUserProfileParams =
				photoType === "profile"
					? { avatar_url: null }
					: { cover_photo_url: null };

			const updatedProfile = await updateUserProfile(user.id, updateData);

			const updatedUser = { ...user, ...updatedProfile };
			setUser(updatedUser as User);
			await AsyncStorage.setItem("@ripply_user", JSON.stringify(updatedUser));

			setCurrentImageUrl(defaultImageUrl);
			if (onPhotoUpdated) {
				onPhotoUpdated(photoType, null);
			}

			showToast("Photo removed successfully", "success");
			setShowDeleteConfirm(false); // Hide confirmation on success
			onClose();
		} catch (error) {
			console.error("Failed to delete photo:", error);
			showToast("Failed to remove photo. Please try again.", "error");
			setShowDeleteConfirm(false); // Also hide on error
		} finally {
			setDeleteLoading(false);
		}
	};

	const renderActionButtons = () => {
		if (!isOwnProfile) return null;

		if (showDeleteConfirm) {
			return (
				<View style={styles.actionsContainer}>
					<Text style={styles.confirmationText}>Are you sure?</Text>
					<TouchableOpacity
						style={[styles.button, styles.cancelButton]}
						onPress={() => setShowDeleteConfirm(false)} // Just hide the confirmation
						disabled={deleteLoading}
					>
						<Text style={styles.buttonText}>Cancel</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.button, styles.confirmDeleteButton]}
						onPress={handleDeletePhoto}
						disabled={deleteLoading}
					>
						{deleteLoading ? (
							<ActivityIndicator size="small" color="#FFF" />
						) : (
							<Text style={styles.buttonText}>Delete</Text>
						)}
					</TouchableOpacity>
				</View>
			);
		}

		return (
			<View style={styles.actionsContainer}>
				<TouchableOpacity style={styles.button} onPress={handleImagePicker}>
					<Feather name="upload" size={18} color="#FFF" />
					<Text style={styles.buttonText}>Upload New</Text>
				</TouchableOpacity>
				{currentImageUrl &&
					!currentImageUrl.includes("your-default-") && ( // Don't show delete for default
						<TouchableOpacity
							style={[styles.button, styles.deleteButton]}
							onPress={handleDeletePhoto}
						>
							<Feather name="trash-2" size={18} color="#FFF" />
							<Text style={styles.buttonText}>Delete</Text>
						</TouchableOpacity>
					)}
			</View>
		);
	};

	return (
		<Modal
			transparent={true}
			animationType="fade"
			visible={visible}
			onRequestClose={onClose}
		>
			<StatusBar hidden={visible} />
			<TouchableWithoutFeedback onPress={onClose}>
				<View style={styles.container}>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={onClose}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Ionicons name="close-circle" size={32} color={colors.text} />
					</TouchableOpacity>

					<View
						style={[styles.imageContainer, { width: imageDimensions.width }]}
					>
						{loading && (
							<View style={styles.loadingOverlay}>
								<ActivityIndicator size="large" color={colors.tint} />
								<Text style={styles.loadingText}>Processing...</Text>
							</View>
						)}
						<Image
							source={{ uri: currentImageUrl || defaultImageUrl }}
							style={{
								width: imageDimensions.width,
								height: imageDimensions.height,
							}}
							resizeMode="cover"
						/>
					</View>

					{renderActionButtons()}
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}

const getStyles = (colors: any, isDarkMode: boolean) => {
	const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

	return StyleSheet.create({
		container: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: "rgba(0, 0, 0, 0.85)",
		},
		closeButton: {
			position: "absolute",
			top: Platform.OS === "web" ? 20 : 50,
			right: 20,
			zIndex: 10,
		},
		imageContainer: {
			borderRadius: 15,
			overflow: "hidden",
			borderWidth: 2,
			borderColor: colors.border,
			backgroundColor: colors.card,
		},
		loadingOverlay: {
			...StyleSheet.absoluteFillObject,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: "rgba(0,0,0,0.7)",
			zIndex: 1,
		},
		loadingText: {
			color: "#FFF",
			marginTop: 15,
			fontSize: 18,
			fontWeight: "bold",
		},
		actionsContainer: {
			position: "absolute",
			bottom: Platform.OS === "ios" ? 50 : 30,
			width: "100%",
			flexDirection: "row",
			justifyContent: "space-evenly",
			alignItems: "center",
		},
		button: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: "rgba(0,0,0,0.6)",
			paddingVertical: 12,
			paddingHorizontal: 20,
			borderRadius: 25,
		},
		buttonText: {
			color: "#FFF",
			fontSize: 16,
			fontWeight: "bold",
			marginLeft: 10,
		},
		deleteButton: {
			backgroundColor: colors.error,
		},
		// Confirmation styles
		confirmationText: {
			color: colors.textSecondary,
			fontSize: 16,
			marginBottom: 15,
		},
		confirmDeleteButton: {
			backgroundColor: colors.error,
		},
		cancelButton: {
			backgroundColor: colors.mediumGrey,
		},
	});
};
