import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface VoiceNoteTagsProps {
	styles: any;
	tags: string[];
	hasBackgroundImage: boolean;
	onTagPress: (tag: string) => void;
	colors?: any; // Optional colors prop
}

/**
 * Component for displaying tags in VoiceNoteCard
 */
export const VoiceNoteTags: React.FC<VoiceNoteTagsProps> = ({
	styles,
	tags,
	hasBackgroundImage,
	onTagPress,
	colors, // Extract colors prop
}) => {
	// Skip rendering if no tags
	if (!tags || tags.length === 0) {
		return null;
	}

	// Determine if we should use the "OnImage" variants of styles
	const useOnImageStyles = hasBackgroundImage;

	return (
		<View style={styles.tagsContainer}>
			{tags.slice(0, 10).map((tag, index) => (
				<TouchableOpacity
					key={index}
					style={[styles.tagItem, useOnImageStyles && styles.tagItemOnImage]}
					activeOpacity={0.7}
					onPress={() => onTagPress(tag)}
				>
					<Text
						style={[styles.tagText, useOnImageStyles && styles.tagTextOnImage]}
					>
						#{tag}
					</Text>
				</TouchableOpacity>
			))}
		</View>
	);
};
