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
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	// Initialize audio analysis for real-time waveform
	useEffect(() => {
		if (!isRecording || Platform.OS !== "web") {
			return;
		}

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

		// If we have stored audio levels from recording, use those
		if (audioLevels.length > 0) {
			return audioLevels;
		}

		// Generate a more realistic waveform pattern based on duration
		const bars = Math.min(Math.max(duration * 3, 20), 60);
		const waveform = [];

		for (let i = 0; i < bars; i++) {
			const position = i / bars;
			
			// Create multiple wave patterns for more realistic audio visualization
			const primaryWave = Math.sin(position * Math.PI * 2) * 0.6;
			const secondaryWave = Math.sin(position * Math.PI * 6) * 0.3;
			const tertiaryWave = Math.sin(position * Math.PI * 12) * 0.2;
			
			// Combine waves with some randomness
			const combinedWave = primaryWave + secondaryWave + tertiaryWave;
			const noise = (Math.random() - 0.5) * 0.3;
			
			// Ensure levels are realistic (voice recordings typically vary between 0.2-0.9)
			const level = Math.max(0.15, Math.min(0.95, Math.abs(combinedWave) + noise + 0.3));
			waveform.push(level);
		}

		return waveform;
	};

	const displayLevels = isRecording ? audioLevels : generateStaticWaveform();

	// Calculate playback progress for visual feedback
	const playbackProgress = duration > 0 ? playbackPosition / duration : 0;

	return (
		<View style={styles.container}>
			<View style={styles.waveform}>
				{displayLevels.map((level, index) => {
					// Calculate if this bar should be highlighted based on playback position
					const barProgress = index / displayLevels.length;
					const isPlaybackActive = isPlaying && barProgress <= playbackProgress;

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
									marginRight: index < displayLevels.length - 1 ? 2 : 0, // Gap replacement
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
		marginVertical: 20,
		height: 80,
		justifyContent: "center",
	},
	waveform: {
		flexDirection: "row",
		alignItems: "center",
		height: 60,
	},
	bar: {
		width: 3,
		borderRadius: 1.5,
		minHeight: 4,
	},
});
