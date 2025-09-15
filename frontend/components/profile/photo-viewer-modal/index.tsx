import React, { useState, useEffect, useMemo } from "react";
import { View, Modal, StatusBar, TouchableWithoutFeedback } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { getStyles } from "./styles";
import { useImageUpload } from "./useImageUpload";
import { PhotoViewerHeader } from "./PhotoViewerHeader";
import { PhotoViewerImage } from "./PhotoViewerImage";
import { PhotoViewerActions } from "./PhotoViewerActions";
import {
	processImageUrl,
	getFallbackImageUrl,
} from "../../../utils/imageUtils";

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

	const onUploadSuccess = (newUrl: string, localUri: string) => {
		if (onPhotoUpdated) {
			onPhotoUpdated(photoType, newUrl, localUri);
		}
	};

	const onUploadError = (message: string) => {
		// showToast(message, "error");
		console.log(message);
	};

	const {
		loading: uploadLoading,
		handleImagePicker,
		handleDelete,
	} = useImageUpload(photoType, onUploadSuccess, onUploadError);

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
					<PhotoViewerImage
						imageUrl={imageUrl || ""}
						fallbackImageUrl={getFallbackImageUrl(
							userId,
							"",
							photoType === "profile" ? "avatar" : "cover"
						)}
						loading={uploadLoading}
						photoType={photoType}
					/>
					{isOwnProfile && (
						<PhotoViewerActions
							onUpload={handleImagePicker}
							onDelete={handleDelete}
							loading={uploadLoading}
							hasImage={!!imageUrl}
						/>
					)}
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
