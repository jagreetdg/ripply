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
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILE_SIZE_WEB = 2 * 1024 * 1024; // 2MB for web (due to base64 overhead)
const MAX_PROFILE_DIMENSION = 800; // Max width/height for profile photos
const MAX_COVER_WIDTH = 1200; // Max width for cover photos
const MAX_COVER_HEIGHT = 400; // Max height for cover photos (3:1 ratio)

// More aggressive compression for large images
const INITIAL_COMPRESSION_QUALITY = Platform.OS === "web" ? 0.3 : 0.8; // Much lower quality for web
const MIN_COMPRESSION_QUALITY = Platform.OS === "web" ? 0.1 : 0.3; // Even lower for web

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

// Utility function to show toast messages
const showToast = (message: string) => {
	if (Platform.OS === "android") {
		ToastAndroid.show(message, ToastAndroid.LONG);
	} else {
		// For web and iOS, use Alert with a more prominent display
		Alert.alert("Image Processing", message, [{ text: "OK" }]);
	}
};

// Function to compress image if it's too large
const compressImageIfNeeded = async (
	uri: string,
	photoType: "profile" | "cover"
): Promise<{
	uri: string;
	wasCompressed: boolean;
	originalSize: number;
	newSize: number;
}> => {
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
		for (let attempt = 0; attempt < 4; attempt++) {
			const manipulatedImage = await ImageManipulator.manipulateAsync(
				uri,
				[
					{
						resize: isProfile
							? { width: resizeWidth }
							: { width: resizeWidth, height: resizeHeight },
					},
				],
				{
					compress: compressionQuality,
					format: ImageManipulator.SaveFormat.JPEG,
				}
			);

			// Convert blob URL to data URI if needed (critical for web persistence)
			const finalUri = await ensureDataUri(manipulatedImage.uri);
			const compressedSize = await getFileSize(finalUri);

			// Check if we've achieved our target size
			if (compressedSize <= maxFileSize) {
				return {
					uri: finalUri,
					wasCompressed: true,
					originalSize,
					newSize: compressedSize,
				};
			}

			// If still too large, try more aggressive compression
			if (compressionQuality > MIN_COMPRESSION_QUALITY) {
				compressionQuality = Math.max(
					MIN_COMPRESSION_QUALITY,
					compressionQuality - 0.15
				);
			} else {
				// If quality is already at minimum, reduce dimensions
				resizeWidth = Math.floor(resizeWidth * 0.85);
				resizeHeight = Math.floor(resizeHeight * 0.85);

				// If dimensions get too small, stop trying
				if (resizeWidth < 200 || resizeHeight < 200) {
					break;
				}
			}
		}

		// Final attempt with very aggressive compression
		const finalAttempt = await ImageManipulator.manipulateAsync(
			uri,
			[
				{
					resize: isProfile
						? { width: Math.max(300, resizeWidth) }
						: {
								width: Math.max(400, resizeWidth),
								height: Math.max(150, resizeHeight),
						  },
				},
			],
			{
				compress: MIN_COMPRESSION_QUALITY,
				format: ImageManipulator.SaveFormat.JPEG,
			}
		);

		const finalUri = await ensureDataUri(finalAttempt.uri);
		const finalAttemptSize = await getFileSize(finalUri);

		// Return the result even if it's still large - let the server handle it
		return {
			uri: finalUri,
			wasCompressed: true,
			originalSize,
			newSize: finalAttemptSize,
		};
	} catch (error) {
		// If compression fails, return original
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
	const { refreshUser, setUser } = useUser();
	const [isLoading, setIsLoading] = useState(false);
	const [isImageLoading, setIsImageLoading] = useState(true);
	const [screenData, setScreenData] = useState(Dimensions.get("window"));
	const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

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

	// Reset image loading state when modal opens/closes or image changes
	useEffect(() => {
		if (visible && modalImageUrl) {
			setIsImageLoading(true);
		}
	}, [visible, modalImageUrl]);

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

				// Get original file size
				const originalSize = await getFileSize(selectedImage.uri);

				// Check and compress if needed
				const compressionResult = await compressImageIfNeeded(
					selectedImage.uri,
					photoType!
				);

				let message = "";
				if (compressionResult.wasCompressed) {
					message = `Image compressed from ${formatFileSize(
						compressionResult.originalSize
					)} to ${formatFileSize(compressionResult.newSize)}`;
				} else {
					message = "Image ready for upload";
				}

				// Upload the image
				await updatePhoto(compressionResult.uri);
			}
		} catch (error) {
			Alert.alert("Error", "Failed to select image. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const updatePhoto = async (newImageUri: string) => {
		try {
			const finalSize = await getFileSize(newImageUri);

			const updateData = {
				[photoType === "profile" ? "avatar_url" : "cover_photo_url"]:
					newImageUri,
			};

			const result = await updateUserProfile(userId, updateData);

			if (result.success) {
				// Refresh user data to get the latest from server
				await refreshUser();

				// Get the server-returned image URL
				const serverImageUrl =
					photoType === "profile"
						? result.user?.avatar_url
						: result.user?.cover_photo_url;

				// Notify parent component
				if (onPhotoUpdated) {
					onPhotoUpdated(photoType!, serverImageUrl || newImageUri);
				}

				showToast(
					`${
						photoType === "profile" ? "Profile" : "Cover"
					} photo updated successfully!`
				);
				onClose();
			} else {
				Alert.alert(
					"Upload Failed",
					"Failed to update photo. Please try again."
				);
			}
		} catch (error) {
			Alert.alert("Error", "Failed to update photo. Please try again.");
		}
	};

	const handleDeletePhoto = () => {
		Alert.alert(
			"Delete Photo",
			`Are you sure you want to delete your ${photoType} photo?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setIsLoading(true);

							const updateData = {
								[photoType === "profile" ? "avatar_url" : "cover_photo_url"]:
									null,
							};

							const result = await updateUserProfile(userId, updateData);

							if (result.success) {
								// Refresh user data
								await refreshUser();

								// Notify parent component
								if (onPhotoUpdated) {
									onPhotoUpdated(photoType!, null);
								}

								showToast(
									`${
										photoType === "profile" ? "Profile" : "Cover"
									} photo deleted successfully!`
								);
								onClose();
							} else {
								Alert.alert(
									"Delete Failed",
									"Failed to delete photo. Please try again."
								);
							}
						} catch (error) {
							Alert.alert("Error", "Failed to delete photo. Please try again.");
						} finally {
							setIsLoading(false);
						}
					},
				},
			]
		);
	};

	return (
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
				<Pressable style={styles.backdrop} onPress={onClose}>
					<LinearGradient
						colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.95)"]}
						style={StyleSheet.absoluteFillObject}
					/>
				</Pressable>

				{/* Header */}
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
					<View style={styles.headerLeft}>
						<Text
							style={[styles.headerTitle, { fontSize: fontSizes.headerTitle }]}
						>
							{photoType === "profile" ? "Profile Photo" : "Cover Photo"}
						</Text>
					</View>
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
								flexDirection: isLandscape && !isTablet ? "row" : "row",
								justifyContent: "center",
							},
						]}
					>
						<TouchableOpacity
							style={[
								styles.actionButton,
								styles.primaryButton,
								{
									paddingHorizontal: sizes.actionButtonPadding,
									height: sizes.actionButtonHeight,
									borderRadius: isTablet ? 16 : 12,
									minWidth: isTablet ? 140 : 120,
								},
							]}
							onPress={handleImagePicker}
							disabled={isLoading}
						>
							{isLoading ? (
								<ActivityIndicator size="small" color="white" />
							) : (
								<>
									<Feather name="camera" size={20} color="white" />
									<Text
										style={[
											styles.actionButtonText,
											{ fontSize: fontSizes.buttonText },
										]}
									>
										{modalImageUrl ? "Change" : "Upload"}
									</Text>
								</>
							)}
						</TouchableOpacity>

						{modalImageUrl && (
							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.secondaryButton,
									{
										paddingHorizontal: sizes.actionButtonPadding,
										height: sizes.actionButtonHeight,
										borderRadius: isTablet ? 16 : 12,
										minWidth: isTablet ? 140 : 120,
									},
								]}
								onPress={handleDeletePhoto}
								disabled={isLoading}
							>
								<Feather name="trash-2" size={20} color="#ff4757" />
								<Text
									style={[
										styles.actionButtonText,
										{
											color: "#ff4757",
											fontSize: fontSizes.buttonText,
										},
									]}
								>
									Delete
								</Text>
							</TouchableOpacity>
						)}
					</View>
				)}
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
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
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
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
	actionButtonText: {
		color: "white",
		fontWeight: "600",
	},
});
