import React from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { getStyles } from "./styles";

interface PhotoViewerActionsProps {
	onUpload: () => void;
	onDelete: () => void;
	loading: boolean;
	hasImage: boolean;
}

export const PhotoViewerActions = ({
	onUpload,
	onDelete,
	loading,
	hasImage,
}: PhotoViewerActionsProps) => {
	const { colors, isDarkMode } = useTheme();
	const styles = getStyles(colors, isDarkMode);

	// Use different container style based on button count
	const containerStyle = hasImage
		? styles.actionsContainer
		: styles.actionsContainerSingle;

	return (
		<View style={containerStyle}>
			<TouchableOpacity
				style={[styles.button, styles.iconButton]}
				onPress={onUpload}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator size="small" color="#FFF" />
				) : (
					<Feather name="upload" size={20} color="#FFF" />
				)}
			</TouchableOpacity>
			{hasImage && (
				<TouchableOpacity
					style={[styles.button, styles.iconButton, styles.deleteButton]}
					onPress={onDelete}
					disabled={loading}
				>
					<Feather name="trash-2" size={20} color="#FFF" />
				</TouchableOpacity>
			)}
		</View>
	);
};
