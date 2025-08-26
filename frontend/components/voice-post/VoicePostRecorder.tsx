import React, { useState, useCallback, useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TextInput,
	ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../common/Toast";
import { useVoicePostRecording } from "./hooks/useVoicePostRecording";
import { VoicePostTimer } from "./components/VoicePostTimer";
import { VoicePostWaveform } from "./components/VoicePostWaveform";

const MAX_RECORDING_DURATION = 60; // 60 seconds limit

export function VoicePostRecorder() {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { showToast } = useToast();
	const [caption, setCaption] = useState("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackPosition, setPlaybackPosition] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const {
		isRecording,
		recordingDuration,
		recordingUri,
		isUploading,
		audioBlob,
		startRecording,
		stopRecording,
		clearRecording,
		uploadRecording,
	} = useVoicePostRecording({
		maxDuration: MAX_RECORDING_DURATION,
	});

	const handleStartRecording = useCallback(async () => {
		if (isRecording) {
			await stopRecording();
		} else {
			await startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	const handleClearRecording = useCallback(() => {
		// Stop any playing audio
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setIsPlaying(false);
		setPlaybackPosition(0);
		clearRecording();
		setCaption("");
	}, [clearRecording]);

	const handlePlayPause = useCallback(async () => {
		if (!recordingUri) return;

		try {
			if (isPlaying) {
				// Pause playback
				if (audioRef.current) {
					audioRef.current.pause();
				}
				setIsPlaying(false);
			} else {
				// Start/resume playback
				if (!audioRef.current) {
					// Create new audio element
					const audio = new Audio(recordingUri);
					audioRef.current = audio;

					// Set up event listeners
					audio.ontimeupdate = () => {
						setPlaybackPosition(audio.currentTime);
					};

					audio.onended = () => {
						setIsPlaying(false);
						setPlaybackPosition(0);
						audioRef.current = null;
					};

					audio.onerror = () => {
						console.error("Audio playback error");
						setIsPlaying(false);
						setPlaybackPosition(0);
						audioRef.current = null;
					};
				}

				await audioRef.current.play();
				setIsPlaying(true);
			}
		} catch (error) {
			console.error("Playback error:", error);
			setIsPlaying(false);
			Alert.alert(
				"Playback Error",
				"Failed to play recording. Please try again."
			);
		}
	}, [recordingUri, isPlaying]);

	// Cleanup audio on unmount or when recording changes
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		// Reset playback when recording changes
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setIsPlaying(false);
		setPlaybackPosition(0);
	}, [recordingUri]);

	const handlePost = useCallback(async () => {
		if (!recordingUri || !audioBlob) {
			showToast("Please record a voice note first", "error");
			return;
		}

		try {
			await uploadRecording(caption);
			showToast("Voice note posted successfully!", "success");
			// Navigate back after a short delay to let user see success message
			setTimeout(() => router.back(), 1500);
		} catch (error: any) {
			console.error("Upload error:", error);
			const errorMessage =
				error?.message || "Failed to post voice note. Please try again.";
			showToast(errorMessage, "error", 5000); // Show error for 5 seconds
		}
	}, [recordingUri, audioBlob, caption, uploadRecording, router, showToast]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const timeRemaining = MAX_RECORDING_DURATION - recordingDuration;

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: colors.background }]}
			contentContainerStyle={[
				styles.contentContainer,
				{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 },
			]}
		>
			{/* Header */}
			<View style={[styles.header, { borderBottomColor: colors.border }]}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.headerButton}
				>
					<Feather name="x" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					New Voice Note
				</Text>
				<View style={styles.headerButton} />
			</View>

			{/* Recording Section */}
			<View style={styles.recordingSection}>
				{/* Timer */}
				<VoicePostTimer
					duration={recordingDuration}
					maxDuration={MAX_RECORDING_DURATION}
					isRecording={isRecording}
				/>

				{/* Waveform Visualization */}
				<VoicePostWaveform
					isRecording={isRecording}
					audioBlob={audioBlob}
					duration={recordingDuration}
					isPlaying={isPlaying}
					playbackPosition={playbackPosition}
				/>

				{/* Recording Button */}
				<TouchableOpacity
					style={[
						styles.recordButton,
						{
							backgroundColor: isRecording ? colors.error : colors.tint,
						},
					]}
					onPress={handleStartRecording}
					disabled={isUploading}
				>
					<Feather
						name={isRecording ? "square" : "mic"}
						size={32}
						color={colors.white}
					/>
				</TouchableOpacity>

				{/* Time Remaining */}
				{isRecording && (
					<Text style={[styles.timeRemaining, { color: colors.textSecondary }]}>
						{timeRemaining}s remaining
					</Text>
				)}

				{/* Recording Status */}
				<Text style={[styles.status, { color: colors.textSecondary }]}>
					{isRecording
						? "Recording..."
						: recordingUri
						? "Recording ready"
						: "Tap to start recording"}
				</Text>
			</View>

			{/* Playback Section */}
			{recordingUri && (
				<View style={styles.playbackSection}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>
						Review your recording
					</Text>
					<TouchableOpacity
						style={[
							styles.playButton,
							{
								backgroundColor: isPlaying ? colors.error : colors.tint,
							},
						]}
						onPress={handlePlayPause}
						disabled={isUploading}
					>
						<Feather
							name={isPlaying ? "pause" : "play"}
							size={24}
							color={colors.white}
						/>
					</TouchableOpacity>
					{isPlaying && (
						<Text
							style={[styles.playbackTime, { color: colors.textSecondary }]}
						>
							{formatTime(Math.round(playbackPosition))} /{" "}
							{formatTime(recordingDuration)}
						</Text>
					)}
				</View>
			)}

			{/* Caption Section */}
			{recordingUri && (
				<View style={styles.captionSection}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>
						Add a caption (optional)
					</Text>
					<TextInput
						style={[
							styles.captionInput,
							{
								color: colors.text,
								backgroundColor: colors.card,
								borderColor: colors.border,
							},
						]}
						placeholder="What's on your mind?"
						placeholderTextColor={colors.textSecondary}
						multiline
						maxLength={280}
						value={caption}
						onChangeText={setCaption}
					/>
					<Text style={[styles.charCount, { color: colors.textSecondary }]}>
						{caption.length}/280
					</Text>
				</View>
			)}

			{/* Action Buttons */}
			{recordingUri && (
				<View style={styles.actionButtons}>
					<TouchableOpacity
						style={[
							styles.actionButton,
							styles.clearButton,
							{ borderColor: colors.border },
						]}
						onPress={handleClearRecording}
						disabled={isUploading}
					>
						<Text style={[styles.clearButtonText, { color: colors.text }]}>
							Clear
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.actionButton,
							styles.postButton,
							{ backgroundColor: colors.tint },
							isUploading && { opacity: 0.6 },
						]}
						onPress={handlePost}
						disabled={isUploading}
					>
						<Text style={[styles.postButtonText, { color: colors.white }]}>
							{isUploading ? "Posting..." : "Post"}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		flexGrow: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	headerButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
	},
	recordingSection: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	recordButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 24,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
	},
	timeRemaining: {
		fontSize: 16,
		marginTop: 8,
	},
	status: {
		fontSize: 14,
		marginTop: 8,
		textAlign: "center",
	},
	playbackSection: {
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0,0,0,0.1)",
	},
	playButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 12,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	playbackTime: {
		fontSize: 14,
		marginTop: 8,
	},
	captionSection: {
		paddingHorizontal: 16,
		paddingVertical: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 12,
	},
	captionInput: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		minHeight: 80,
		textAlignVertical: "top",
	},
	charCount: {
		fontSize: 12,
		marginTop: 8,
		textAlign: "right",
	},
	actionButtons: {
		flexDirection: "row",
		paddingHorizontal: 16,
		paddingBottom: 20,
		gap: 12,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	clearButton: {
		borderWidth: 1,
	},
	clearButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	postButton: {
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	postButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
});
