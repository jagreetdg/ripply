import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { getStyles } from "../VoiceNotesListStyles";

interface VoiceNotesListSeparatorProps {
	listHeaderComponent?: React.ReactNode;
}

export const VoiceNotesListSeparator: React.FC<
	VoiceNotesListSeparatorProps
> = ({ listHeaderComponent }) => {
	const { colors, isDarkMode } = useTheme();
	const styles = getStyles(colors, listHeaderComponent, isDarkMode);

	return (
		<View style={styles.separatorContainer}>
			<View style={styles.separatorLine} />
			<View style={styles.separatorDot} />
			<View style={styles.separatorLine} />
		</View>
	);
};
