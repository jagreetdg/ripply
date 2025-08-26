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

		// Generate pseudo-random waveform based on duration
		const bars = Math.min(Math.max(duration * 2, 10), 50);
		const waveform = [];

		for (let i = 0; i < bars; i++) {
			// Create a more natural looking waveform
			const position = i / bars;
			const base = Math.sin(position * Math.PI) * 0.8; // Bell curve shape
			const noise = (Math.random() - 0.5) * 0.4; // Add some randomness
			const level = Math.max(0.1, Math.min(1, base + noise));
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
										? colors.tint
										: isPlaybackActive
										? colors.tint // Highlight played portion during playback
										: colors.textSecondary,
									opacity: isRecording
										? 0.6 + level * 0.4 // Dynamic opacity while recording
										: isPlaybackActive
										? 0.9 // Bright for played portion
										: 0.4, // Dim for unplayed portion
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
		gap: 2,
	},
	bar: {
		width: 3,
		borderRadius: 1.5,
		minHeight: 4,
	},
});
