import { useState } from "react";
import { Platform, Alert, ToastAndroid } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { useUser } from "../../../context/UserContext";
import { updateUserProfile, UpdateUserProfileParams } from "../../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PhotoType = "profile" | "cover";

const getFileSize = async (uri: string): Promise<number> => {
  if (Platform.OS === "web") {
    try {
      // For web, fetch the blob and get its size
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.warn("Could not get file size on web:", error);
      return 0;
    }
  } else {
    // For native platforms
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists ? fileInfo.size : 0;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const compressImageIfNeeded = async (
  uri: string,
  photoType: PhotoType
): Promise<{ uri: string; error?: string }> => {
  try {
    const originalSize = await getFileSize(uri);
    // Use more aggressive, platform-aware target size
    const TARGET_SIZE_BYTES =
      Platform.OS === "web" ? 80 * 1024 : 750 * 1024; // 80KB for web, 750KB for native

    if (originalSize < TARGET_SIZE_BYTES) {
      console.log(
        `Image size (${formatFileSize(
          originalSize
        )}) is already under target (${formatFileSize(
          TARGET_SIZE_BYTES
        )}). No compression needed.`
      );
      return { uri };
    }

    console.log(
      `Starting compression. Original size: ${formatFileSize(
        originalSize
      )}, Target: ${formatFileSize(TARGET_SIZE_BYTES)}`
    );

    let currentUri = uri;
    let currentSize = originalSize;
    let compressionQuality = 0.9;

    // Use platform-aware dimensions
    let currentMaxWidth;
    if (Platform.OS === "web") {
      currentMaxWidth = photoType === "cover" ? 400 : 200;
    } else {
      currentMaxWidth = photoType === "cover" ? 1000 : 600;
    }

    const minQuality = 0.2; // Allow more aggressive compression
    let pass = 1;

    while (
      currentSize > TARGET_SIZE_BYTES &&
      compressionQuality >= minQuality &&
      pass < 8 // Increase pass limit slightly more
    ) {
      console.log(
        `[COMPRESSION] Pass ${pass}: Quality=${compressionQuality.toFixed(
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
        `[COMPRESSION] Pass ${pass} complete. New size: ${formatFileSize(
          currentSize
        )}`
      );

      // Aggressively reduce quality and size for the next pass
      compressionQuality -= 0.1; // Reduce quality

      // ALWAYS reduce dimensions in each pass until a floor is hit
      if (currentMaxWidth > 100) {
        // Set a hard minimum of 100px
        currentMaxWidth = Math.floor(currentMaxWidth * 0.85); // Reduce by 15%
      }

      pass++;
    }

    if (currentSize > TARGET_SIZE_BYTES) {
      const errorMsg = `Could not compress image under ${formatFileSize(
        TARGET_SIZE_BYTES
      )}. Final size: ${formatFileSize(currentSize)}`;
      console.error(`[COMPRESSION] Error: ${errorMsg}`);
      return { uri, error: errorMsg };
    }

    console.log(
      `[COMPRESSION] Finished. Final size: ${formatFileSize(currentSize)}`
    );
    return { uri: currentUri };
  } catch (error) {
    console.error("Compression Error:", error);
    return { uri, error: "Failed to compress image." };
  }
};

export const useImageUpload = (
  photoType: PhotoType,
  onSuccess: (newUrl: string, localUri: string) => void,
  onError: (message: string) => void
) => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleImagePicker = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please grant permission to access your photos.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: photoType === "profile" ? [1, 1] : [16, 9],
        quality: 1,
      });

      if (result.canceled) return;

      setLoading(true);

      const pickedUri = result.assets[0].uri;
      const compressionResult = await compressImageIfNeeded(pickedUri, photoType);

      if (compressionResult.error) {
        onError(compressionResult.error);
        setLoading(false);
        return;
      }
      await updatePhoto(compressionResult.uri);
    } catch (error) {
      console.error("Image Picker Error:", error);
      onError("Failed to pick image. Please try again.");
      setLoading(false);
    }
  };

  const updatePhoto = async (newImageUri: string) => {
    if (!user) return;

    try {
      let base64Uri: string;
      if (Platform.OS === "web") {
        // For web, always use fetch/blob approach
        const response = await fetch(newImageUri);
        const blob = await response.blob();
        base64Uri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        // For native platforms, use FileSystem
        const base64 = await FileSystem.readAsStringAsync(newImageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Uri = `data:image/jpeg;base64,${base64}`;
      }

      const updateData: UpdateUserProfileParams =
        photoType === "profile"
          ? { avatar_url: base64Uri }
          : { cover_photo_url: base64Uri };

      const updatedProfile = await updateUserProfile(user.id, updateData);
      const newUrl = photoType === "profile" ? updatedProfile.avatar_url : updatedProfile.cover_photo_url;

      const updatedUser = { ...user, ...updatedProfile };
      setUser(updatedUser as any);
      await AsyncStorage.setItem("@ripply_user", JSON.stringify(updatedUser));

      onSuccess(newUrl || "", base64Uri);
    } catch (error) {
      console.error("Upload Failed:", error);
      onError("Upload failed. The image might be too large.");
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleImagePicker };
}; 