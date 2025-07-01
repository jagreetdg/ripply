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
import { processImageUrl, getFallbackImageUrl } from "../../utils/imageUtils";
import { getStyles } from "./photo-viewer-modal/styles";
import { useImageUpload } from "./photo-viewer-modal/useImageUpload";
import { PhotoViewerHeader } from "./photo-viewer-modal/PhotoViewerHeader";
import { PhotoViewerImage } from "./photo-viewer-modal/PhotoViewerImage";
import { PhotoViewerActions } from "./photo-viewer-modal/PhotoViewerActions";

interface PhotoViewerModalProps {
	visible: boolean;
	onClose: () => void;
	photoType: "profile" | "cover";
	imageUrl?: string | null;
	userId: string;
	isOwnProfile: boolean;
	onPhotoUpdated?: (
		type: "profile" | "cover",
		newUrl: string | null,
		localUri?: string
	) => void;
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
	const styles = useMemo(
		() => getStyles(colors, isDarkMode),
		[colors, isDarkMode]
	);
	const [error, setError] = useState<string | null>(null);
	const [localUri, setLocalUri] = useState<string | null>(null);

	// When modal is closed, reset local state
	useEffect(() => {
		if (!visible) {
			setLocalUri(null);
			setError(null);
		}
	}, [visible]);

	// When the imageUrl prop changes (e.g., on first open), check if it's a blob
	// and process it to a stable data URI if needed.
	useEffect(() => {
		if (imageUrl && imageUrl.startsWith("blob:")) {
			console.log("[MODAL] Detected blob URL, processing to data URI...");
			ensureDataUri(imageUrl)
				.then((dataUri) => {
					setLocalUri(dataUri);
					console.log("[MODAL] Blob URL successfully converted.");
				})
				.catch((err) => {
					console.error("[MODAL] Blob URL conversion failed:", err);
					setError("Could not load image preview.");
				});
		}
	}, [imageUrl]);

	// Clear error message after a delay
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => setError(null), 3500);
			return () => clearTimeout(timer);
		}
	}, [error]);

	const onUploadSuccess = (newUrl: string, localUri: string) => {
		if (onPhotoUpdated) {
			onPhotoUpdated(photoType, newUrl, localUri);
		}
		setLocalUri(null); // Clear local URI on success
		// If deletion was successful, the urls will be empty. Close the modal.
		if (newUrl === "" && localUri === "") {
			onClose();
		}
	};

	const onUploadError = (message: string) => {
		setError(message);
	};

	const onPickImage = (uri: string) => {
		setLocalUri(uri);
	};

	// This is the single source of truth for whether an image exists.
	// It's true if we have a persisted URL from the server, OR a temporary local image.
	const hasImage =
		!!(localUri || imageUrl) &&
		!(localUri?.startsWith("blob:") || imageUrl?.startsWith("blob:"));

	// Only log when modal becomes visible to avoid spam
	useEffect(() => {
		if (visible) {
			console.log("[PhotoViewerModal] Opening:", {
				photoType,
				hasImage,
				imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : imageUrl,
			});
		}
	}, [visible, photoType, hasImage]);

	const {
		loading: uploadLoading,
		action: currentAction,
		handleImagePicker,
		handleDelete,
	} = useImageUpload(photoType, onUploadSuccess, onUploadError, onPickImage);

	if (!visible) return null;

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
					<PhotoViewerHeader onClose={onClose} />
					{error && (
						<View style={styles.topContainer}>
							<View style={styles.errorContainer}>
								<Text style={styles.errorText}>{error}</Text>
							</View>
						</View>
					)}
					<PhotoViewerImage
						imageUrl={
							localUri ||
							(imageUrl && !imageUrl.startsWith("blob:") ? imageUrl : null)
						}
						fallbackImageUrl={getFallbackImageUrl(
							userId,
							"",
							photoType === "profile" ? "avatar" : "cover"
						)}
						loading={uploadLoading}
						action={currentAction}
						photoType={photoType}
					/>
					<View style={styles.bottomContainer}>
						{isOwnProfile && (
							<PhotoViewerActions
								onUpload={handleImagePicker}
								onDelete={handleDelete}
								loading={uploadLoading}
								hasImage={hasImage}
							/>
						)}
					</View>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
