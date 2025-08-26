import React, { useState, useCallback, useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	TextInput,
	ScrollView,
	Animated,
	Pressable,
} from "react-native";
import { Feather, Mic, Play, Pause, X, Plus, Hash } from "@expo/vector-icons";
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
	const [tags, setTags] = useState<string[]>([]);
	const [currentTag, setCurrentTag] = useState("");
	const [showTagInput, setShowTagInput] = useState(false);
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
		
		setTags(prev => [...prev, trimmedTag]);
		setCurrentTag("");
		setShowTagInput(false);
	}, [currentTag, tags, showToast]);

	const removeTag = useCallback((tagToRemove: string) => {
		setTags(prev => prev.filter(tag => tag !== tagToRemove));
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
			// For now, we'll use the caption field to send tags until backend supports tags
			const captionWithTags = tags.length > 0 
				? `${caption} #${tags.join(' #')}`
				: caption;
			
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
	}, [recordingUri, audioBlob, caption, tags, uploadRecording, router, showToast]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const timeRemaining = MAX_RECORDING_DURATION - recordingDuration;

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Gradient Background */}
			<View style={[styles.gradientBackground, { 
				backgroundColor: isRecording ? '#6366F1' : colors.background 
			}]}>
				{/* Animated Glow Effect */}
				<Animated.View 
					style={[
						styles.glowEffect,
						{
							opacity: glowAnim,
							backgroundColor: isRecording ? '#8B5CF6' : '#6366F1',
						}
					]}
				/>
			</View>

			<ScrollView
				style={styles.scrollContainer}
				contentContainerStyle={[
					styles.contentContainer,
					{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={[styles.headerButton, { backgroundColor: colors.background + '20' }]}
					>
						<X size={24} color={isRecording ? '#FFFFFF' : colors.text} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { 
						color: isRecording ? '#FFFFFF' : colors.text,
						textShadowColor: isRecording ? 'rgba(0,0,0,0.3)' : 'transparent',
						textShadowOffset: { width: 0, height: 1 },
						textShadowRadius: 2,
					}]}>
						🎙️ Create Voice Note
					</Text>
					<View style={styles.headerButton} />
				</View>

						{/* Central Recording Section */}
			<View style={styles.recordingSection}>
				{/* Status Text */}
				<Text style={[styles.statusText, { 
					color: isRecording ? '#FFFFFF' : colors.text,
					textShadowColor: isRecording ? 'rgba(0,0,0,0.3)' : 'transparent',
					textShadowOffset: { width: 0, height: 1 },
					textShadowRadius: 2,
				}]}>
					{isRecording ? "🔴 Recording..." : 
					 recordingUri ? "✅ Ready to post" : 
					 "🎤 Tap to record"}
				</Text>

				{/* Timer */}
				<Text style={[styles.timerText, { 
					color: isRecording ? '#FFFFFF' : colors.text,
					textShadowColor: isRecording ? 'rgba(0,0,0,0.3)' : 'transparent',
					textShadowOffset: { width: 0, height: 1 },
					textShadowRadius: 2,
				}]}>
					{formatTime(recordingDuration)} / {formatTime(MAX_RECORDING_DURATION)}
				</Text>

				{/* Main Record Button with Pulse Animation */}
				<View style={styles.recordButtonContainer}>
					<Animated.View style={[
						styles.recordButtonOuter,
						{ 
							transform: [{ scale: pulseAnim }],
							backgroundColor: isRecording ? '#EF4444' : '#6366F1',
							shadowColor: isRecording ? '#EF4444' : '#6366F1',
						}
					]}>
						<Animated.View style={[
							styles.recordButtonInner,
							{ transform: [{ scale: recordButtonScale }] }
						]}>
							<TouchableOpacity
								style={styles.recordButton}
								onPress={handleStartRecording}
								disabled={isUploading}
								activeOpacity={0.8}
							>
								<Mic 
									size={48} 
									color="#FFFFFF" 
									style={{ 
										opacity: isRecording ? 0.9 : 1,
									}}
								/>
							</TouchableOpacity>
						</Animated.View>
					</Animated.View>
				</View>

				{/* Waveform Visualizer */}
				<View style={styles.waveformContainer}>
					<VoicePostWaveform
						isRecording={isRecording}
						audioBlob={audioBlob}
						duration={recordingDuration}
						isPlaying={isPlaying}
						playbackPosition={playbackPosition}
					/>
				</View>
			</View>

				{/* Playback Section */}
				{recordingUri && (
					<View style={[styles.playbackSection, { 
						backgroundColor: colors.card + '40',
						borderColor: colors.border + '20'
					}]}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							🎧 Review your recording
						</Text>
						<View style={styles.playbackControls}>
							<TouchableOpacity
								style={[
									styles.playButton,
									{
										backgroundColor: isPlaying ? '#EF4444' : '#10B981',
										shadowColor: isPlaying ? '#EF4444' : '#10B981',
									},
								]}
								onPress={handlePlayPause}
								disabled={isUploading}
							>
								{isPlaying ? (
									<Pause size={24} color="#FFFFFF" />
								) : (
									<Play size={24} color="#FFFFFF" />
								)}
							</TouchableOpacity>
							{isPlaying && (
								<Text style={[styles.playbackTime, { color: colors.textSecondary }]}>
									{formatTime(Math.round(playbackPosition))} /{" "}
									{formatTime(recordingDuration)}
								</Text>
							)}
						</View>
					</View>
				)}

				{/* Tags Section */}
				{recordingUri && (
					<View style={[styles.tagsSection, { 
						backgroundColor: colors.card + '40',
						borderColor: colors.border + '20'
					}]}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							🏷️ Add tags (max 5)
						</Text>
						
						{/* Tag Display */}
						<View style={styles.tagsContainer}>
							{tags.map((tag, index) => (
								<View key={index} style={[styles.tagChip, { 
									backgroundColor: '#6366F1',
									shadowColor: '#6366F1'
								}]}>
									<Text style={styles.tagText}>#{tag}</Text>
									<TouchableOpacity
										onPress={() => removeTag(tag)}
										style={styles.tagRemove}
									>
										<X size={14} color="#FFFFFF" />
									</TouchableOpacity>
								</View>
							))}
							
							{/* Add Tag Button */}
							{tags.length < 5 && (
								<TouchableOpacity
									style={[styles.addTagButton, { borderColor: colors.border }]}
									onPress={() => setShowTagInput(!showTagInput)}
								>
									<Plus size={16} color={colors.textSecondary} />
									<Text style={[styles.addTagText, { color: colors.textSecondary }]}>
										Add tag
									</Text>
								</TouchableOpacity>
							)}
						</View>
						
						{/* Tag Input */}
						{showTagInput && (
							<View style={styles.tagInputContainer}>
								<TextInput
									style={[styles.tagInput, {
										color: colors.text,
										backgroundColor: colors.background,
										borderColor: colors.border,
									}]}
									placeholder="Enter tag (e.g., music, story, funny)"
									placeholderTextColor={colors.textSecondary}
									value={currentTag}
									onChangeText={setCurrentTag}
									onSubmitEditing={addTag}
									maxLength={20}
									autoCapitalize="none"
									autoCorrect={false}
								/>
								<TouchableOpacity
									style={[styles.addTagSubmit, { backgroundColor: '#6366F1' }]}
									onPress={addTag}
								>
									<Text style={styles.addTagSubmitText}>Add</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				)}

						{/* Caption Section */}
			{recordingUri && (
				<View style={[styles.captionSection, { 
					backgroundColor: colors.card + '40',
					borderColor: colors.border + '20'
				}]}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>
						✨ Add a caption (optional)
					</Text>
					<TextInput
						style={[
							styles.captionInput,
							{
								color: colors.text,
								backgroundColor: colors.background,
								borderColor: colors.border,
								shadowColor: colors.tint,
							},
						]}
						placeholder="What's your story? 🎤"
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
							styles.clearButton,
							{ 
								borderColor: '#EF4444',
								backgroundColor: '#EF444410'
							},
						]}
						onPress={handleClearRecording}
						disabled={isUploading}
					>
						<X size={18} color="#EF4444" />
						<Text style={[styles.clearButtonText, { color: '#EF4444' }]}>
							Clear
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.postButton,
							{ 
								backgroundColor: '#10B981',
								shadowColor: '#10B981',
							},
							isUploading && { opacity: 0.6 },
						]}
						onPress={handlePost}
						disabled={isUploading}
					>
						<Text style={styles.postButtonText}>
							{isUploading ? "🚀 Posting..." : "🎉 Post Voice Note"}
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
		position: 'relative',
	},
	gradientBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		transition: 'all 0.5s ease',
	},
	glowEffect: {
		position: 'absolute',
		top: -50,
		left: -50,
		right: -50,
		bottom: -50,
		borderRadius: 200,
		filter: 'blur(50px)',
	},
	scrollContainer: {
		flex: 1,
		zIndex: 1,
	},
	contentContainer: {
		flexGrow: 1,
		minHeight: '100%',
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		marginBottom: 20,
	},
	headerButton: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 22,
		backdropFilter: 'blur(10px)',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	recordingSection: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		minHeight: 400,
	},
	statusText: {
		fontSize: 20,
		fontWeight: "600",
		marginBottom: 16,
		textAlign: 'center',
	},
	timerText: {
		fontSize: 32,
		fontWeight: "700",
		marginBottom: 40,
		fontFamily: 'monospace',
	},
	recordButtonContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 40,
	},
	recordButtonOuter: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: "center",
		justifyContent: "center",
		elevation: 8,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	recordButtonInner: {
		width: 100,
		height: 100,
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	recordButton: {
		width: '100%',
		height: '100%',
		borderRadius: 50,
		alignItems: "center",
		justifyContent: "center",
	},
	waveformContainer: {
		width: '100%',
		height: 80,
		alignItems: 'center',
		justifyContent: 'center',
	},
	playbackSection: {
		margin: 16,
		borderRadius: 16,
		borderWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 24,
		alignItems: "center",
	},
	playbackControls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	playButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		elevation: 4,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	playbackTime: {
		fontSize: 16,
		fontWeight: '600',
		fontFamily: 'monospace',
	},
	tagsSection: {
		margin: 16,
		borderRadius: 16,
		borderWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 8,
	},
	tagChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
	tagText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '600',
		marginRight: 6,
	},
	tagRemove: {
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	addTagButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1.5,
		borderStyle: 'dashed',
	},
	addTagText: {
		fontSize: 14,
		marginLeft: 6,
	},
	tagInputContainer: {
		flexDirection: 'row',
		marginTop: 12,
		gap: 8,
	},
	tagInput: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
	},
	addTagSubmit: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addTagSubmitText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	captionSection: {
		margin: 16,
		borderRadius: 16,
		borderWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 16,
	},
	captionInput: {
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		minHeight: 100,
		textAlignVertical: "top",
		elevation: 1,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	charCount: {
		fontSize: 12,
		marginTop: 8,
		textAlign: "right",
		opacity: 0.7,
	},
	actionButtons: {
		flexDirection: "row",
		paddingHorizontal: 16,
		paddingBottom: 32,
		gap: 16,
	},
	clearButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 16,
		borderWidth: 2,
		gap: 8,
		flex: 1,
	},
	clearButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	postButton: {
		flex: 2,
		paddingVertical: 18,
		paddingHorizontal: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		elevation: 6,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.3,
		shadowRadius: 6,
	},
	postButtonText: {
		color: '#FFFFFF',
		fontSize: 18,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
});
