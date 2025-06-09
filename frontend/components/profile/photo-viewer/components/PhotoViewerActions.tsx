import React from "react";
import {
	View,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSpacing, getSizes } from "../utils/responsiveUtils";

interface PhotoViewerActionsProps {
	isOwnProfile: boolean;
	modalImageUrl: string | null;
	isLoading: boolean;
	onImagePicker: () => void;
	onDeletePhoto: () => void;
}

export const PhotoViewerActions: React.FC<PhotoViewerActionsProps> = ({
	isOwnProfile,
	modalImageUrl,
	isLoading,
	onImagePicker,
	onDeletePhoto,
}) => {
	const spacing = getSpacing();
	const sizes = getSizes();

	if (!isOwnProfile) return null;

	return (
		<View
			style={[
				styles.actions,
				{
					gap: spacing.buttonGap,
					paddingHorizontal: spacing.contentPadding,
					paddingBottom: spacing.bottomPadding,
					flexDirection: "row",
					justifyContent: "center",
				},
			]}
		>
			<TouchableOpacity
				style={[
					styles.circularButton,
					styles.primaryButton,
					{
						width: sizes.actionButtonHeight,
						height: sizes.actionButtonHeight,
						borderRadius: sizes.actionButtonHeight / 2,
					},
				]}
				onPress={onImagePicker}
				disabled={isLoading}
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="white" />
				) : (
					<Feather name="camera" size={24} color="white" />
				)}
			</TouchableOpacity>

			{modalImageUrl && (
				<TouchableOpacity
					style={[
						styles.circularButton,
						styles.secondaryButton,
						{
							width: sizes.actionButtonHeight,
							height: sizes.actionButtonHeight,
							borderRadius: sizes.actionButtonHeight / 2,
						},
					]}
					onPress={onDeletePhoto}
					disabled={isLoading}
				>
					<Feather name="trash-2" size={24} color="#ff4757" />
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	actions: {
		flexDirection: "row",
		justifyContent: "center",
		zIndex: 10,
	},
	circularButton: {
		alignItems: "center",
		justifyContent: "center",
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
});
