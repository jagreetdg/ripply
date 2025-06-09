import { Platform, Alert, ToastAndroid } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import {
	CompressionResult,
	MAX_FILE_SIZE,
	MAX_FILE_SIZE_WEB,
	MAX_PROFILE_DIMENSION,
	MAX_COVER_WIDTH,
	MAX_COVER_HEIGHT,
	INITIAL_COMPRESSION_QUALITY,
	MIN_COMPRESSION_QUALITY,
} from "../types";

// Utility function to convert blob URL to base64 data URI (web only)
export const blobToBase64 = (blob: Blob): Promise<string> => {
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

// Utility function to convert blob URL or remote URL to data URI if needed
export const ensureDataUri = async (uri: string): Promise<string> => {
	try {
		if (Platform.OS === "web") {
			// If it's already a data URI, return as-is
			if (uri.startsWith("data:")) {
				return uri;
			}
			
			// Convert blob URLs or remote URLs to data URI
			if (uri.startsWith("blob:") || uri.startsWith("http")) {
				const response = await fetch(uri);
				const blob = await response.blob();
				const base64Data = await blobToBase64(blob);
				const dataUri = `data:${blob.type};base64,${base64Data}`;
				return dataUri;
			}
		}
		return uri;
	} catch (error) {
		console.warn("[IMAGE UTILS] Failed to convert URI to data URI:", error);
		return uri; // Return original URI as fallback
	}
};

// Utility function to get file size (web-compatible)
export const getFileSize = async (uri: string): Promise<number> => {
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
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Utility function to show toast messages (kept for compression feedback)
export const showCompressionToast = (message: string) => {
	if (Platform.OS === "android") {
		ToastAndroid.show(message, ToastAndroid.LONG);
	} else {
		// For web and iOS, use Alert with a more prominent display
		Alert.alert("Image Processing", message, [{ text: "OK" }]);
	}
};

// Function to compress image if it's too large
export const compressImageIfNeeded = async (
	uri: string,
	photoType: "profile" | "cover"
): Promise<CompressionResult> => {
	const originalSize = await getFileSize(uri);
	const maxFileSize = Platform.OS === "web" ? MAX_FILE_SIZE_WEB : MAX_FILE_SIZE;

	// If file is already under the limit, return as-is (but ensure proper format)
	if (originalSize <= maxFileSize && Platform.OS !== "web") {
		// On native platforms, if under limit, no compression needed
		const finalUri = await ensureDataUri(uri);
		const finalSize = await getFileSize(finalUri);
		return {
			uri: finalUri,
			wasCompressed: false,
			originalSize,
			newSize: finalSize,
		};
	}

	try {
		// Convert image to data-URI format for web platforms to prevent manipulateAsync failures
		let processUri = uri;
		if (Platform.OS === "web") {
			processUri = await ensureDataUri(uri);
		}

		// Determine compression settings based on photo type
		const isProfile = photoType === "profile";
		let maxWidth = isProfile ? MAX_PROFILE_DIMENSION : MAX_COVER_WIDTH;
		let maxHeight = isProfile ? MAX_PROFILE_DIMENSION : MAX_COVER_HEIGHT;

		// For web, start with smaller dimensions due to base64 overhead
		if (Platform.OS === "web") {
			maxWidth = Math.floor(maxWidth * 0.8);
			maxHeight = Math.floor(maxHeight * 0.8);
		}

		// Start with moderate compression
		let compressionQuality = INITIAL_COMPRESSION_QUALITY;
		let resizeWidth = maxWidth;
		let resizeHeight = maxHeight;

		// Try compression with different settings
		let attempts = 0;
		const maxAttempts = 5;

		while (attempts < maxAttempts) {
			try {
				const manipulateActions: ImageManipulator.Action[] = [
					{
						resize: {
							width: resizeWidth,
							height: resizeHeight,
						},
					},
				];

				const result = await ImageManipulator.manipulateAsync(
					processUri,
					manipulateActions,
					{
						compress: compressionQuality,
						format: ImageManipulator.SaveFormat.JPEG,
						base64: Platform.OS === "web",
					}
				);

				// Get the final URI (use base64 for web, regular URI for native)
				const finalUri =
					Platform.OS === "web" && result.base64
						? `data:image/jpeg;base64,${result.base64}`
						: result.uri;

				const newSize = await getFileSize(finalUri);

				// Check if we've achieved our target
				if (newSize <= maxFileSize || attempts === maxAttempts - 1) {
					// Success or final attempt
					const wasCompressed = newSize < originalSize;

					if (wasCompressed && Platform.OS !== "web") {
						showCompressionToast(
							`Image compressed from ${formatFileSize(
								originalSize
							)} to ${formatFileSize(newSize)}`
						);
					}

					return {
						uri: finalUri,
						wasCompressed,
						originalSize,
						newSize,
					};
				}

				// Still too large, try more aggressive compression
				compressionQuality = Math.max(
					compressionQuality * 0.7,
					MIN_COMPRESSION_QUALITY
				);
				resizeWidth = Math.floor(resizeWidth * 0.9);
				resizeHeight = Math.floor(resizeHeight * 0.9);

				attempts++;
			} catch (manipulateError) {
				console.error(
					`[IMAGE UTILS] Compression attempt ${attempts + 1} failed:`,
					manipulateError
				);
				attempts++;

				if (attempts >= maxAttempts) {
					throw manipulateError;
				}

				// Try with even more aggressive settings
				compressionQuality = Math.max(
					compressionQuality * 0.5,
					MIN_COMPRESSION_QUALITY
				);
				resizeWidth = Math.floor(resizeWidth * 0.8);
				resizeHeight = Math.floor(resizeHeight * 0.8);
			}
		}

		// If we get here, all attempts failed
		throw new Error("Failed to compress image after multiple attempts");
	} catch (error) {
		console.error("[IMAGE UTILS] Compression failed:", error);

		// Return original URI as fallback
		const fallbackUri = await ensureDataUri(uri);
		const fallbackSize = await getFileSize(fallbackUri);

		return {
			uri: fallbackUri,
			wasCompressed: false,
			originalSize,
			newSize: fallbackSize,
		};
	}
}; 