import React, { useState, useEffect, useMemo } from "react";
import { View, Image, ActivityIndicator, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { getStyles } from "./styles";

interface PhotoViewerImageProps {
	imageUrl: string | null;
	fallbackImageUrl: string | null;
	loading: boolean;
	action: "upload" | "delete" | null;
	photoType: "profile" | "cover";
}

export const PhotoViewerImage = React.memo(
	({
		imageUrl,
		fallbackImageUrl,
		loading,
		action,
		photoType,
	}: PhotoViewerImageProps) => {
		const { colors, isDarkMode } = useTheme();
		const styles = useMemo(
			() => getStyles(colors, isDarkMode),
			[colors, isDarkMode]
		);

		const [isLoading, setIsLoading] = useState(true);
		const [hasError, setHasError] = useState(false);

		const effectiveUrl = hasError ? fallbackImageUrl : imageUrl;
		const loadingText = action === "delete" ? "Deleting..." : "Uploading...";

		useEffect(() => {
			// Whenever the URI changes, reset the loading and error states.
			setIsLoading(true);
			setHasError(false);
		}, [imageUrl]); // Depend only on imageUrl to avoid loops with fallback

		const renderPlaceholder = () => {
			const placeholderStyle =
				photoType === "profile"
					? styles.placeholderContainer
					: styles.placeholderContainerCover;

			return (
				<View style={placeholderStyle}>
					<Feather
						name={photoType === "profile" ? "user" : "image"}
						size={photoType === "profile" ? 60 : 80}
						color={colors.textSecondary}
						style={{ opacity: 0.6 }}
					/>
				</View>
			);
		};

		if (loading) {
			return (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color={colors.primary || "#9333ea"} />
					<Text style={styles.loadingText}>{loadingText}</Text>
				</View>
			);
		}

		// If there's no image and no fallback, just show the placeholder.
		if (!effectiveUrl) {
			return renderPlaceholder();
		}

		return (
			<View style={styles.imageContainer}>
				{isLoading && (
					<View
						style={[
							styles.loadingOverlay,
							{ backgroundColor: "rgba(0,0,0,0.3)" },
						]}
					>
						<ActivityIndicator size="small" color={colors.primary} />
					</View>
				)}
				<Image
					key={effectiveUrl} // Use the URI as a key to force re-mount on change
					source={{ uri: effectiveUrl }}
					style={
						photoType === "profile" ? styles.profileImage : styles.coverImage
					}
					onLoad={() => setIsLoading(false)}
					onError={() => {
						console.warn(`[PhotoViewerImage] Failed to load: ${effectiveUrl}`);
						setHasError(true);
						setIsLoading(false);
					}}
				/>
			</View>
		);
	}
);
