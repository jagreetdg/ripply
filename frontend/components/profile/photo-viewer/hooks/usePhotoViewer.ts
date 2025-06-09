import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../../../../context/UserContext";
import { useGlobalToast } from "../../../common/Toast";
import {
	useConfirmation,
	confirmationPresets,
} from "../../../../hooks/useConfirmation";
import { updateUserProfile } from "../../../../services/api/userService";
import { compressImageIfNeeded } from "../utils/imageUtils";
import { PhotoViewerModalProps, PhotoViewerState } from "../types";

export const usePhotoViewer = ({
	visible,
	onClose,
	photoType,
	imageUrl,
	userId,
	isOwnProfile,
	onPhotoUpdated,
}: PhotoViewerModalProps) => {
	const { user, setUser } = useUser();
	const { showToast } = useGlobalToast();
	const { ConfirmationComponent, showConfirmation } = useConfirmation();

	const [state, setState] = useState<PhotoViewerState>({
		mounted: false,
		isLoading: false,
		isImageLoading: true,
		currentImageUrl: null,
		modalImageUrl: null,
	});

	// Initialize state when modal becomes visible
	useEffect(() => {
		if (visible) {
			setState(prev => ({
				...prev,
				mounted: true,
				currentImageUrl: imageUrl || null,
				modalImageUrl: imageUrl || null,
				isImageLoading: !!imageUrl,
			}));
		} else {
			setState(prev => ({
				...prev,
				mounted: false,
			}));
		}
	}, [visible, imageUrl]);

	// Handle keyboard events for web
	useEffect(() => {
		if (!visible || Platform.OS !== "web") return;

		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleSafeClose();
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [visible]);

	const handleSafeClose = useCallback(async () => {
		if (state.isLoading) {
			const confirmed = await showConfirmation({
				...confirmationPresets.save("changes"),
				title: "Upload in Progress",
				message:
					"A photo upload is currently in progress. Are you sure you want to close?",
				confirmText: "Close Anyway",
			});
			
			if (confirmed) {
				setState(prev => ({ ...prev, isLoading: false }));
				onClose();
			}
		} else {
			onClose();
		}
	}, [state.isLoading, onClose, showConfirmation]);

	const handleImagePicker = useCallback(async () => {
		if (!isOwnProfile || state.isLoading) return;

		try {
			// Request permissions
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (permissionResult.granted === false) {
				showToast(
					"Permission to access camera roll is required!",
					"error"
				);
				return;
			}

			// Launch image picker
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: photoType === "profile" ? [1, 1] : [3, 1],
				quality: 1,
				base64: Platform.OS === "web",
			});

			if (!result.canceled && result.assets[0]) {
				const selectedImage = result.assets[0];
				await updatePhoto(selectedImage.uri);
			}
		} catch (error) {
			console.error("[PHOTO VIEWER] Image picker error:", error);
			showToast("Failed to select image. Please try again.", "error");
		}
	}, [isOwnProfile, state.isLoading, photoType, showToast]);

	const updatePhoto = useCallback(async (newImageUri: string) => {
		if (!photoType || !user) return;

		setState(prev => ({ ...prev, isLoading: true }));

		try {
			console.log("[PHOTO VIEWER] Starting photo update process");

			// Compress image if needed
			const compressionResult = await compressImageIfNeeded(
				newImageUri,
				photoType
			);

			console.log("[PHOTO VIEWER] Compression result:", {
				wasCompressed: compressionResult.wasCompressed,
				originalSize: compressionResult.originalSize,
				newSize: compressionResult.newSize,
			});

			// Update via API
			const updateData = {
				[photoType === "profile" ? "avatar_url" : "cover_photo_url"]:
					compressionResult.uri,
			};

			const result = await updateUserProfile(user.id, updateData);

			if (result && user) {
				console.log("[PHOTO VIEWER] Update successful, updating user data");

				// Create updated user object
				const updatedUser = {
					...user,
					...result,
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
						"[PHOTO VIEWER] ✅ Updated AsyncStorage after photo update"
					);
				} catch (storageError) {
					console.error(
						"[PHOTO VIEWER] ❌ Error updating AsyncStorage:",
						storageError
					);
				}

				// Update local state immediately for better UX
				const newPhotoUrl =
					photoType === "profile"
						? updatedUser.avatar_url
						: updatedUser.cover_photo_url;

				setState(prev => ({
					...prev,
					currentImageUrl: newPhotoUrl || null,
					modalImageUrl: newPhotoUrl || null,
				}));

				// Notify parent component
				if (onPhotoUpdated) {
					onPhotoUpdated(photoType, newPhotoUrl || null);
				}

				// Show success message
				showToast(
					`${
						photoType === "profile" ? "Profile" : "Cover"
					} photo updated successfully!`,
					"success"
				);

				// Close modal
				handleSafeClose();
			} else {
				console.error("[PHOTO VIEWER] Update failed - no result returned");
				showToast("Failed to update photo. Please try again.", "error");
			}
		} catch (error) {
			console.error("[PHOTO VIEWER] Update error:", error);
			showToast("Failed to update photo. Please try again.", "error");
		} finally {
			setState(prev => ({ ...prev, isLoading: false }));
		}
	}, [photoType, user, setUser, onPhotoUpdated, showToast, handleSafeClose]);

	const handleDeletePhoto = useCallback(async () => {
		if (!photoType || !user || !state.modalImageUrl) return;

		const confirmed = await showConfirmation({
			...confirmationPresets.delete("photo"),
			title: `Delete ${photoType === "profile" ? "Profile" : "Cover"} Photo`,
			message: `Are you sure you want to delete your ${
				photoType === "profile" ? "profile" : "cover"
			} photo? This action cannot be undone.`,
		});

		if (!confirmed) return;

		setState(prev => ({ ...prev, isLoading: true }));

		try {
			console.log("[PHOTO VIEWER] Starting photo deletion");

			// Update via API
			const updateData = {
				[photoType === "profile" ? "avatar_url" : "cover_photo_url"]: null,
			};

			const result = await updateUserProfile(user.id, updateData);

			if (result && user) {
				console.log("[PHOTO VIEWER] Delete successful, updating user data");

				// Create updated user object with the photo removed
				const updatedUser = {
					...user,
					...result,
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
				setState(prev => ({
					...prev,
					currentImageUrl: null,
					modalImageUrl: null,
				}));

				// Notify parent component
				if (onPhotoUpdated) {
					onPhotoUpdated(photoType, null);
				}

				// Show success message
				showToast(
					`${
						photoType === "profile" ? "Profile" : "Cover"
					} photo deleted successfully!`,
					"success"
				);

				// Close modal
				handleSafeClose();
			} else {
				console.error("[PHOTO VIEWER] Delete failed - no result returned");
				showToast("Failed to delete photo. Please try again.", "error");
			}
		} catch (error) {
			console.error("[PHOTO VIEWER] Delete error:", error);
			showToast("Failed to delete photo. Please try again.", "error");
		} finally {
			setState(prev => ({ ...prev, isLoading: false }));
		}
	}, [
		photoType,
		user,
		state.modalImageUrl,
		setUser,
		onPhotoUpdated,
		showToast,
		handleSafeClose,
		showConfirmation,
	]);

	const setIsImageLoading = useCallback((loading: boolean) => {
		setState(prev => ({ ...prev, isImageLoading: loading }));
	}, []);

	return {
		state,
		handleSafeClose,
		handleImagePicker,
		handleDeletePhoto,
		setIsImageLoading,
		ConfirmationComponent,
	};
}; 