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
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import {
	updateUserProfile,
	getUserProfile,
} from "../../services/api/userService";
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
	try {
		if (Platform.OS === "web") {
			// Handle blob URLs
			if (uri.startsWith("blob:")) {
				try {
					const response = await fetch(uri);
					const blob = await response.blob();
					return blob.size;
				} catch (blobError) {
					return 0;
				}
			}

			// Handle base64 data URIs
			if (uri.startsWith("data:")) {
				// Extract base64 part and calculate size
				const base64Data = uri.split(",")[1];
				if (base64Data) {
					// Base64 size calculation: (base64Length * 3) / 4
					const sizeInBytes = (base64Data.length * 3) / 4;
					return sizeInBytes;
				}
			}

			// Fallback: estimate from string length
			return uri.length;
		} else {
			// For native platforms, use FileSystem
			const fileInfo = await FileSystem.getInfoAsync(uri);
			return fileInfo.exists ? fileInfo.size || 0 : 0;
		}
	} catch (error) {
		// Fallback for web: estimate from URI length
		if (Platform.OS === "web" && uri.startsWith("data:")) {
			const base64Data = uri.split(",")[1];
			return base64Data ? (base64Data.length * 3) / 4 : uri.length;
		}
		return 0;
	}
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

// Progressive compression function
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
	const originalSize = await getFileSize(uri);

	console.log(
		`[COMPRESSION] Starting compression for ${formatFileSize(
			originalSize
		)} ${photoType} image`
	);

	// Check if file is too large to even attempt processing
	if (originalSize > MAX_ALLOWED_SIZE) {
		console.log(
			`[COMPRESSION] File too large: ${formatFileSize(
				originalSize
			)} > ${formatFileSize(MAX_ALLOWED_SIZE)}`
		);
		return {
			uri,
			wasCompressed: false,
			originalSize,
			newSize: originalSize,
			error: `Image is too large (${formatFileSize(
				originalSize
			)}). Please select an image smaller than ${formatFileSize(
				MAX_ALLOWED_SIZE
			)}.`,
		};
	}

	// For small files that are already under target, minimal or no compression
	// On web, we ALWAYS compress due to base64 overhead, on native we can skip if small enough
	if (originalSize <= TARGET_FILE_SIZE && Platform.OS !== "web") {
		const finalUri = await ensureDataUri(uri);
		const finalSize = await getFileSize(finalUri);
		console.log(
			`[COMPRESSION] File already small enough: ${formatFileSize(originalSize)}`
		);
		return {
			uri: finalUri,
			wasCompressed: false,
			originalSize,
			newSize: finalSize,
		};
	}

	// On web, even small files need compression due to base64 overhead
	if (Platform.OS === "web") {
		console.log(
			`[COMPRESSION] Web platform: compressing ${
				originalSize <= TARGET_FILE_SIZE ? "small" : "large"
			} file due to base64 overhead`
		);
	}

	try {
		// Get progressive compression settings based on file size
		const settings = getCompressionSettings(originalSize, photoType);

		console.log(
			`[COMPRESSION] Settings for ${formatFileSize(originalSize)} file:`,
			{
				maxDimensions: `${settings.maxWidth}x${settings.maxHeight}`,
				initialQuality: settings.initialQuality,
				minQuality: settings.minQuality,
				isAggressive: settings.isAggressive,
			}
		);

		const isProfile = photoType === "profile";
		let currentWidth = settings.maxWidth;
		let currentHeight = settings.maxHeight;
		let currentQuality = settings.initialQuality;

		// Progressive compression attempts
		const maxAttempts = settings.isAggressive ? 8 : 4; // More attempts for large files

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			console.log(
				`[COMPRESSION] Attempt ${
					attempt + 1
				}/${maxAttempts}: ${currentWidth}x${currentHeight}, quality ${currentQuality.toFixed(
					2
				)}`
			);

			const manipulatedImage = await ImageManipulator.manipulateAsync(
				uri,
				[
					{
						resize: isProfile
							? { width: currentWidth, height: currentHeight }
							: { width: currentWidth, height: currentHeight },
					},
				],
				{
					compress: currentQuality,
					format: ImageManipulator.SaveFormat.JPEG,
				}
			);

			const finalUri = await ensureDataUri(manipulatedImage.uri);
			const compressedSize = await getFileSize(finalUri);

			console.log(
				`[COMPRESSION] Result: ${formatFileSize(
					compressedSize
				)} (target: ${formatFileSize(TARGET_FILE_SIZE)})`
			);

			// Check if we've achieved our target size
			if (compressedSize <= TARGET_FILE_SIZE) {
				const compressionRatio = Math.round(
					((originalSize - compressedSize) / originalSize) * 100
				);
				console.log(
					`[COMPRESSION] ✅ Success! Compressed by ${compressionRatio}%`
				);
				return {
					uri: finalUri,
					wasCompressed: true,
					originalSize,
					newSize: compressedSize,
				};
			}

			// Progressive reduction for next attempt
			if (attempt < maxAttempts - 1) {
				// Reduce quality more aggressively for larger files
				const qualityStep = settings.isAggressive ? 0.15 : 0.1;
				currentQuality = Math.max(
					settings.minQuality,
					currentQuality - qualityStep
				);

				// Reduce dimensions if quality is already at minimum
				if (currentQuality <= settings.minQuality) {
					const dimensionStep = settings.isAggressive ? 0.8 : 0.9;
					currentWidth = Math.floor(currentWidth * dimensionStep);
					currentHeight = Math.floor(currentHeight * dimensionStep);

					// Don't go below minimum dimensions
					const minDimension = isProfile ? 150 : 200;
					if (currentWidth < minDimension || currentHeight < minDimension) {
						console.log(`[COMPRESSION] Reached minimum dimensions, stopping`);
						break;
					}
				}
			}
		}

		// Final attempt with absolute minimum settings
		console.log(`[COMPRESSION] Final attempt with minimum settings`);
		const finalAttempt = await ImageManipulator.manipulateAsync(
			uri,
			[
				{
					resize: isProfile
						? {
								width: Math.max(150, currentWidth),
								height: Math.max(150, currentHeight),
						  }
						: {
								width: Math.max(200, currentWidth),
								height: Math.max(100, currentHeight),
						  },
				},
			],
			{
				compress: settings.minQuality,
				format: ImageManipulator.SaveFormat.JPEG,
			}
		);

		const finalUri = await ensureDataUri(finalAttempt.uri);
		const finalSize = await getFileSize(finalUri);

		console.log(`[COMPRESSION] Final result: ${formatFileSize(finalSize)}`);

		return {
			uri: finalUri,
			wasCompressed: true,
			originalSize,
			newSize: finalSize,
		};
	} catch (error) {
		console.error(`[COMPRESSION] Error during compression:`, error);
		const fallbackUri = await ensureDataUri(uri);
		const fallbackSize = await getFileSize(fallbackUri);
		return {
			uri: fallbackUri,
			wasCompressed: false,
			originalSize,
			newSize: fallbackSize,
			error: "Failed to compress image. Please try a different image.",
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
	const { colors } = useTheme();
	const { user, refreshUser, setUser } = useUser();
	const { showToast } = useGlobalToast();

	const [isLoading, setIsLoading] = useState(false);
	const [isImageLoading, setIsImageLoading] = useState(true);
	const [screenData, setScreenData] = useState(Dimensions.get("window"));
	const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
				process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
			}${imageUrl}`;
		}

		return imageUrl;
	}, [imageUrl]);

	// Listen for orientation changes
	useEffect(() => {
		const subscription = Dimensions.addEventListener("change", ({ window }) => {
			setScreenData(window);
		});

		return () => subscription?.remove();
	}, []);

	// Only reset loading state when the actual image URL changes
	useEffect(() => {
		if (imageUrl !== currentImageUrl) {
			setCurrentImageUrl(imageUrl || null);
			setIsImageLoading(true);
		}
	}, [imageUrl, currentImageUrl]);

	// Reset image loading state when modal opens/closes or image changes
	useEffect(() => {
		if (visible && modalImageUrl) {
			setIsImageLoading(true);
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
	const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = screenData;
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
			};
		} else if (isTablet) {
			return {
				closeButton: 48,
				closeIcon: 26,
				placeholderIcon: 110,
				placeholderIconSize: 52,
				actionButtonHeight: 52,
				actionButtonPadding: 28,
			};
		} else {
			return {
				closeButton: 44,
				closeIcon: 24,
				placeholderIcon: 100,
				placeholderIconSize: 48,
				actionButtonHeight: 48,
				actionButtonPadding: 24,
			};
		}
	};

	const imageDimensions = getImageDimensions();
	const spacing = getSpacing();
	const fontSizes = getFontSizes();
	const sizes = getSizes();

	const handleImagePicker = async () => {
		try {
			setIsLoading(true);

			// Request permissions
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (permissionResult.granted === false) {
				Alert.alert(
					"Permission Required",
					"Please allow access to your photo library to upload images.",
					[{ text: "OK" }]
				);
				return;
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: photoType === "profile" ? [1, 1] : [3, 1],
				quality: 0.9,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const selectedImage = result.assets[0];

				// Get original file size for logging
				const originalSize = await getFileSize(selectedImage.uri);
				console.log(
					`[IMAGE PICKER] Selected image: ${formatFileSize(originalSize)}`
				);

				// Progressive compression based on file size
				const compressionResult = await compressImageIfNeeded(
					selectedImage.uri,
					photoType!
				);

				// Handle compression errors (file too large, etc.)
				if (compressionResult.error) {
					showToast(compressionResult.error, "error");
					return;
				}

				// Show simple processing feedback to user
				if (compressionResult.wasCompressed) {
					// Log compression details for debugging
					const compressionRatio = Math.round(
						((compressionResult.originalSize - compressionResult.newSize) /
							compressionResult.originalSize) *
							100
					);
					console.log(
						`[IMAGE PICKER] Compression details: ${compressionRatio}% reduction (${formatFileSize(
							compressionResult.originalSize
						)} → ${formatFileSize(compressionResult.newSize)})`
					);

					// Simple user message
					showToast("Image processed for upload", "success");
				} else if (originalSize > TARGET_FILE_SIZE) {
					showToast("Processing image for upload...", "info");
				}

				// Upload the processed image
				await updatePhoto(compressionResult.uri);
			}
		} catch (error) {
			console.error("[IMAGE PICKER] Error:", error);
			showToast("Failed to select image. Please try again.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const updatePhoto = async (newImageUri: string) => {
		try {
			const finalSize = await getFileSize(newImageUri);
			console.log(
				`[PHOTO VIEWER] Uploading image: ${formatFileSize(finalSize)}`
			);

			const updateData = {
				[photoType === "profile" ? "avatar_url" : "cover_photo_url"]:
					newImageUri,
			};

			// Log the actual payload size for debugging
			const payloadSize = JSON.stringify(updateData).length;
			console.log(
				`[PHOTO VIEWER] Total payload size: ${formatFileSize(payloadSize)}`
			);

			const result = await updateUserProfile(userId, updateData);

			if (result && user) {
				// Create updated user object with the server response
				const updatedUser = {
					...user,
					...result, // Merge the server response
				};

				// Update user context immediately
				setUser(updatedUser);

				// Update AsyncStorage to persist the changes
				try {
					await AsyncStorage.setItem(
						"@ripply_user",
						JSON.stringify(updatedUser)
					);
					console.log(
						"[PHOTO VIEWER] ✅ Updated AsyncStorage with new user data"
					);
				} catch (storageError) {
					console.error(
						"[PHOTO VIEWER] ❌ Error updating AsyncStorage:",
						storageError
					);
				}

				// Get the server-returned image URL
				const serverImageUrl =
					photoType === "profile"
						? (result as any).avatar_url
						: (result as any).cover_photo_url;

				// Notify parent component
				if (onPhotoUpdated) {
					onPhotoUpdated(photoType!, serverImageUrl || newImageUri);
				}

				showToast(
					`${
						photoType === "profile" ? "Profile" : "Cover"
					} photo updated successfully!`,
					"success"
				);
				onClose();
			} else {
				showToast("Failed to update photo. Please try again.", "error");
			}
		} catch (error: any) {
			console.error("[PHOTO VIEWER] Error updating photo:", error);

			// Handle specific error cases
			if (
				error.status === 413 ||
				error.message?.includes("413") ||
				error.message?.includes("Payload Too Large")
			) {
				const finalSize = await getFileSize(newImageUri);
				showToast(
					`Image is still too large after compression (${formatFileSize(
						finalSize
					)}). Please select a smaller image.`,
					"error"
				);
			} else if (
				error.name === "TypeError" &&
				error.message?.includes("Failed to fetch")
			) {
				// Network error that might be 413
				showToast(
					"Upload failed - image may be too large. Please try a smaller image.",
					"error"
				);
			} else {
				showToast("Failed to update photo. Please try again.", "error");
			}
		}
	};

	const handleDeletePhoto = async () => {
		console.log("[PHOTO VIEWER] Delete photo button clicked for:", photoType);

		try {
			console.log("[PHOTO VIEWER] Starting delete process for:", photoType);
			setIsLoading(true);

			// Create update data with null value for the photo URL
			const fieldName =
				photoType === "profile" ? "avatar_url" : "cover_photo_url";
			const updateData = { [fieldName]: null };

			console.log(
				"[PHOTO VIEWER] Sending update data:",
				JSON.stringify(updateData)
			);

			// Use the same updateUserProfile service for consistency
			const result = await updateUserProfile(userId, updateData);

			console.log(
				"[PHOTO VIEWER] Delete API response:",
				JSON.stringify(result)
			);

			if (result && user) {
				console.log("[PHOTO VIEWER] Delete successful, updating user data");

				// Create updated user object with the photo removed
				const updatedUser = {
					...user,
					...result, // Merge the server response
				};

				// Update user context immediately
				setUser(updatedUser);

				// Update AsyncStorage to persist the changes
				try {
					await AsyncStorage.setItem(
						"@ripply_user",
						JSON.stringify(updatedUser)
					);
					console.log(
						"[PHOTO VIEWER] ✅ Updated AsyncStorage after photo deletion"
					);
				} catch (storageError) {
					console.error(
						"[PHOTO VIEWER] ❌ Error updating AsyncStorage:",
						storageError
					);
				}

				// Update local state immediately for better UX
				setCurrentImageUrl(null);

				// Notify parent component
				if (onPhotoUpdated) {
					onPhotoUpdated(photoType!, null);
				}

				// Show success message
				showToast(
					`${
						photoType === "profile" ? "Profile" : "Cover"
					} photo deleted successfully!`,
					"success"
				);

				// Close modal
				onClose();
			} else {
				console.error("[PHOTO VIEWER] Delete failed - no result returned");
				showToast("Failed to delete photo. Please try again.", "error");
			}
		} catch (error) {
			console.error("[PHOTO VIEWER] Delete error:", error);
			showToast("Failed to delete photo. Please try again.", "error");
		} finally {
			setIsLoading(false);
			setShowDeleteConfirm(false);
		}
	};

	const handleDeleteClick = () => {
		setShowDeleteConfirm(true);
	};

	const handleCancelDelete = () => {
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<Modal
				visible={visible}
				transparent
				animationType="fade"
				statusBarTranslucent
			>
				{Platform.OS === "ios" && <StatusBar barStyle="light-content" />}

				{/* Full screen container */}
				<View style={styles.container}>
					{/* Background */}
					<LinearGradient
						colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.95)"]}
						style={StyleSheet.absoluteFillObject}
					/>

					{/* Backdrop - clickable area that closes modal */}
					<Pressable style={styles.backdrop} onPress={onClose} />

					{/* Header - Just close button */}
					<View
						style={[
							styles.header,
							{
								paddingHorizontal: spacing.headerPadding,
								paddingTop:
									Platform.OS === "ios"
										? isTablet
											? 80
											: 60
										: isTablet
										? 60
										: 40,
								paddingBottom: spacing.headerPadding / 2,
							},
						]}
					>
						<View style={styles.headerLeft} />
						<TouchableOpacity
							style={[
								styles.closeButton,
								{
									width: sizes.closeButton,
									height: sizes.closeButton,
									borderRadius: sizes.closeButton / 2,
								},
							]}
							onPress={onClose}
						>
							<Feather name="x" size={sizes.closeIcon} color="white" />
						</TouchableOpacity>
					</View>

					{/* Content */}
					<View
						style={[
							styles.content,
							{ paddingHorizontal: spacing.contentPadding },
						]}
					>
						{modalImageUrl ? (
							<View
								style={[
									styles.imageContainer,
									{
										borderRadius: isTablet ? 20 : 16,
									},
								]}
							>
								<Image
									source={{ uri: modalImageUrl }}
									style={[
										styles.image,
										{
											width: imageDimensions.width,
											height: imageDimensions.height,
											borderRadius: isTablet ? 20 : 16,
										},
									]}
									resizeMode="cover"
									onLoad={() => setIsImageLoading(false)}
									onError={() => setIsImageLoading(false)}
								/>
								{isImageLoading && (
									<View style={styles.imageLoadingOverlay}>
										<ActivityIndicator size="large" color="white" />
									</View>
								)}
							</View>
						) : (
							<View style={styles.placeholderContainer}>
								<View
									style={[
										styles.placeholderIcon,
										{
											width: sizes.placeholderIcon,
											height: sizes.placeholderIcon,
											borderRadius: sizes.placeholderIcon / 2,
											marginBottom: spacing.contentPadding / 2,
										},
									]}
								>
									<Feather
										name={photoType === "profile" ? "user" : "image"}
										size={sizes.placeholderIconSize}
										color="rgba(255,255,255,0.6)"
									/>
								</View>
								<Text
									style={[
										styles.placeholderText,
										{ fontSize: fontSizes.placeholderText },
									]}
								>
									No {photoType} photo
								</Text>
							</View>
						)}
					</View>

					{/* Actions */}
					{isOwnProfile && (
						<View
							style={[
								styles.actions,
								{
									gap: spacing.buttonGap,
									paddingHorizontal: spacing.contentPadding,
									paddingBottom: spacing.bottomPadding,
									flexDirection: "row",
									justifyContent: "center",
								},
							]}
						>
							<TouchableOpacity
								style={[
									styles.circularButton,
									styles.primaryButton,
									{
										width: sizes.actionButtonHeight,
										height: sizes.actionButtonHeight,
										borderRadius: sizes.actionButtonHeight / 2,
									},
								]}
								onPress={handleImagePicker}
								disabled={isLoading}
							>
								{isLoading ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Feather name="camera" size={24} color="white" />
								)}
							</TouchableOpacity>

							{modalImageUrl && !showDeleteConfirm && (
								<TouchableOpacity
									style={[
										styles.circularButton,
										styles.secondaryButton,
										{
											width: sizes.actionButtonHeight,
											height: sizes.actionButtonHeight,
											borderRadius: sizes.actionButtonHeight / 2,
										},
									]}
									onPress={handleDeleteClick}
									disabled={isLoading}
								>
									<Feather name="trash-2" size={24} color="#ff4757" />
								</TouchableOpacity>
							)}

							{/* Inline Delete Confirmation */}
							{modalImageUrl && showDeleteConfirm && (
								<>
									<TouchableOpacity
										style={[
											styles.circularButton,
											styles.cancelButton,
											{
												width: sizes.actionButtonHeight,
												height: sizes.actionButtonHeight,
												borderRadius: sizes.actionButtonHeight / 2,
											},
										]}
										onPress={handleCancelDelete}
										disabled={isLoading}
									>
										<Feather name="x" size={24} color="#666" />
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.circularButton,
											styles.deleteConfirmButton,
											{
												width: sizes.actionButtonHeight,
												height: sizes.actionButtonHeight,
												borderRadius: sizes.actionButtonHeight / 2,
											},
										]}
										onPress={handleDeletePhoto}
										disabled={isLoading}
									>
										{isLoading ? (
											<ActivityIndicator size="small" color="white" />
										) : (
											<Feather name="check" size={24} color="white" />
										)}
									</TouchableOpacity>
								</>
							)}
						</View>
					)}
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		zIndex: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		zIndex: 10,
	},
	headerLeft: {
		flex: 1,
	},
	headerTitle: {
		fontWeight: "600",
		color: "white",
	},
	closeButton: {
		backgroundColor: "rgba(255,255,255,0.1)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.2)",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},
	imageContainer: {
		position: "relative",
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 16,
		elevation: 8,
	},
	image: {
		backgroundColor: "rgba(255,255,255,0.05)",
	},
	imageLoadingOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.3)",
	},
	placeholderContainer: {
		alignItems: "center",
		justifyContent: "center",
		padding: 40,
	},
	placeholderIcon: {
		backgroundColor: "rgba(255,255,255,0.1)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.2)",
		borderStyle: "dashed",
	},
	placeholderText: {
		color: "rgba(255,255,255,0.7)",
		fontWeight: "500",
	},
	actions: {
		flexDirection: "row",
		justifyContent: "center",
		zIndex: 10,
	},
	circularButton: {
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButton: {
		backgroundColor: "#6366f1",
		shadowColor: "#6366f1",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	secondaryButton: {
		backgroundColor: "rgba(255,255,255,0.1)",
		borderWidth: 1,
		borderColor: "rgba(255,71,87,0.3)",
	},
	cancelButton: {
		backgroundColor: "rgba(255,255,255,0.1)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.3)",
	},
	deleteConfirmButton: {
		backgroundColor: "#ff4757",
		shadowColor: "#ff4757",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
});
