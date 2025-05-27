import React from "react";
import {
	View,
	TouchableWithoutFeedback,
	GestureResponderEvent,
} from "react-native";
import { getStyles } from "./VoiceNoteCardStyles"; // Path remains ./ since it will be in the same folder

interface VoiceNoteProgressBarProps {
	progress: number;
	colors: any;
	isDarkMode: boolean;
	hasBackgroundImage: boolean;
	onProgressBarPress: (event: GestureResponderEvent) => void;
	onProgressBarDrag: (event: GestureResponderEvent) => void;
	onProgressBarRelease: () => void;
	progressContainerRef: React.RefObject<View>;
}

/**
 * Progress bar component for audio playback in VoiceNoteCard
 */
export const VoiceNoteProgressBar: React.FC<VoiceNoteProgressBarProps> = ({
	progress,
	colors,
	isDarkMode,
	hasBackgroundImage,
	onProgressBarPress,
	onProgressBarDrag,
	onProgressBarRelease,
	progressContainerRef,
}) => {
	// Get the styles using the styles function
	const styles = getStyles(colors, isDarkMode, hasBackgroundImage);

	// Determine if we should use the "OnImage" variants of styles
	const useOnImageStyles = hasBackgroundImage;

	return (
		<TouchableWithoutFeedback
			onPress={onProgressBarPress}
			onPressIn={onProgressBarPress}
			onLongPress={onProgressBarDrag}
			delayLongPress={200}
			hitSlop={styles.seekBarHitSlop}
			onPressOut={onProgressBarRelease}
		>
			<View ref={progressContainerRef} style={styles.progressContainer}>
				<View
					style={[
						styles.progressBackground,
						useOnImageStyles && styles.progressBackgroundOnImage,
					]}
				/>
				<View
					style={[
						styles.progressBar,
						useOnImageStyles && styles.progressBarOnImage,
						{ width: `${progress * 100}%` },
					]}
				/>
				<View
					style={[
						styles.progressKnob,
						useOnImageStyles && styles.progressKnobOnImage,
						{
							left: `${progress * 100}%`,
							transform: [{ translateX: -6 }], // Half the width of the knob
						},
					]}
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};
