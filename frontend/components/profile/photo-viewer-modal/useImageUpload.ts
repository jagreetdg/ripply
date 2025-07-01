import { useState } from "react";
import { Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useUser } from "../../../context/UserContext";
import { updateUserProfile, UpdateUserProfileParams } from "../../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConfirmation } from "../../../hooks/useConfirmation";

type PhotoType = "profile" | "cover";

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Accurately get base64 string length
const getBase64Size = (base64: string) => {
	// (3/4) * length of base64 string - padding
	return (base64.length * 3) / 4 - (base64.endsWith("==") ? 2 : 1);
};

export const useImageUpload = (
	photoType: PhotoType,
	onSuccess: (newUrl: string, localUri: string) => void,
	onError: (message: string) => void,
	onPickImage: (uri: string) => void,
) => {
	const [loading, setLoading] = useState(false);
	const [action, setAction] = useState<"upload" | "delete" | null>(null);
	const { user, setUser } = useUser();
	const { showConfirmation } = useConfirmation();

	const handleImagePicker = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission Denied",
				"Sorry, we need camera roll permissions to make this work!"
			);
			return;
		}

		// Available options debug log removed to prevent spam

		// Use the modern approach with array of MediaType, with fallbacks for compatibility
		let mediaTypes: any;
		if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
			mediaTypes = [ImagePicker.MediaType.Images];
		} else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
			mediaTypes = ImagePicker.MediaTypeOptions.Images;
		} else {
			mediaTypes = "Images";
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes,
			allowsEditing: true,
			aspect: photoType === "profile" ? [1, 1] : [16, 9],
			quality: 1,
		});

		if (result.canceled) return;
		
		setAction("upload");
		setLoading(true);
		const asset = result.assets[0];

		try {
			// Immediately process the image to a base64 string
			// This avoids all issues with blob URLs. The user sees a loading indicator
			// for a moment, and then a stable preview.
			const base64Uri = await processImage(asset);
			
			// Show the processed preview
			onPickImage(base64Uri);

			// Now, attempt the upload
			await updatePhoto(base64Uri);

		} catch (err: any) {
			console.error("Upload process error:", err);
			onError(err.message || "Failed to process image.");
			setLoading(false);
			setAction(null);
		}
	};

	const handleDelete = async () => {
		console.log("[Delete] Initiating delete for", photoType);
		if (!user) {
			console.error("[Delete] Aborted: No user found.");
			return;
		}

		console.log("[Delete] Bypassing confirmation for debugging. Setting loading state.");
		setAction("delete");
		setLoading(true);
		try {
			const body =
				photoType === "profile"
					? { avatar_url: null }
					: { cover_photo_url: null };

			console.log("[Delete] Calling API with body:", body);
			const updatedProfile = await updateUserProfile(user.id, body);
			console.log("[Delete] API call successful:", updatedProfile);

			const updatedUser = { ...user, ...updatedProfile };
			setUser(updatedUser as any);
			await AsyncStorage.setItem("@ripply_user", JSON.stringify(updatedUser));
			
			console.log("[Delete] Calling onSuccess to update UI.");
			onSuccess("", ""); // Signal success with empty URLs
		} catch (error) {
			console.error("[Delete] API call failed:", error);
			onError("Failed to delete photo.");
		} finally {
			console.log("[Delete] Resetting loading state.");
			setLoading(false);
			setAction(null);
		}
	};

	const processImage = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
		if (Platform.OS === "web") {
			let quality = 0.1; 
			let width = 300; 
			let result = await ImageManipulator.manipulateAsync(
				asset.uri,
				[{ resize: { width } }],
				{
					compress: quality,
					format: ImageManipulator.SaveFormat.JPEG,
					base64: true,
				}
			);

			let attempts = 0;
			while (getBase64Size(result.base64 || "") > 50 * 1024 && attempts < 12) {
				quality = Math.max(0.005, quality * 0.7);
				width = Math.max(120, width - 20);
				
				result = await ImageManipulator.manipulateAsync(
					asset.uri,
					[{ resize: { width } }],
					{
						compress: quality,
						format: ImageManipulator.SaveFormat.JPEG,
						base64: true,
					}
				);
				console.log(`[COMPRESSION] Web Attempt ${attempts + 1}: Size=${(getBase64Size(result.base64 || "") / 1024).toFixed(1)}KB, Quality=${quality.toFixed(3)}, Width=${width}`);
				attempts++;
			}
			return `data:image/jpeg;base64,${result.base64}`;
		} else {
			// Native compression
			const result = await ImageManipulator.manipulateAsync(
				asset.uri,
				[{ resize: { width: 600 } }],
				{ compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
			);
			return `data:image/jpeg;base64,${result.base64}`;
		}
	};

	const updatePhoto = async (base64Uri: string) => {
		if (!user) return setLoading(false);
		try {
			const finalSize = getBase64Size(base64Uri.split(",")[1]);
			console.log(`[UPLOAD] Final upload size: ${(finalSize / 1024).toFixed(1)}KB`);
			if (finalSize > 60 * 1024) { 
				throw new Error(`Image is too large: ${(finalSize / 1024).toFixed(1)}KB. Server limit appears to be very strict.`);
			}

			const updateData: UpdateUserProfileParams =
				photoType === "profile"
					? { avatar_url: base64Uri }
					: { cover_photo_url: base64Uri };
			const updatedProfile = await updateUserProfile(user.id, updateData);
			const newUrl =
				photoType === "profile"
					? updatedProfile.avatar_url
					: updatedProfile.cover_photo_url;
			const updatedUser = { ...user, ...updatedProfile };
			setUser(updatedUser as any);
			await AsyncStorage.setItem("@ripply_user", JSON.stringify(updatedUser));
			onSuccess(newUrl || "", base64Uri);
		} catch (error: any) {
			console.error("Upload Failed:", error);
			const errorMessage =
				error.response?.status === 413
					? "Upload failed. Image is still too large after compression."
					: "Upload failed. Please try again.";
			onError(errorMessage);
		} finally {
			setLoading(false);
			setAction(null);
		}
	};

	return { loading, action, handleImagePicker, handleDelete };
}; 