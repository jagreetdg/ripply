import { Dimensions } from "react-native";
import {
	ImageDimensions,
	ResponsiveSpacing,
	ResponsiveFontSizes,
	ResponsiveSizes,
} from "../types";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

export const getImageDimensions = (): ImageDimensions => {
	const maxWidth = screenWidth * (isTablet ? 0.6 : 0.85);
	const maxHeight = screenHeight * (isTablet ? 0.6 : 0.65);

	// Maintain aspect ratio while fitting within bounds
	const aspectRatio = 1; // Square for profile, can be adjusted for cover
	let width = maxWidth;
	let height = width / aspectRatio;

	if (height > maxHeight) {
		height = maxHeight;
		width = height * aspectRatio;
	}

	return {
		width: Math.round(width),
		height: Math.round(height),
	};
};

export const getSpacing = (): ResponsiveSpacing => {
	return {
		headerPadding: isTablet ? 32 : 20,
		contentPadding: isTablet ? 40 : 24,
		buttonGap: isTablet ? 24 : 16,
		bottomPadding: isTablet ? 60 : 40,
	};
};

export const getFontSizes = (): ResponsiveFontSizes => {
	return {
		placeholderText: isTablet ? 18 : 16,
	};
};

export const getSizes = (): ResponsiveSizes => {
	return {
		closeButton: isTablet ? 48 : 40,
		closeIcon: isTablet ? 28 : 24,
		placeholderIcon: isTablet ? 120 : 80,
		placeholderIconSize: isTablet ? 48 : 32,
		actionButtonHeight: isTablet ? 64 : 56,
	};
};

export { isTablet }; 