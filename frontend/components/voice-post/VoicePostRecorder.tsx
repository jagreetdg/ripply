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
	Dimensions,
	Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../common/Toast";
import { useVoiceRecording } from "./hooks/useVoiceRecording";
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

interface VoicePostRecorderProps {
	visible?: boolean;
	onClose?: () => void;
}

export function VoicePostRecorder({
	visible = true,
	onClose,
}: VoicePostRecorderProps) {
	const { colors } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { showToast } = useToast();
	const [caption, setCaption] = useState("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackPosition, setPlaybackPosition] = useState(0);
	const [tags, setTags] = useState<string[]>([]);
	const [editingTag, setEditingTag] = useState<{
		index: number;
		value: string;
	} | null>(null);
	const [isAddingNewTag, setIsAddingNewTag] = useState(false);
	const [newTagValue, setNewTagValue] = useState("");
	const [cancellingTag, setCancellingTag] = useState(false);
	const [isEditingCaption, setIsEditingCaption] = useState(false);
	const [isProcessingRecording, setIsProcessingRecording] = useState(false);
	const [isTagInputFocused, setIsTagInputFocused] = useState(false);
	const [textWidth, setTextWidth] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Animation values
	const pulseAnim = useRef(new Animated.Value(1)).current;
	const recordButtonScale = useRef(new Animated.Value(1)).current;
	const glowAnim = useRef(new Animated.Value(0)).current;
	const modalOpacity = useRef(new Animated.Value(0)).current;
	const modalScale = useRef(new Animated.Value(0.8)).current;
	const cursorOpacity = useRef(new Animated.Value(0)).current;

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
	} = useVoiceRecording({
		maxDuration: MAX_RECORDING_DURATION,
		onAutoStop: () => {
			showToast("Recording auto-stopped at 1 minute limit", "info");
		},
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

	// Cursor animation for tag inputs
	useEffect(() => {
		if (isTagInputFocused) {
			Animated.loop(
				Animated.sequence([
					Animated.timing(cursorOpacity, {
						toValue: 1,
						duration: 500,
						useNativeDriver: true,
					}),
					Animated.timing(cursorOpacity, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
				])
			).start();
		} else {
			cursorOpacity.setValue(0);
		}
	}, [isTagInputFocused]);

	// Tag management functions
	const startAddingTag = useCallback(() => {
		if (tags.length >= 5) {
			showToast("Maximum 5 tags allowed", "warning");
			return;
		}
		setIsAddingNewTag(true);
		setNewTagValue("");
	}, [tags.length, showToast]);

	const confirmNewTag = useCallback(() => {
		if (cancellingTag) {
			setCancellingTag(false);
			return;
		}

		const trimmedTag = newTagValue.trim().toLowerCase();
		if (!trimmedTag) {
			setIsAddingNewTag(false);
			setNewTagValue("");
			return;
		}

		if (tags.includes(trimmedTag)) {
			showToast("Tag already added", "warning");
			return;
		}

		setTags((prev) => [...prev, trimmedTag]);
		setIsAddingNewTag(false);
		setNewTagValue("");
		setCancellingTag(false);
	}, [newTagValue, tags, showToast, cancellingTag]);

	const startEditingTag = useCallback(
		(index: number) => {
			setEditingTag({ index, value: tags[index] });
		},
		[tags]
	);

	const confirmEditTag = useCallback(() => {
		if (!editingTag || cancellingTag) {
			setCancellingTag(false);
			return;
		}

		const trimmedTag = editingTag.value.trim().toLowerCase();
		if (!trimmedTag) {
			// If empty, remove the tag
			setTags((prev) => prev.filter((_, i) => i !== editingTag.index));
		} else if (
			tags.includes(trimmedTag) &&
			tags[editingTag.index] !== trimmedTag
		) {
			showToast("Tag already exists", "warning");
			return;
		} else {
			// Update the tag
			setTags((prev) =>
				prev.map((tag, i) => (i === editingTag.index ? trimmedTag : tag))
			);
		}

		setEditingTag(null);
		setCancellingTag(false);
	}, [editingTag, tags, showToast, cancellingTag]);

	const cancelEditTag = useCallback(() => {
		setCancellingTag(true);
		setEditingTag(null);
	}, []);

	const cancelNewTag = useCallback(() => {
		setCancellingTag(true);
		setIsAddingNewTag(false);
		setNewTagValue("");
	}, []);

	const removeTag = useCallback((index: number) => {
		setTags((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleStartRecording = useCallback(async () => {
		if (isRecording) {
			// Enforce minimum 5 seconds
			if (recordingDuration < 5) {
				showToast("Voice note must be at least 5 seconds", "error");
				return;
			}
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
	}, [
		isRecording,
		startRecording,
		stopRecording,
		recordingDuration,
		showToast,
	]);

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
		setEditingTag(null);
		setIsAddingNewTag(false);
		setNewTagValue("");
		setCancellingTag(false);
	}, [clearRecording]);

	const handlePlayStop = useCallback(async () => {
		if (!recordingUri) return;

		try {
			if (isPlaying) {
				// Stop playback and reset to beginning
				if (audioRef.current) {
					(audioRef.current as any).pause();
					(audioRef.current as any).currentTime = 0;
				}
				setIsPlaying(false);
				setPlaybackPosition(0);
			} else {
				// Start playback from beginning
				if (audioRef.current) {
					// Reset existing audio to beginning
					(audioRef.current as any).currentTime = 0;
				} else {
					// Create new audio element
					const audio = new Audio(recordingUri);
					audioRef.current = audio as any;

					// Set up event listeners
					(audio as any).ontimeupdate = () => {
						setPlaybackPosition((audio as any).currentTime);
					};

					(audio as any).onended = () => {
						setIsPlaying(false);
						setPlaybackPosition(0);
						// Don't nullify audio ref so we can restart from beginning
						if (audioRef.current) {
							(audioRef.current as any).currentTime = 0;
						}
					};

					(audio as any).onerror = () => {
						console.error("Audio playback error");
						setIsPlaying(false);
						setPlaybackPosition(0);
						audioRef.current = null;
					};
				}

				await (audioRef.current as any).play();
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
				(audioRef.current as any).pause();
				audioRef.current = null;
			}
		};
	}, []);

	// Clear processing state when recording is fully processed
	useEffect(() => {
		if (isProcessingRecording && (recordingUri || audioBlob)) {
			setIsProcessingRecording(false);
		}
	}, [isProcessingRecording, recordingUri, audioBlob]);

	useEffect(() => {
		// Reset playback when recording changes
		if (audioRef.current) {
			(audioRef.current as any).pause();
			audioRef.current = null;
		}
		setIsPlaying(false);
		setPlaybackPosition(0);
	}, [recordingUri]);

	// Modal animation effects
	useEffect(() => {
		if (visible) {
			// Reset initial values
			modalOpacity.setValue(0);
			modalScale.setValue(0.9);

			// Animate in with lightweight feel
			Animated.parallel([
				Animated.timing(modalOpacity, {
					toValue: 1,
					duration: 250,
					useNativeDriver: true,
				}),
				Animated.spring(modalScale, {
					toValue: 1,
					tension: 120,
					friction: 7,
					useNativeDriver: true,
				}),
			]).start();
		}
		// Note: Close animation is now handled in handleClose function
	}, [visible]);

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
			// Close modal or navigate back after a short delay to let user see success message
			setTimeout(() => {
				if (onClose) {
					onClose();
				} else {
					router.back();
				}
			}, 1500);
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
		onClose,
	]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleClose = useCallback(() => {
		// Start close animation first
		Animated.parallel([
			Animated.timing(modalOpacity, {
				toValue: 0,
				duration: 180,
				useNativeDriver: true,
			}),
			Animated.timing(modalScale, {
				toValue: 0.95,
				duration: 180,
				useNativeDriver: true,
			}),
		]).start(() => {
			// After animation completes, actually close the modal
			if (onClose) {
				onClose();
			} else {
				router.back();
			}
		});
	}, [onClose, router, modalOpacity, modalScale]);

	if (!visible) return null;

	return (
		<View style={styles.modalOverlay}>
			<BlurView style={styles.modalBackdrop} intensity={20} tint="dark">
				<View style={styles.modalBackdropTouch} />
			</BlurView>

			<Animated.View
				style={[
					styles.modalAnimatedContainer,
					{
						opacity: modalOpacity,
					},
				]}
			>
				{/* Modal Content Container */}
				<Animated.View
					style={[
						styles.modalContainer,
						{
							transform: [{ scale: modalScale }],
						},
					]}
				>
					<View
						style={[
							styles.modalContent,
							{
								backgroundColor: colors.background,
								borderColor: colors.text === "#FFFFFF" ? "#666666" : "#EEEEEE",
								borderWidth: 2,
							},
						]}
					>
						{/* Close Button - Always visible on top */}
						<View style={styles.stickyCloseButtonContainer}>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={handleClose}
							>
								<Feather name="x" size={18} color={colors.text} />
							</TouchableOpacity>
						</View>

						<ScrollView
							style={[styles.scrollContainer, { marginTop: 56 }]}
							contentContainerStyle={[
								styles.contentContainer,
								{ paddingTop: 8, paddingBottom: 20 },
							]}
							showsVerticalScrollIndicator={false}
						>
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
										isRecording && recordingDuration < 5
											? styles.recordButtonDisabled
											: null,
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
								<Text
									style={[
										styles.timerText,
										{
											color: isRecording
												? recordingDuration >= 50
													? "#EF4444" // Red for last 10 seconds while recording
													: recordingDuration >= 45
													? "#F59E0B" // Orange for 45-49 seconds while recording
													: colors.text // Normal color while recording
												: colors.text, // Always normal color when not recording
										},
									]}
								>
									{formatTime(
										Math.min(recordingDuration, MAX_RECORDING_DURATION)
									)}
									{isRecording &&
										recordingDuration >= 50 &&
										recordingDuration < MAX_RECORDING_DURATION && (
											<Text style={{ fontSize: 14, marginLeft: 8 }}>
												{" "}
												(Auto-stop in{" "}
												{Math.max(
													0,
													MAX_RECORDING_DURATION - recordingDuration
												)}
												s)
											</Text>
										)}
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
												isRecording
													? {
															justifyContent: "center",
															alignItems: "center",
															height: 108,
															paddingVertical: 0,
													  }
													: {},
											]}
										>
											{/* Play/Stop Button - Only show after recording */}
											{recordingUri && !isRecording && (
												<TouchableOpacity
													style={[
														styles.playButton,
														{ backgroundColor: PURPLE_COLORS.secondary },
													]}
													onPress={handlePlayStop}
													disabled={isUploading}
												>
													<View style={styles.playButtonIcon}>
														<Feather
															name={isPlaying ? "square" : "play"}
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
													{
														paddingHorizontal: 12,
														alignItems: "center",
														justifyContent: "center",
														height: 80,
													},
												]}
											>
												<VoicePostWaveform
													isRecording={isRecording}
													audioBlob={audioBlob}
													duration={recordingDuration}
													isPlaying={isPlaying}
													playbackPosition={playbackPosition}
													onAudioLevelsReady={() => {}}
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
									<Text
										style={[styles.charCount, { color: colors.textSecondary }]}
									>
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
										<Feather
											name="hash"
											size={18}
											color={PURPLE_COLORS.secondary}
										/>
										<Text style={[styles.sectionTitle, { color: colors.text }]}>
											Tags
										</Text>
										<Text
											style={[
												styles.tagsCount,
												{ color: colors.textSecondary },
											]}
										>
											{tags.length}/5
										</Text>
									</View>

									{/* Tag Display */}
									<View style={styles.tagsContainer}>
										{tags.map((tag, index) => {
											const isEditing = editingTag?.index === index;

											if (isEditing) {
												return (
													<View
														key={index}
														style={[
															styles.editingTagChip,
															{
																backgroundColor: colors.background,
																flexDirection: "row",
																alignItems: "center",
																paddingHorizontal: 8,
																paddingVertical: 6,
																borderRadius: 16,
																marginRight: 8,
																marginBottom: 8,
																borderWidth: 0,
																borderColor: "transparent",
															},
														]}
													>
														<View
															style={{
																flex: 1,
																minWidth: 85,
																minHeight: 30,
																position: "relative",
																justifyContent: "center",
																alignItems: "center",
															}}
														>
															{/* Placeholder text - positioned at typing start */}
															{!editingTag.value && (
																<Text
																	style={{
																		fontSize: 14,
																		fontWeight: "400",
																		color: colors.textSecondary,
																		position: "absolute",
																		left: 8,
																		top: "50%",
																		marginTop: -9,
																	}}
																>
																	Enter tag
																</Text>
															)}
															{/* Actual text */}
															{editingTag.value && (
																<Text
																	style={{
																		fontSize: 14,
																		fontWeight: "500",
																		color: colors.text,
																		position: "absolute",
																		left: 8,
																		top: "50%",
																		marginTop: -9,
																	}}
																	onLayout={(event) => {
																		setTextWidth(
																			event.nativeEvent.layout.width
																		);
																	}}
																>
																	{editingTag.value}
																</Text>
															)}
															{/* Dynamic cursor - positioned after text */}
															{isTagInputFocused && (
																<Animated.View
																	style={{
																		position: "absolute",
																		left:
																			8 + (editingTag.value ? textWidth : 0),
																		top: "50%",
																		marginTop: -8,
																		width: 2,
																		height: 16,
																		backgroundColor: PURPLE_COLORS.primary,
																		opacity: cursorOpacity,
																	}}
																/>
															)}
															<TextInput
																style={{
																	position: "absolute",
																	top: 0,
																	left: 0,
																	right: 0,
																	bottom: 0,
																	fontSize: 14,
																	fontWeight: "500",
																	color: "transparent",
																	backgroundColor: "transparent",
																	borderWidth: 0,
																	borderColor: "transparent",
																	outline: "none" as any,
																	textAlign: "left" as any,
																	paddingLeft: 8,
																}}
																value={editingTag.value}
																onChangeText={(text) => {
																	setEditingTag({ ...editingTag, value: text });
																	// Trigger re-layout to update cursor position
																	setTimeout(() => setTextWidth(0), 0);
																}}
																onSubmitEditing={confirmEditTag}
																onBlur={() => {
																	setIsTagInputFocused(false);
																	confirmEditTag();
																}}
																onFocus={() => setIsTagInputFocused(true)}
																maxLength={20}
																autoCapitalize="none"
																autoCorrect={false}
																autoFocus
																selectTextOnFocus
															/>
														</View>
														<TouchableOpacity
															onPress={cancelEditTag}
															style={styles.tagCancel}
														>
															<Feather
																name="x"
																size={12}
																color={colors.textSecondary}
															/>
														</TouchableOpacity>
													</View>
												);
											}

											return (
												<TouchableOpacity
													key={index}
													style={[
														styles.tagChip,
														{ backgroundColor: PURPLE_COLORS.secondary },
													]}
													onPress={() => startEditingTag(index)}
												>
													<Text style={[styles.tagText, { marginRight: 6 }]}>
														{tag}
													</Text>
													<TouchableOpacity
														onPress={(e) => {
															e.stopPropagation();
															removeTag(index);
														}}
														style={styles.tagRemove}
													>
														<Feather name="x" size={12} color="#FFFFFF" />
													</TouchableOpacity>
												</TouchableOpacity>
											);
										})}

										{/* Add Tag Button/Input */}
										{tags.length < 5 &&
											(isAddingNewTag ? (
												<View
													style={[
														styles.editingTagChip,
														{
															backgroundColor: colors.background,
															flexDirection: "row",
															alignItems: "center",
															paddingHorizontal: 8,
															paddingVertical: 6,
															borderRadius: 16,
															marginRight: 8,
															marginBottom: 8,
															borderWidth: 0,
															borderColor: "transparent",
														},
													]}
												>
													<View
														style={{
															flex: 1,
															minWidth: 85,
															minHeight: 30,
															position: "relative",
															justifyContent: "center",
															alignItems: "center",
														}}
													>
														{/* Placeholder text - positioned at typing start */}
														{!newTagValue && (
															<Text
																style={{
																	fontSize: 14,
																	fontWeight: "400",
																	color: colors.textSecondary,
																	position: "absolute",
																	left: 8,
																	top: "50%",
																	marginTop: -9,
																}}
															>
																Enter tag
															</Text>
														)}
														{/* Actual text */}
														{newTagValue && (
															<Text
																style={{
																	fontSize: 14,
																	fontWeight: "500",
																	color: colors.text,
																	position: "absolute",
																	left: 8,
																	top: "50%",
																	marginTop: -9,
																}}
																onLayout={(event) => {
																	setTextWidth(event.nativeEvent.layout.width);
																}}
															>
																{newTagValue}
															</Text>
														)}
														{/* Dynamic cursor - positioned after text */}
														{isTagInputFocused && (
															<Animated.View
																style={{
																	position: "absolute",
																	left: 8 + (newTagValue ? textWidth : 0),
																	top: "50%",
																	marginTop: -8,
																	width: 2,
																	height: 16,
																	backgroundColor: PURPLE_COLORS.primary,
																	opacity: cursorOpacity,
																}}
															/>
														)}
														<TextInput
															style={{
																position: "absolute",
																top: 0,
																left: 0,
																right: 0,
																bottom: 0,
																fontSize: 14,
																fontWeight: "500",
																color: "transparent",
																backgroundColor: "transparent",
																borderWidth: 0,
																borderColor: "transparent",
																outline: "none" as any,
																textAlign: "left" as any,
																paddingLeft: 8,
															}}
															value={newTagValue}
															onChangeText={(text) => {
																setNewTagValue(text);
																// Trigger re-layout to update cursor position
																setTimeout(() => setTextWidth(0), 0);
															}}
															onSubmitEditing={confirmNewTag}
															onBlur={() => {
																setIsTagInputFocused(false);
																confirmNewTag();
															}}
															onFocus={() => setIsTagInputFocused(true)}
															maxLength={20}
															autoCapitalize="none"
															autoCorrect={false}
															autoFocus
														/>
													</View>
													<TouchableOpacity
														onPress={cancelNewTag}
														style={styles.tagCancel}
													>
														<Feather
															name="x"
															size={12}
															color={colors.textSecondary}
														/>
													</TouchableOpacity>
												</View>
											) : (
												<TouchableOpacity
													style={[
														styles.addTagButton,
														{
															backgroundColor: colors.background,
															borderColor: PURPLE_COLORS.light,
														},
													]}
													onPress={startAddingTag}
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
											))}
									</View>
								</View>
							)}

							{/* Post Button */}
							{recordingUri && !isRecording && (
								<TouchableOpacity
									style={[
										styles.postButton,
										{
											backgroundColor:
												!caption.trim() || isUploading
													? PURPLE_COLORS.tertiary
													: PURPLE_COLORS.primary,
										},
									]}
									onPress={handlePost}
									disabled={isUploading || !caption.trim()}
								>
									<Feather
										name="send"
										size={20}
										color="#FFFFFF"
										style={{ marginRight: 8 }}
									/>
									<Text style={styles.postButtonText}>
										{isUploading ? "Posting..." : "Post"}
									</Text>
								</TouchableOpacity>
							)}
						</ScrollView>

						{/* Top gradient fade */}
						<LinearGradient
							colors={[colors.background, "transparent"]}
							style={styles.topGradient}
							pointerEvents="none"
						/>

						{/* Bottom gradient fade */}
						<LinearGradient
							colors={["transparent", colors.background]}
							style={styles.bottomGradient}
							pointerEvents="none"
						/>
					</View>
				</Animated.View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	modalOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1000,
	},
	modalAnimatedContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 32,
	},
	modalBackdrop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	modalBackdropTouch: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
	},
	modalContainer: {
		width: "100%",
		maxWidth: 500,
		maxHeight: "90%",
		zIndex: 1,
	},
	modalContent: {
		borderRadius: 20,
		overflow: "hidden",
		elevation: 10,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		flex: 1,
	},
	topGradient: {
		position: "absolute",
		top: 56,
		left: 0,
		right: 0,
		height: 32,
		zIndex: 1,
	},
	bottomGradient: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: 32,
		zIndex: 1,
	},
	scrollContainer: {
		flex: 1,
	},
	contentContainer: {
		paddingHorizontal: 24,
		alignItems: "center",
	},
	// Sticky Close Button - Always visible
	stickyCloseButtonContainer: {
		position: "absolute",
		top: 16,
		right: 16,
		zIndex: 10,
		backgroundColor: "rgba(0, 0, 0, 0.1)",
		borderRadius: 16,
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.2)",
	},
	closeButton: {
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
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
		marginVertical: 20,
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
	recordButtonDisabled: {
		opacity: 0.45,
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
		paddingHorizontal: 20,
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
		marginRight: 16,
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		flexShrink: 0,
	},
	playButtonIcon: {
		marginLeft: 2,
	},
	waveformContainer: {
		flex: 1,
		height: 60,
		alignItems: "center",
		justifyContent: "center",
		minWidth: 0,
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
	editingTagChip: {
		paddingHorizontal: 8,
	},
	editingTagInput: {
		flex: 1,
		fontSize: 14,
		fontWeight: "500",
		paddingVertical: 0,
		minWidth: 60,
		borderWidth: 0,
		borderColor: "transparent",
		backgroundColor: "transparent",
	},
	tagCancel: {
		width: 16,
		height: 16,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 6,
	},
});
