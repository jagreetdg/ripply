import React, { useEffect, useRef, useState, memo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

interface VoicePostWaveformProps {
	isRecording: boolean;
	audioBlob: Blob | null;
	duration: number;
	isPlaying?: boolean;
	playbackPosition?: number;
	onAudioLevelsReady?: (levels: number[]) => void;
}

function VoicePostWaveformComponent({
	isRecording,
	audioBlob,
	duration,
	isPlaying = false,
	playbackPosition = 0,
	onAudioLevelsReady,
}: VoicePostWaveformProps) {
	const { colors } = useTheme();
	const [audioLevels, setAudioLevels] = useState<number[]>([]);
	const [storedAudioLevels, setStoredAudioLevels] = useState<number[]>([]);
	const [allRecordingLevels, setAllRecordingLevels] = useState<number[]>([]);

	// DIAGNOSTIC: Track component lifecycle
	useEffect(() => {
		console.log("🏗️ VoicePostWaveform MOUNTED");
		return () => {
			console.log("💀 VoicePostWaveform UNMOUNTING");
		};
	}, []);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	// Initialize audio analysis for real-time waveform
	useEffect(() => {
		if (!isRecording || Platform.OS !== "web") {
			console.log("Audio analysis skipped:", {
				isRecording,
				platform: Platform.OS,
			});
			return;
		}
		console.log("Starting audio analysis...");

		const initializeAudioAnalysis = async () => {
			try {
				console.log("Requesting microphone access...");
				// Get microphone stream
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: false,
						noiseSuppression: false,
						autoGainControl: false,
					},
				});
				streamRef.current = stream;
				console.log("Microphone stream obtained");

				// Create audio context and analyser
				const audioContext = new (window.AudioContext ||
					(window as any).webkitAudioContext)();
				const analyser = audioContext.createAnalyser();
				const source = audioContext.createMediaStreamSource(stream);

				analyser.fftSize = 512; // Increased for better frequency resolution
				analyser.smoothingTimeConstant = 0.3; // Reduced for more responsive levels
				source.connect(analyser);

				audioContextRef.current = audioContext;
				analyserRef.current = analyser;

				console.log("Audio context and analyser created, starting analysis...");
				// Start analyzing audio levels
				analyzeAudio();
			} catch (error) {
				console.error("Failed to initialize audio analysis:", error);
				// Try to continue without real-time analysis
			}
		};

		initializeAudioAnalysis();

		return () => {
			// Cleanup
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
		};
	}, [isRecording]);

	// Clear data when recording starts
	useEffect(() => {
		if (isRecording) {
			// Recording just started, clear previous data
			console.log("🧹 Recording started - clearing previous data");
			setAudioLevels([]);
			setStoredAudioLevels([]);
			setAllRecordingLevels([]);
		} else {
			console.log(
				"🔄 DIAGNOSTIC: isRecording became false, NOT clearing data here"
			);
		}
	}, [isRecording]);

	// Store audio levels when recording stops - with session tracking to prevent duplicate processing
	const previousIsRecording = useRef(false);
	const audioLevelsRef = useRef<number[]>([]);
	const recordingSessionRef = useRef<string | null>(null);
	const hasProcessedStopRef = useRef(false);

	useEffect(() => {
		// When recording starts, create a new session ID and reset flags
		if (!previousIsRecording.current && isRecording) {
			recordingSessionRef.current = Date.now().toString();
			hasProcessedStopRef.current = false;
			console.log(`🎬 NEW RECORDING SESSION: ${recordingSessionRef.current}`);
		}

		// Only log state changes for debugging (but don't process them multiple times)
		console.log(
			`📱 Session ${recordingSessionRef.current}: ${previousIsRecording.current} -> ${isRecording} [Processed: ${hasProcessedStopRef.current}]`
		);

		// Only trigger when isRecording changes from true to false AND we haven't processed this session yet
		if (
			previousIsRecording.current === true &&
			isRecording === false &&
			!hasProcessedStopRef.current
		) {
			hasProcessedStopRef.current = true; // Mark as processed immediately

			console.log(
				`🔴 RECORDING STOPPED! Session: ${recordingSessionRef.current}`,
				"Current audioLevels (via ref):",
				audioLevelsRef.current.length
			);

			if (allRecordingLevels.length > 0) {
				// Downsample to ~80 bars for display while preserving the shape
				const targetBars = 80;
				const downsampledLevels = downsampleAudioLevels(
					allRecordingLevels,
					targetBars
				);

				console.log(
					"✅ Storing COMPLETE audio levels:",
					allRecordingLevels.length,
					"→",
					downsampledLevels.length,
					"samples"
				);
				console.log(
					"First 10 levels:",
					downsampledLevels.slice(0, 10).map((l) => l.toFixed(3))
				);
				setStoredAudioLevels([...downsampledLevels]);

				// Notify parent component
				if (onAudioLevelsReady) {
					onAudioLevelsReady([...downsampledLevels]);
				}
			} else {
				console.log("❌ No complete recording levels to store");
			}
		}

		// Update the ref for next time
		previousIsRecording.current = isRecording;
	}, [isRecording, onAudioLevelsReady, allRecordingLevels]);

	// Downsample audio levels while preserving the waveform shape
	const downsampleAudioLevels = (
		levels: number[],
		targetCount: number
	): number[] => {
		if (levels.length <= targetCount) return levels;

		const chunkSize = levels.length / targetCount;
		const downsampled: number[] = [];

		for (let i = 0; i < targetCount; i++) {
			const start = Math.floor(i * chunkSize);
			const end = Math.floor((i + 1) * chunkSize);
			const chunk = levels.slice(start, end);

			// Use RMS (root mean square) for better representation of audio energy
			const rms = Math.sqrt(
				chunk.reduce((sum, level) => sum + level * level, 0) / chunk.length
			);
			downsampled.push(rms);
		}

		return downsampled;
	};

	const analyzeAudio = () => {
		if (!analyserRef.current) {
			console.log("No analyser available");
			return;
		}

		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserRef.current.getByteFrequencyData(dataArray);

		// Calculate average audio level
		const average =
			dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
		const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

		// Log occasional samples to verify audio capture
		if (Math.random() < 0.1) {
			// Log ~10% of samples
			console.log("Audio level captured:", normalizedLevel.toFixed(3));
		}

		// Update LIVE audio levels (keep last 80 samples for real-time display)
		setAudioLevels((prev) => {
			const newLevels = [...prev, normalizedLevel];
			const trimmedLevels = newLevels.slice(-80); // Keep last 80 samples for display

			// CRITICAL: Store in ref immediately so it survives state changes
			audioLevelsRef.current = trimmedLevels;

			if (trimmedLevels.length % 10 === 0) {
				// Log every 10 samples + DIAGNOSTIC info
				console.log(
					"📊 Live audio levels:",
					trimmedLevels.length,
					"| Ref size:",
					audioLevelsRef.current.length,
					"| Session:",
					recordingSessionRef.current
				);
			}
			return trimmedLevels;
		});

		// Store ALL audio levels for final waveform (this is the key fix!)
		setAllRecordingLevels((prev) => {
			const allLevels = [...prev, normalizedLevel];
			if (allLevels.length % 20 === 0) {
				// Log every 20 samples
				console.log(
					"📈 COMPLETE recording levels:",
					allLevels.length,
					"total samples"
				);
			}
			return allLevels;
		});

		if (isRecording) {
			animationFrameRef.current = requestAnimationFrame(analyzeAudio);
		} else {
			// Recording just stopped - immediately store the levels!
			console.log(
				"🚨 analyzeAudio detected recording stopped - storing levels NOW"
			);
			const finalLevels = audioLevelsRef.current;
			if (finalLevels.length > 0) {
				console.log(
					"📦 Final storage from analyzeAudio:",
					finalLevels.length,
					"samples"
				);
				setStoredAudioLevels([...finalLevels]);
			}
		}
	};

	// Generate static waveform for completed recording
	const generateStaticWaveform = () => {
		if (!audioBlob) return [];

		// DIAGNOSTIC: Check all data sources
		console.log(
			"🔍 DIAGNOSTIC generateStaticWaveform - storedAudioLevels:",
			storedAudioLevels.length,
			"| audioLevels:",
			audioLevels.length,
			"| audioLevelsRef:",
			audioLevelsRef.current.length,
			"| Session:",
			recordingSessionRef.current
		);

		// If we have stored audio levels from recording, use those (PRIORITIZE REAL DATA)
		if (storedAudioLevels.length > 0) {
			console.log(
				"✅ Using stored audio levels:",
				storedAudioLevels.length,
				"samples"
			);
			console.log(
				"First 10 stored levels:",
				storedAudioLevels.slice(0, 10).map((l) => l.toFixed(3))
			);
			return storedAudioLevels;
		}

		// Fallback to current audioLevels if available
		if (audioLevels.length > 0) {
			console.log(
				"🔶 Using current audio levels:",
				audioLevels.length,
				"samples"
			);
			return audioLevels;
		}

		// LAST RESORT: Check if ref has data even if state doesn't
		if (audioLevelsRef.current.length > 0) {
			console.log(
				"🆘 EMERGENCY: Using audioLevelsRef data:",
				audioLevelsRef.current.length,
				"samples"
			);
			return audioLevelsRef.current;
		}

		console.log(
			"❌ No real audio data available, generating simulated waveform"
		);

		// Generate a voice-like waveform pattern that mimics actual speech
		const bars = Math.min(Math.max(duration * 4, 25), 80); // More bars for better resolution
		const waveform = [];

		for (let i = 0; i < bars; i++) {
			const position = i / bars;

			// Simulate voice patterns: pauses, syllables, emphasis
			const speechPattern = Math.sin(position * Math.PI * 8) * 0.4; // Syllable rhythm
			const breathPattern = Math.sin(position * Math.PI * 1.5) * 0.3; // Breathing pauses
			const emphasisPattern = Math.sin(position * Math.PI * 15) * 0.2; // Micro variations

			// Add realistic pauses (voice recordings have silent moments)
			const pauseProbability = Math.random();
			const isPause = pauseProbability < 0.1; // 10% chance of silence

			if (isPause) {
				waveform.push(0.05 + Math.random() * 0.1); // Near silence
			} else {
				// Combine patterns with natural variation
				const combinedWave = speechPattern + breathPattern + emphasisPattern;
				const naturalVariation = (Math.random() - 0.5) * 0.4;

				// Voice typically ranges from quiet syllables to loud emphasis
				let level = Math.abs(combinedWave) + naturalVariation + 0.4;

				// Add occasional peaks (loud words/emphasis)
				if (Math.random() < 0.15) {
					// 15% chance of emphasis
					level *= 1.5;
				}

				// Ensure realistic voice range (0.2-0.95)
				level = Math.max(0.2, Math.min(0.95, level));
				waveform.push(level);
			}
		}

		return waveform;
	};

	// Determine what levels to display
	const displayLevels = (() => {
		if (isRecording) {
			// During recording, show real-time levels only (no placeholder)
			return audioLevels;
		} else {
			// Not recording, show static waveform
			return generateStaticWaveform();
		}
	})();

	// Calculate playback progress for visual feedback
	const playbackProgress = duration > 0 ? playbackPosition / duration : 0;

	// Debug sync issues (reduced logging)
	if (isPlaying && Math.random() < 0.02) {
		// Log 2% of the time during playback (reduced)
		console.log(
			`🎵 SYNC DEBUG: playbackPosition=${playbackPosition.toFixed(
				2
			)}s, duration=${duration}s, progress=${(playbackProgress * 100).toFixed(
				1
			)}%, bars=${displayLevels.length}`
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.waveform}>
				{displayLevels.length > 0 &&
					displayLevels.map((level, index) => {
						// Calculate if this bar should be highlighted based on playback position
						// Fix: Use more precise calculation that accounts for bar center position
						const barStartProgress = index / displayLevels.length;
						const barEndProgress = (index + 1) / displayLevels.length;
						const barCenterProgress = (barStartProgress + barEndProgress) / 2;
						const isPlaybackActive =
							isPlaying && playbackProgress >= barCenterProgress;

						return (
							<View
								key={index}
								style={[
									styles.bar,
									{
										height: Math.max(4, level * 60), // Min height 4px, max 60px
										backgroundColor: isRecording
											? "#8B5CF6" // Purple during recording
											: isPlaybackActive
											? "#A855F7" // Lighter purple for played portion
											: "#C084FC", // Even lighter purple for unplayed
										opacity: isRecording
											? 0.7 + level * 0.3 // Dynamic opacity while recording
											: isPlaybackActive
											? 0.9 // Bright for played portion
											: 0.5, // Medium for unplayed portion
									},
								]}
							/>
						);
					})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		marginVertical: 10,
		height: 80,
		justifyContent: "center",
		width: "100%",
	},
	waveform: {
		flexDirection: "row",
		alignItems: "center",
		height: 60,
		width: "100%", // Take full width of parent container
		justifyContent: "center",
		overflow: "hidden", // Prevent bars from overflowing
	},
	bar: {
		width: 3,
		borderRadius: 1.5,
		minHeight: 4,
		marginHorizontal: 1, // Small gap between bars
	},
});

// Memoize the component to prevent unnecessary re-renders caused by duration updates
export const VoicePostWaveform = memo(
	VoicePostWaveformComponent,
	(prevProps, nextProps) => {
		// Only re-render if critical props change, ignore frequent duration updates during recording
		return (
			prevProps.isRecording === nextProps.isRecording &&
			prevProps.audioBlob === nextProps.audioBlob &&
			prevProps.isPlaying === nextProps.isPlaying &&
			prevProps.playbackPosition === nextProps.playbackPosition
			// Intentionally exclude duration to prevent re-renders every second
		);
	}
);
