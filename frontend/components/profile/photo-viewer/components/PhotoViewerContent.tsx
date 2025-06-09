import React from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
	getImageDimensions,
	getSpacing,
	getFontSizes,
	getSizes,
	isTablet,
} from "../utils/responsiveUtils";

interface PhotoViewerContentProps {
	modalImageUrl: string | null;
	photoType: "profile" | "cover" | null;
	isImageLoading: boolean;
	onImageLoad: () => void;
	onImageError: () => void;
}

export const PhotoViewerContent: React.FC<PhotoViewerContentProps> = ({
	modalImageUrl,
	photoType,
	isImageLoading,
	onImageLoad,
	onImageError,
}) => {
	const imageDimensions = getImageDimensions();
	const spacing = getSpacing();
	const fontSizes = getFontSizes();
	const sizes = getSizes();

	return (
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
						onLoad={onImageLoad}
						onError={onImageError}
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
	);
};

const styles = StyleSheet.create({
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
}); 