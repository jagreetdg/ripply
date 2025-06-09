import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSpacing, getSizes, isTablet } from "../utils/responsiveUtils";

interface PhotoViewerHeaderProps {
	onClose: () => void;
}

export const PhotoViewerHeader: React.FC<PhotoViewerHeaderProps> = ({
	onClose,
}) => {
	const spacing = getSpacing();
	const sizes = getSizes();

	return (
		<View
			style={[
				styles.header,
				{
					paddingHorizontal: spacing.headerPadding,
					paddingTop:
						Platform.OS === "ios" ? (isTablet ? 80 : 60) : isTablet ? 60 : 40,
					paddingBottom: spacing.headerPadding / 2,
				},
			]}
		>
			<View style={styles.headerLeft} />
			<TouchableOpacity
				style={[
					styles.closeButton,
					{
						width: sizes.closeButton,
						height: sizes.closeButton,
						borderRadius: sizes.closeButton / 2,
					},
				]}
				onPress={onClose}
			>
				<Feather name="x" size={sizes.closeIcon} color="white" />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		zIndex: 10,
	},
	headerLeft: {
		flex: 1,
	},
	closeButton: {
		backgroundColor: "rgba(255,255,255,0.1)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.2)",
	},
});
