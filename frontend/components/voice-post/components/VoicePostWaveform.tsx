import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

interface VoicePostWaveformProps {
	isRecording: boolean;
	audioBlob: Blob | null;
	duration: number;
	isPlaying?: boolean;
	playbackPosition?: number;
}

export function VoicePostWaveform({
	isRecording,
	audioBlob,
	duration,
	isPlaying = false,
	playbackPosition = 0,
}: VoicePostWaveformProps) {
	const { colors } = useTheme();
	const [audioLevels, setAudioLevels] = useState<number[]>([]);
	const [storedAudioLevels, setStoredAudioLevels] = useState<number[]>([]);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	// Initialize audio analysis for real-time waveform
	useEffect(() => {
		if (!isRecording || Platform.OS !== "web") {
			console.log('Audio analysis skipped:', { isRecording, platform: Platform.OS });
			return;
		}
		console.log('Starting audio analysis...');

		const initializeAudioAnalysis = async () => {
			try {
				// Get microphone stream
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				streamRef.current = stream;

				// Create audio context and analyser
				const audioContext = new (window.AudioContext ||
					(window as any).webkitAudioContext)();
				const analyser = audioContext.createAnalyser();
				const source = audioContext.createMediaStreamSource(stream);

				analyser.fftSize = 256;
				source.connect(analyser);

				audioContextRef.current = audioContext;
				analyserRef.current = analyser;

				// Start analyzing audio levels
				analyzeAudio();
			} catch (error) {
				console.error("Failed to initialize audio analysis:", error);
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

	// Store audio levels when recording stops, clear when recording starts
	useEffect(() => {
		if (isRecording) {
			// Recording just started, clear previous data
			setAudioLevels([]);
			setStoredAudioLevels([]);
		}
	}, [isRecording]);

	// Store audio levels when recording stops (separate effect to avoid infinite loop)
	useEffect(() => {
		if (
			!isRecording &&
			audioLevels.length > 0 &&
			storedAudioLevels.length === 0
		) {
			// Recording just stopped, store the audio levels
			console.log('Storing audio levels:', audioLevels.length, 'samples');
			setStoredAudioLevels([...audioLevels]);
		}
	}, [isRecording, audioLevels.length, storedAudioLevels.length]);

	const analyzeAudio = () => {
		if (!analyserRef.current) return;

		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserRef.current.getByteFrequencyData(dataArray);

		// Calculate average audio level
		const average =
			dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
		const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

		// Update audio levels (keep last 50 samples for waveform)
		setAudioLevels((prev) => {
			const newLevels = [...prev, normalizedLevel];
			return newLevels.slice(-50); // Keep last 50 samples
		});

		if (isRecording) {
			animationFrameRef.current = requestAnimationFrame(analyzeAudio);
		}
	};

	// Generate static waveform for completed recording
	const generateStaticWaveform = () => {
		if (!audioBlob) return [];

		// If we have stored audio levels from recording, use those (PRIORITIZE REAL DATA)
		if (storedAudioLevels.length > 0) {
			console.log('Using stored audio levels:', storedAudioLevels.length, 'samples');
			return storedAudioLevels;
		}

		// Fallback to current audioLevels if available
		if (audioLevels.length > 0) {
			console.log('Using current audio levels:', audioLevels.length, 'samples');
			return audioLevels;
		}

		console.log('No real audio data available, generating simulated waveform');

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

	return (
		<View style={styles.container}>
			<View style={styles.waveform}>
				{displayLevels.length > 0 &&
					displayLevels.map((level, index) => {
						// Calculate if this bar should be highlighted based on playback position
						const barProgress = index / displayLevels.length;
						const isPlaybackActive =
							isPlaying && barProgress <= playbackProgress;

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
		minWidth: 200, // Ensure minimum width so it's visible during recording
		justifyContent: "center",
	},
	bar: {
		width: 3,
		borderRadius: 1.5,
		minHeight: 4,
		marginHorizontal: 1, // Small gap between bars
	},
});
