import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	ScrollView,
	Animated,
	Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../common/Toast";
import { useVoicePostRecording } from "./hooks/useVoicePostRecording";
import { VoicePostWaveform } from "./components/VoicePostWaveform";

const MAX_RECORDING_DURATION = 60; // 60 seconds limit

// Purple color hierarchy for different importance levels
const PURPLE_COLORS = {
	primary: "#8B5CF6", // Main actions (record, post)
	secondary: "#A855F7", // Secondary actions (play, tags)
	tertiary: "#C084FC", // Tertiary elements (add tag button)
	light: "#E9D5FF", // Light accents and borders
	text: "#7C3AED", // Text on light backgrounds
};

export function VoicePostRecorder() {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { showToast } = useToast();
	const [caption, setCaption] = useState("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackPosition, setPlaybackPosition] = useState(0);
	const [tags, setTags] = useState<string[]>([]);
	const [currentTag, setCurrentTag] = useState("");
	const [showTagInput, setShowTagInput] = useState(false);
	const [isEditingCaption, setIsEditingCaption] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Animation values
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const recordButtonScale = useRef(new Animated.Value(1)).current;
	const glowAnim = useRef(new Animated.Value(0)).current;

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

	// Animation effects
	useEffect(() => {
		if (isRecording) {
			// Pulse animation for recording button
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.1,
						duration: 800,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 800,
						useNativeDriver: true,
					}),
				])
			).start();

			// Glow effect
			Animated.loop(
				Animated.sequence([
					Animated.timing(glowAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: false,
					}),
					Animated.timing(glowAnim, {
						toValue: 0,
						duration: 1000,
						useNativeDriver: false,
					}),
				])
			).start();
		} else {
			pulseAnim.setValue(1);
			glowAnim.setValue(0);
		}
	}, [isRecording]);

	// Tag management functions
	const addTag = useCallback(() => {
		const trimmedTag = currentTag.trim().toLowerCase();
		if (!trimmedTag) return;

		if (tags.includes(trimmedTag)) {
			showToast("Tag already added", "warning");
			return;
		}

		if (tags.length >= 5) {
			showToast("Maximum 5 tags allowed", "warning");
			return;
		}

		setTags((prev) => [...prev, trimmedTag]);
		setCurrentTag("");
		setShowTagInput(false);
	}, [currentTag, tags, showToast]);

	const removeTag = useCallback((tagToRemove: string) => {
		setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
	}, []);

	const handleStartRecording = useCallback(async () => {
		if (isRecording) {
			await stopRecording();
		} else {
			// Record button press animation
			Animated.sequence([
				Animated.timing(recordButtonScale, {
					toValue: 0.9,
					duration: 100,
					useNativeDriver: true,
				}),
				Animated.timing(recordButtonScale, {
					toValue: 1,
					duration: 100,
					useNativeDriver: true,
				}),
			]).start();

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
		setTags([]);
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
			// Include tags in caption
			const captionWithTags =
				tags.length > 0 ? `${caption} #${tags.join(" #")}` : caption;

			await uploadRecording(captionWithTags);
			showToast("Voice note posted successfully!", "success");
			// Navigate back after a short delay to let user see success message
			setTimeout(() => router.back(), 1500);
		} catch (error: any) {
			console.error("Upload error:", error);
			const errorMessage =
				error?.message || "Failed to post voice note. Please try again.";
			showToast(errorMessage, "error", 5000); // Show error for 5 seconds
		}
	}, [
		recordingUri,
		audioBlob,
		caption,
		tags,
		uploadRecording,
		router,
		showToast,
	]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ScrollView
				style={styles.scrollContainer}
				contentContainerStyle={[
					styles.contentContainer,
					{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Header with editable title */}
				<View style={styles.headerSection}>
					{isEditingCaption ? (
						<TextInput
							style={[
								styles.titleInput,
								{
									color: colors.text,
									borderBottomColor: PURPLE_COLORS.secondary,
								},
							]}
							value={caption}
							onChangeText={setCaption}
							onBlur={() => setIsEditingCaption(false)}
							placeholder="Voice Notes"
							placeholderTextColor={colors.textSecondary}
							autoFocus
							onSubmitEditing={() => setIsEditingCaption(false)}
						/>
					) : (
						<TouchableOpacity
							onPress={() => setIsEditingCaption(true)}
							style={styles.titleContainer}
						>
							<Text style={[styles.title, { color: colors.text }]}>
								{caption || "Voice Notes"}
							</Text>
							<Feather
								name="edit-2"
								size={20}
								color={colors.textSecondary}
								style={{ marginLeft: 8 }}
							/>
						</TouchableOpacity>
					)}
				</View>

				{/* Status Text */}
				<Text style={[styles.statusText, { color: colors.textSecondary }]}>
					{isRecording
						? "Recording in progress..."
						: recordingUri
						? "Recording ready to play"
						: "Tap to start recording"}
				</Text>

				{/* Central Recording Section */}
				<View style={styles.recordingSection}>
					{/* Main Record Button */}
					<Animated.View
						style={[
							styles.recordButton,
							{
								backgroundColor: isRecording
									? PURPLE_COLORS.primary
									: PURPLE_COLORS.secondary,
								transform: [{ scale: pulseAnim }],
							},
						]}
					>
						<TouchableOpacity
							style={styles.recordButtonInner}
							onPress={handleStartRecording}
							disabled={isUploading}
							activeOpacity={0.8}
						>
							<Feather
								name={isRecording ? "square" : "mic"}
								size={32}
								color="#FFFFFF"
							/>
						</TouchableOpacity>
					</Animated.View>

					{/* Timer */}
					<Text style={[styles.timerText, { color: colors.text }]}>
						{formatTime(recordingDuration)}
					</Text>

					{/* Waveform with Play Button */}
					<View style={styles.waveformSection}>
						{recordingUri && !isRecording && (
							<TouchableOpacity
								style={[
									styles.playButton,
									{ backgroundColor: PURPLE_COLORS.secondary },
								]}
								onPress={handlePlayPause}
								disabled={isUploading}
							>
								<Feather
									name={isPlaying ? "pause" : "play"}
									size={20}
									color="#FFFFFF"
								/>
							</TouchableOpacity>
						)}

						<View style={[styles.waveformContainer, { marginLeft: 16 }]}>
							<VoicePostWaveform
								isRecording={isRecording}
								audioBlob={audioBlob}
								duration={recordingDuration}
								isPlaying={isPlaying}
								playbackPosition={playbackPosition}
							/>
						</View>
					</View>
				</View>

				{/* Post Button */}
				{recordingUri && !isRecording && (
					<TouchableOpacity
						style={[
							styles.postButton,
							{ backgroundColor: PURPLE_COLORS.primary },
						]}
						onPress={handlePost}
						disabled={isUploading}
					>
						<Text style={styles.postButtonText}>
							{isUploading ? "Posting..." : "Post Recording"}
						</Text>
					</TouchableOpacity>
				)}

				{/* Tags Section */}
				<View style={styles.tagsSection}>
					<View style={styles.tagsSectionHeader}>
						<Text style={[styles.tagsTitle, { color: colors.text }]}>Tags</Text>
						<Text style={[styles.tagsCount, { color: colors.textSecondary }]}>
							{tags.length}/5
						</Text>
					</View>

					{/* Tag Display */}
					<View style={styles.tagsContainer}>
						{tags.map((tag, index) => (
							<View
								key={index}
								style={[
									styles.tagChip,
									{ backgroundColor: PURPLE_COLORS.secondary },
								]}
							>
								<Text style={[styles.tagText, { marginRight: 6 }]}>{tag}</Text>
								<TouchableOpacity
									onPress={() => removeTag(tag)}
									style={styles.tagRemove}
								>
									<Feather name="x" size={12} color="#FFFFFF" />
								</TouchableOpacity>
							</View>
						))}

						{/* Add Tag Button */}
						{tags.length < 5 && !showTagInput && (
							<TouchableOpacity
								style={[
									styles.addTagButton,
									{ backgroundColor: PURPLE_COLORS.tertiary, opacity: 0.3 },
								]}
								onPress={() => setShowTagInput(true)}
							>
								<Feather name="plus" size={16} color={PURPLE_COLORS.text} />
								<Text
									style={[
										styles.addTagText,
										{ color: PURPLE_COLORS.text, marginLeft: 4 },
									]}
								>
									Add tag
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Tag Input */}
					{showTagInput && (
						<View style={styles.tagInputContainer}>
							<TextInput
								style={[
									styles.tagInput,
									{
										color: colors.text,
										backgroundColor: colors.background,
										borderColor: PURPLE_COLORS.light,
									},
								]}
								placeholder="Enter tag..."
								placeholderTextColor={colors.textSecondary}
								value={currentTag}
								onChangeText={setCurrentTag}
								onSubmitEditing={addTag}
								maxLength={20}
								autoCapitalize="none"
								autoCorrect={false}
								autoFocus
							/>
							<TouchableOpacity
								style={[
									styles.addButton,
									{ backgroundColor: PURPLE_COLORS.secondary, marginLeft: 8 },
								]}
								onPress={addTag}
							>
								<Text style={styles.addButtonText}>Add</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.cancelButton, { marginLeft: 8 }]}
								onPress={() => {
									setShowTagInput(false);
									setCurrentTag("");
								}}
							>
								<Text style={[styles.cancelButtonText, { color: colors.text }]}>
									Cancel
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		flex: 1,
	},
	contentContainer: {
		flexGrow: 1,
		paddingHorizontal: 24,
		alignItems: "center",
	},
	// Header Section
	headerSection: {
		alignItems: "center",
		marginBottom: 8,
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	title: {
		fontSize: 36,
		fontWeight: "bold",
		textAlign: "center",
	},
	titleInput: {
		fontSize: 36,
		fontWeight: "bold",
		textAlign: "center",
		borderBottomWidth: 2,
		paddingBottom: 8,
		minWidth: 200,
		borderRadius: 8,
		paddingHorizontal: 16,
	},
	// Status and Recording Section
	statusText: {
		fontSize: 16,
		textAlign: "center",
		marginBottom: 32,
	},
	recordingSection: {
		alignItems: "center",
		marginBottom: 32,
	},
	recordButton: {
		width: 96,
		height: 96,
		borderRadius: 48,
		marginBottom: 24,
		elevation: 4,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	recordButtonInner: {
		width: "100%",
		height: "100%",
		borderRadius: 48,
		alignItems: "center",
		justifyContent: "center",
	},
	timerText: {
		fontSize: 24,
		fontWeight: "600",
		fontFamily: "monospace",
		marginBottom: 24,
	},
	// Waveform Section
	waveformSection: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		maxWidth: 400,
	},
	playButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	waveformContainer: {
		flex: 1,
		height: 60,
		alignItems: "center",
		justifyContent: "center",
	},
	// Post Button
	postButton: {
		paddingVertical: 16,
		paddingHorizontal: 48,
		borderRadius: 24,
		marginBottom: 32,
		elevation: 3,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 6,
	},
	postButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
		textAlign: "center",
	},
	// Tags Section
	tagsSection: {
		width: "100%",
		maxWidth: 400,
	},
	tagsSectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	tagsTitle: {
		fontSize: 18,
		fontWeight: "600",
	},
	tagsCount: {
		fontSize: 14,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		minHeight: 32,
	},
	tagChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
		marginBottom: 8,
	},
	tagText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "500",
	},
	tagRemove: {
		width: 16,
		height: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.3)",
	},
	addTagButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
		marginBottom: 8,
	},
	addTagText: {
		fontSize: 14,
		fontWeight: "500",
	},
	// Tag Input
	tagInputContainer: {
		flexDirection: "row",
		marginTop: 12,
	},
	tagInput: {
		flex: 1,
		borderWidth: 1.5,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 14,
	},
	addButton: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	addButtonText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "500",
	},
	cancelButton: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	cancelButtonText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
