import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

interface VoicePostTimerProps {
	duration: number; // in seconds
	maxDuration: number; // in seconds
	isRecording: boolean;
}

export function VoicePostTimer({
	duration,
	maxDuration,
	isRecording,
}: VoicePostTimerProps) {
	const { colors } = useTheme();

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatMaxTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const progress = duration / maxDuration;
	const isNearLimit = progress > 0.8; // Show warning when 80% complete

	return (
		<View style={styles.container}>
			{/* Timer Display */}
			<Text
				style={[
					styles.timeText,
					{
						color: isNearLimit ? colors.error : colors.text,
						fontWeight: isRecording ? "bold" : "normal",
					},
				]}
			>
				{formatTime(duration)} / {formatMaxTime(maxDuration)}
			</Text>

			{/* Progress Bar */}
			<View
				style={[styles.progressContainer, { backgroundColor: colors.border }]}
			>
				<View
					style={[
						styles.progressBar,
						{
							width: `${Math.min(progress * 100, 100)}%`,
							backgroundColor: isNearLimit ? colors.error : colors.tint,
						},
					]}
				/>
			</View>

			{/* Recording Indicator */}
			{isRecording && (
				<View style={styles.recordingIndicator}>
					<View
						style={[styles.recordingDot, { backgroundColor: colors.error }]}
					/>
					<Text style={[styles.recordingText, { color: colors.textSecondary }]}>
						Recording...
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		marginVertical: 16,
	},
	timeText: {
		fontSize: 24,
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
		marginBottom: 12,
	},
	progressContainer: {
		width: 200,
		height: 4,
		borderRadius: 2,
		overflow: "hidden",
		marginBottom: 12,
	},
	progressBar: {
		height: "100%",
		borderRadius: 2,
		// transition: "width 0.3s ease", // Web-only property
	},
	recordingIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	recordingDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	recordingText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
