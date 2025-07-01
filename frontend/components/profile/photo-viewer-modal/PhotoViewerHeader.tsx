import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";
import { getStyles } from "./styles";

interface PhotoViewerHeaderProps {
	onClose: () => void;
}

export const PhotoViewerHeader = ({ onClose }: PhotoViewerHeaderProps) => {
	const { colors, isDarkMode } = useTheme();
	const styles = getStyles(colors, isDarkMode);

	return (
		<TouchableOpacity
			style={styles.closeButton}
			onPress={onClose}
			hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
		>
			<Ionicons name="close" size={36} color={"#FFFFFF"} />
		</TouchableOpacity>
	);
};
