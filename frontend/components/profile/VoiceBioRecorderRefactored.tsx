import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { createOrUpdateVoiceBio, deleteVoiceBio } from "../../services/api";
import { useVoiceRecording } from "./hooks/useVoiceRecording";
import { useAudioPlayback } from "./hooks/useAudioPlayback";
import { VoiceRecorderControls } from "./components/VoiceRecorderControls";

interface VoiceBioRecorderProps {
	userId: string;
	onVoiceBioUpdated: () => void;
	existingVoiceBio?: {
		id: string;
		audio_url: string;
		duration: number;
		transcript?: string;
	} | null;
}

export function VoiceBioRecorderRefactored({
	userId,
	onVoiceBioUpdated,
	existingVoiceBio,
}: VoiceBioRecorderProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [currentDuration, setCurrentDuration] = useState(
		existingVoiceBio?.duration || 0
	);

	// Use the modular hooks
	const {
		isRecording,
		recordingDuration,
		recordingUri,
		startRecording,
		stopRecording,
		clearRecording,
	} = useVoiceRecording({
		maxDuration: 60,
		onRecordingComplete: (uri, duration) => {
			setCurrentDuration(duration);
		},
	});

	const { isPlaying, playAudio, pauseAudio, unloadAudio } = useAudioPlayback({
		audioUri: recordingUri || existingVoiceBio?.audio_url,
	});

	// Update duration when existing voice bio changes
	useEffect(() => {
		if (existingVoiceBio?.duration && !recordingUri) {
			setCurrentDuration(existingVoiceBio.duration);
		}
	}, [existingVoiceBio, recordingUri]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			unloadAudio();
		};
	}, []);

	const handlePlayPause = () => {
		if (isPlaying) {
			pauseAudio();
		} else {
			const audioUri = recordingUri || existingVoiceBio?.audio_url;
			if (audioUri) {
				playAudio(audioUri);
			}
		}
	};

	const handleSave = async () => {
		if (!recordingUri && !existingVoiceBio?.audio_url) {
			Alert.alert("Error", "Please record a voice bio first.");
			return;
		}

		setIsUploading(true);
		try {
			const audioUrl = recordingUri || existingVoiceBio?.audio_url || "";

			await createOrUpdateVoiceBio(userId, {
				audio_url: audioUrl,
				duration: currentDuration,
				transcript: "",
			});

			Alert.alert("Success", "Voice bio saved successfully!");
			clearRecording();
			onVoiceBioUpdated();
		} catch (error) {
			console.error("Error saving voice bio:", error);
			Alert.alert("Error", "Failed to save voice bio. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async () => {
		Alert.alert(
			"Delete Voice Bio",
			"Are you sure you want to delete your voice bio? This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							setIsUploading(true);
							await deleteVoiceBio(userId);
							Alert.alert("Success", "Voice bio deleted successfully!");
							clearRecording();
							setCurrentDuration(0);
							onVoiceBioUpdated();
						} catch (error) {
							console.error("Error deleting voice bio:", error);
							Alert.alert(
								"Error",
								"Failed to delete voice bio. Please try again."
							);
						} finally {
							setIsUploading(false);
						}
					},
				},
			]
		);
	};

	const hasRecording = !!(recordingUri || existingVoiceBio?.audio_url);
	const displayDuration = isRecording ? recordingDuration : currentDuration;

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Voice Bio</Text>
			<Text style={styles.description}>
				Record a short introduction for your profile (max 60 seconds)
			</Text>

			<VoiceRecorderControls
				isRecording={isRecording}
				isPlaying={isPlaying}
				isUploading={isUploading}
				hasRecording={hasRecording}
				recordingDuration={displayDuration}
				onStartRecording={startRecording}
				onStopRecording={stopRecording}
				onPlayPause={handlePlayPause}
				onSave={handleSave}
				onDelete={handleDelete}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: "#f8f8f8",
		borderRadius: 12,
		marginVertical: 10,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
		color: "#6B2FBC",
	},
	description: {
		fontSize: 14,
		color: "#666",
		marginBottom: 16,
		lineHeight: 20,
	},
});
