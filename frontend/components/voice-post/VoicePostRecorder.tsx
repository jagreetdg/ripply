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
	const [isProcessingRecording, setIsProcessingRecording] = useState(false);
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
						useNativeDriver: false,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 800,
						useNativeDriver: false,
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
			console.log("🔄 STOP: Setting processing state to prevent unmount");
			setIsProcessingRecording(true); // Keep component mounted while processing
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
						// Debug: Log actual vs recorded duration mismatch
						if (Math.abs(audio.duration - recordingDuration) > 1) {
							console.log(
								`⚠️ DURATION MISMATCH: recorded=${recordingDuration}s, actual=${audio.duration}s`
							);
						}
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

	// Clear processing state when recording is fully processed
	useEffect(() => {
		if (isProcessingRecording && (recordingUri || audioBlob)) {
			console.log(
				"🏁 Recording processing complete - clearing processing state"
			);
			setIsProcessingRecording(false);
		}
	}, [isProcessingRecording, recordingUri, audioBlob]);

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
				{/* Close Button */}
				<View style={styles.closeButtonContainer}>
					<TouchableOpacity
						style={[
							styles.closeButton,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
							},
						]}
						onPress={() => router.back()}
					>
						<Feather name="x" size={24} color={colors.text} />
					</TouchableOpacity>
				</View>

				{/* Recording Section */}
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

					{/* Waveform - Show during recording and after */}
					{(isRecording ||
						recordingUri ||
						audioBlob ||
						isProcessingRecording) && (
						<View style={styles.waveformSection}>
							{/* Waveform Container - Responsive layout */}
							<View
								style={[
									styles.waveformPlayContainer,
									{
										backgroundColor: colors.card,
										borderColor: colors.border,
									},
								]}
							>
								{/* Play Button - Only show after recording */}
								{recordingUri && !isRecording && (
									<TouchableOpacity
										style={[
											styles.playButton,
											{ backgroundColor: PURPLE_COLORS.secondary },
										]}
										onPress={handlePlayPause}
										disabled={isUploading}
									>
										<View style={styles.playButtonIcon}>
											<Feather
												name={isPlaying ? "pause" : "play"}
												size={20}
												color="#FFFFFF"
											/>
										</View>
									</TouchableOpacity>
								)}

								{/* Waveform - Expands to fill available space */}
								<View
									style={[
										styles.waveformContainer,
										isRecording ? { paddingHorizontal: 16 } : {},
									]}
								>
									<VoicePostWaveform
										isRecording={isRecording}
										audioBlob={audioBlob}
										duration={recordingDuration}
										isPlaying={isPlaying}
										playbackPosition={playbackPosition}
										onAudioLevelsReady={(levels: number[]) => {
											// Store the audio levels when they're ready
											console.log(
												"🎯 Parent received audio levels:",
												levels.length
											);
										}}
									/>
								</View>
							</View>
						</View>
					)}
				</View>

				{/* Caption Section */}
				{recordingUri && (
					<View
						style={[
							styles.sectionCard,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
							},
						]}
					>
						<View style={styles.sectionHeader}>
							<Feather
								name="edit-3"
								size={18}
								color={PURPLE_COLORS.secondary}
							/>
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								Add a caption
							</Text>
						</View>
						<TextInput
							style={[
								styles.captionInput,
								{
									color: colors.text,
									backgroundColor: colors.background,
									borderColor: colors.border,
								},
							]}
							placeholder="What's your story? Share your thoughts..."
							placeholderTextColor={colors.textSecondary}
							multiline
							numberOfLines={3}
							maxLength={280}
							value={caption}
							onChangeText={setCaption}
							textAlignVertical="top"
						/>
						<Text style={[styles.charCount, { color: colors.textSecondary }]}>
							{caption.length}/280
						</Text>
					</View>
				)}

				{/* Tags Section */}
				{recordingUri && (
					<View
						style={[
							styles.sectionCard,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
							},
						]}
					>
						<View style={styles.sectionHeader}>
							<Feather name="hash" size={18} color={PURPLE_COLORS.secondary} />
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								Tags
							</Text>
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
									<Text style={[styles.tagText, { marginRight: 6 }]}>
										{tag}
									</Text>
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
										{
											backgroundColor: colors.background,
											borderColor: PURPLE_COLORS.light,
										},
									]}
									onPress={() => setShowTagInput(true)}
								>
									<Feather
										name="plus"
										size={16}
										color={PURPLE_COLORS.secondary}
									/>
									<Text
										style={[
											styles.addTagText,
											{
												color: colors.text,
												marginLeft: 4,
											},
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
											borderColor: PURPLE_COLORS.secondary,
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
									<Text
										style={[styles.cancelButtonText, { color: colors.text }]}
									>
										Cancel
									</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				)}

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
						<Feather
							name="send"
							size={20}
							color="#FFFFFF"
							style={{ marginRight: 8 }}
						/>
						<Text style={styles.postButtonText}>
							{isUploading ? "Posting..." : "Post Voice Note"}
						</Text>
					</TouchableOpacity>
				)}
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
		paddingHorizontal: 20,
		alignItems: "center",
	},
	// Close Button
	closeButtonContainer: {
		width: "100%",
		alignItems: "flex-end",
		marginBottom: 10,
	},
	closeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},

	// Section Card Styles
	sectionCard: {
		width: "100%",
		maxWidth: 400,
		borderRadius: 16,
		borderWidth: 1,
		padding: 20,
		marginBottom: 20,
		elevation: 2,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginLeft: 8,
		flex: 1,
	},
	recordingSection: {
		alignItems: "center",
		marginVertical: 40,
		width: "100%",
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
		marginBottom: 32,
	},

	// Waveform Section
	waveformSection: {
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	waveformPlayContainer: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		maxWidth: 400,
		borderRadius: 12,
		borderWidth: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		elevation: 1,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		marginVertical: 8,
	},
	playButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 16, // Right spacing between play button and waveform
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		flexShrink: 0, // Prevent button from shrinking
	},
	playButtonIcon: {
		marginLeft: 2, // Slight offset to center the play triangle
	},
	waveformContainer: {
		flex: 1, // Expands to fill all available horizontal space
		height: 60,
		alignItems: "center",
		justifyContent: "center",
		minWidth: 0, // Allow flex shrinking if needed
	},
	// Caption Input
	captionInput: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		minHeight: 80,
		textAlignVertical: "top",
		marginBottom: 8,
	},
	charCount: {
		fontSize: 12,
		textAlign: "right",
		opacity: 0.7,
	},
	// Post Button
	postButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 18,
		paddingHorizontal: 32,
		borderRadius: 16,
		marginBottom: 32,
		elevation: 4,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		width: "100%",
		maxWidth: 400,
	},
	postButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "700",
		textAlign: "center",
	},
	tagsCount: {
		fontSize: 14,
		marginLeft: "auto",
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
		paddingVertical: 8,
		borderRadius: 12,
		borderWidth: 1.5,
		borderStyle: "dashed",
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
		marginTop: 4,
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
