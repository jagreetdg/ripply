import { Platform } from "react-native";

export interface PhotoViewerModalProps {
	visible: boolean;
	onClose: () => void;
	photoType: "profile" | "cover" | null;
	imageUrl?: string | null;
	userId: string;
	isOwnProfile: boolean;
	onPhotoUpdated?: (type: "profile" | "cover", newUrl: string | null) => void;
}

export interface CompressionResult {
	uri: string;
	wasCompressed: boolean;
	originalSize: number;
	newSize: number;
}

export interface ImageDimensions {
	width: number;
	height: number;
}

export interface ResponsiveSpacing {
	headerPadding: number;
	contentPadding: number;
	buttonGap: number;
	bottomPadding: number;
}

export interface ResponsiveFontSizes {
	placeholderText: number;
}

export interface ResponsiveSizes {
	closeButton: number;
	closeIcon: number;
	placeholderIcon: number;
	placeholderIconSize: number;
	actionButtonHeight: number;
}

export interface PhotoViewerState {
	mounted: boolean;
	isLoading: boolean;
	isImageLoading: boolean;
	currentImageUrl: string | null;
	modalImageUrl: string | null;
}

// File size constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MAX_FILE_SIZE_WEB = 2 * 1024 * 1024; // 2MB for web (due to base64 overhead)
export const MAX_PROFILE_DIMENSION = 800; // Max width/height for profile photos
export const MAX_COVER_WIDTH = 1200; // Max width for cover photos
export const MAX_COVER_HEIGHT = 400; // Max height for cover photos (3:1 ratio)

// More aggressive compression for large images
export const INITIAL_COMPRESSION_QUALITY = Platform.OS === "web" ? 0.3 : 0.8; // Much lower quality for web
export const MIN_COMPRESSION_QUALITY = Platform.OS === "web" ? 0.1 : 0.3; // Even lower for web 