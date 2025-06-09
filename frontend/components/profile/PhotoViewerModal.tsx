import React from "react";
import {
	View,
	StyleSheet,
	Modal,
	Platform,
	StatusBar,
	Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usePhotoViewer } from "./photo-viewer/hooks/usePhotoViewer";
import {
	PhotoViewerHeader,
	PhotoViewerContent,
	PhotoViewerActions,
} from "./photo-viewer/components";
import { PhotoViewerModalProps } from "./photo-viewer/types";

export function PhotoViewerModal(props: PhotoViewerModalProps) {
	const {
		state,
		handleSafeClose,
		handleImagePicker,
		handleDeletePhoto,
		setIsImageLoading,
		ConfirmationComponent,
	} = usePhotoViewer(props);

	const { visible, photoType, isOwnProfile } = props;

	return (
		<>
			{state.mounted && visible && (
				<Modal
					visible={visible}
					transparent
					animationType="fade"
					statusBarTranslucent
					onRequestClose={handleSafeClose}
				>
					{Platform.OS === "ios" && <StatusBar barStyle="light-content" />}

					{/* Full screen container */}
					<View style={styles.container}>
						{/* Background */}
						<LinearGradient
							colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.95)"]}
							style={StyleSheet.absoluteFillObject}
						/>

						{/* Backdrop - clickable area that closes modal */}
						<Pressable style={styles.backdrop} onPress={handleSafeClose} />

						{/* Header */}
						<PhotoViewerHeader onClose={handleSafeClose} />

						{/* Content */}
						<PhotoViewerContent
							modalImageUrl={state.modalImageUrl}
							photoType={photoType}
							isImageLoading={state.isImageLoading}
							onImageLoad={() => setIsImageLoading(false)}
							onImageError={() => setIsImageLoading(false)}
						/>

						{/* Actions */}
						<PhotoViewerActions
							isOwnProfile={isOwnProfile}
							modalImageUrl={state.modalImageUrl}
							isLoading={state.isLoading}
							onImagePicker={handleImagePicker}
							onDeletePhoto={handleDeletePhoto}
						/>
					</View>
				</Modal>
			)}

			{/* Confirmation Modal */}
			{state.mounted && <ConfirmationComponent />}
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		zIndex: 1,
	},
});
