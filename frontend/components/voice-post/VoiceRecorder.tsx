import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	Alert,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useVoiceRecording } from "./hooks/useVoiceRecording";
import { VoiceWaveform } from "./VoiceWaveform";

interface VoiceRecorderProps {
	onRecordingComplete?: (uri: string) => void;
	onUploadComplete?: () => void;
}

export function VoiceRecorder({
	onRecordingComplete,
	onUploadComplete,
}: VoiceRecorderProps) {
	const [caption, setCaption] = useState("");

	const {
		isRecording,
		recordingDuration,
		recordingUri,
		isUploading,
		startRecording,
		stopRecording,
		clearRecording,
		uploadRecording,
	} = useVoiceRecording({ maxDuration: 60 });

	const handleStartRecording = useCallback(async () => {
		if (isRecording) {
			await stopRecording();
		} else {
			await startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	const handleClearRecording = useCallback(() => {
		clearRecording();
		setCaption("");
	}, [clearRecording]);

	const handleUpload = useCallback(async () => {
		if (!recordingUri) {
			Alert.alert("Error", "Please record a voice note first");
			return;
		}

		try {
			await uploadRecording(caption);
			Alert.alert("Success", "Voice note uploaded successfully!");
			onUploadComplete?.();
		} catch (error) {
			console.error("Upload error:", error);
			Alert.alert("Error", "Failed to upload voice note. Please try again.");
		}
	}, [recordingUri, caption, uploadRecording, onUploadComplete]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<View style={styles.container}>
			{/* Recording Section */}
			<View style={styles.recordingSection}>
				{/* Record Button */}
				<TouchableOpacity
					style={[
						styles.recordButton,
						{
							backgroundColor: isRecording ? "#EF4444" : "#8B5CF6",
						},
					]}
					onPress={handleStartRecording}
					disabled={isUploading}
				>
					<Feather
						name={isRecording ? "square" : "mic"}
						size={32}
						color="#FFFFFF"
					/>
				</TouchableOpacity>

				{/* Timer */}
				<Text style={styles.timerText}>{formatTime(recordingDuration)}</Text>

				{/* Waveform */}
				<VoiceWaveform isRecording={isRecording} duration={recordingDuration} />

				{/* Recording Status */}
				{isRecording && <Text style={styles.recordingText}>Recording...</Text>}
			</View>

			{/* Caption Section - Only show after recording */}
			{recordingUri && (
				<View style={styles.captionSection}>
					<Text style={styles.sectionTitle}>Add a caption</Text>
					<TextInput
						style={styles.captionInput}
						placeholder="What's your story? Share your thoughts..."
						placeholderTextColor="#9CA3AF"
						multiline
						numberOfLines={3}
						maxLength={280}
						value={caption}
						onChangeText={setCaption}
						textAlignVertical="top"
					/>
					<Text style={styles.charCount}>{caption.length}/280</Text>
				</View>
			)}

			{/* Action Buttons - Only show after recording */}
			{recordingUri && (
				<View style={styles.actionButtons}>
					<TouchableOpacity
						style={styles.clearButton}
						onPress={handleClearRecording}
						disabled={isUploading}
					>
						<Feather name="trash-2" size={20} color="#EF4444" />
						<Text style={styles.clearButtonText}>Clear</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.uploadButton,
							{
								backgroundColor:
									!caption.trim() || isUploading ? "#9CA3AF" : "#8B5CF6",
							},
						]}
						onPress={handleUpload}
						disabled={isUploading || !caption.trim()}
					>
						<Feather
							name="send"
							size={20}
							color="#FFFFFF"
							style={{ marginRight: 8 }}
						/>
						<Text style={styles.uploadButtonText}>
							{isUploading ? "Uploading..." : "Upload"}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#FFFFFF",
	},
	recordingSection: {
		alignItems: "center",
		marginVertical: 40,
	},
	recordButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 20,
		elevation: 4,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	timerText: {
		fontSize: 24,
		fontWeight: "600",
		fontFamily: "monospace",
		color: "#1F2937",
		marginBottom: 10,
	},
	recordingText: {
		fontSize: 16,
		color: "#EF4444",
		fontWeight: "500",
	},
	captionSection: {
		marginBottom: 30,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F2937",
		marginBottom: 12,
	},
	captionInput: {
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		minHeight: 80,
		textAlignVertical: "top",
		marginBottom: 8,
		color: "#1F2937",
	},
	charCount: {
		fontSize: 12,
		color: "#9CA3AF",
		textAlign: "right",
	},
	actionButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	clearButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#EF4444",
	},
	clearButtonText: {
		color: "#EF4444",
		fontSize: 16,
		fontWeight: "500",
		marginLeft: 8,
	},
	uploadButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 12,
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	uploadButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});
