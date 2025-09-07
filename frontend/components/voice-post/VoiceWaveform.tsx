import React, { useEffect, useRef } from "react";
import {
	View,
	StyleSheet,
	Animated,
	Text,
	Platform,
	Dimensions,
} from "react-native";

interface VoiceWaveformProps {
	isRecording: boolean;
	duration: number;
}

export function VoiceWaveform({ isRecording, duration }: VoiceWaveformProps) {
	// Dynamic bar count based on screen width
	const screenWidth = Dimensions.get("window").width;
	const containerWidth = screenWidth - 80; // Account for padding
	const BAR_COUNT = Math.max(12, Math.min(30, Math.floor(containerWidth / 8))); // 8px per bar (3px width + 5px margin)

	// Create animated values array that updates when bar count changes
	const animatedValues = useRef<Animated.Value[]>([]);

	// Update animated values when bar count changes
	useEffect(() => {
		animatedValues.current = Array.from(
			{ length: BAR_COUNT },
			() => new Animated.Value(0.3)
		);
	}, [BAR_COUNT]);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const rafRef = useRef<number | null>(null);
	const analyserRef = useRef<any>(null);
	const sourceRef = useRef<any>(null);
	const audioCtxRef = useRef<any>(null);

	useEffect(() => {
		if (isRecording) {
			// Web: Use real mic levels via WebAudio analyser
			if (
				Platform.OS === "web" &&
				typeof navigator !== "undefined" &&
				(navigator as any).mediaDevices?.getUserMedia
			) {
				let cancelled = false;
				(async () => {
					try {
						const stream = await (navigator as any).mediaDevices.getUserMedia({
							audio: true,
						});
						if (cancelled) return;
						mediaStreamRef.current = stream;
						const AudioCtx =
							(window as any).AudioContext ||
							(window as any).webkitAudioContext;
						const audioCtx = new AudioCtx();
						audioCtxRef.current = audioCtx;
						const source = audioCtx.createMediaStreamSource(stream);
						sourceRef.current = source;
						const analyser = audioCtx.createAnalyser();
						analyser.fftSize = 1024;
						analyserRef.current = analyser;
						source.connect(analyser);

						const dataArray = new Uint8Array(analyser.frequencyBinCount);
						const tick = () => {
							analyser.getByteTimeDomainData(dataArray);
							// Higher sensitivity: amplify RMS and per-sample magnitude
							let rmsSum = 0;
							for (let i = 0; i < dataArray.length; i++) {
								const x = (dataArray[i] - 128) / 128;
								rmsSum += x * x;
							}
							const rms = Math.sqrt(rmsSum / dataArray.length);
							const center = (BAR_COUNT - 1) / 2;
							const half = center;
							for (
								let i = 0;
								i < BAR_COUNT && i < animatedValues.current.length;
								i++
							) {
								const sampleIndex = Math.floor(
									(i / BAR_COUNT) * dataArray.length
								);
								const v = Math.abs((dataArray[sampleIndex] - 128) / 128);
								let level = v * 2.3 + rms * 1.6; // amplify
								// Center weighting: central bars move more than edges (WhatsApp-like)
								const dist = Math.abs(i - center) / half; // 0 center -> 1 edge
								const centerBoost = 1 - dist * dist; // quadratic falloff
								const weight = 0.55 + 0.75 * centerBoost; // ~0.55 edges -> ~1.3 center
								level = Math.min(1, Math.max(0, level * weight));
								// Slight ease curve
								level = Math.pow(level, 0.7);
								level = Math.max(level, 0.04);
								animatedValues.current[i]?.setValue(level);
							}
							rafRef.current = (window as any).requestAnimationFrame(tick);
						};
						tick();
					} catch (e) {
						startPulse();
					}
				})();

				return () => {
					cancelCleanup();
					resetBars();
				};
			}

			// Native or fallback: simple pulse
			startPulse();
			return () => {
				resetBars();
			};
		} else {
			resetBars();
			cancelCleanup();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isRecording]);

	function cancelCleanup() {
		if (rafRef.current) {
			(window as any).cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		try {
			sourceRef.current && sourceRef.current.disconnect();
		} catch {}
		try {
			analyserRef.current &&
				analyserRef.current.disconnect &&
				analyserRef.current.disconnect();
		} catch {}
		try {
			mediaStreamRef.current &&
				mediaStreamRef.current.getTracks().forEach((t) => t.stop());
		} catch {}
		try {
			audioCtxRef.current &&
				audioCtxRef.current.close &&
				audioCtxRef.current.close();
		} catch {}
	}

	function startPulse() {
		const createPulseAnimation = (index: number) => {
			const animatedValue = animatedValues.current[index];
			if (!animatedValue) return null;

			return Animated.loop(
				Animated.sequence([
					Animated.timing(animatedValue, {
						toValue: 1,
						duration: 200 + (index % 6) * 60,
						useNativeDriver: false,
					}),
					Animated.timing(animatedValue, {
						toValue: 0.2,
						duration: 260 + (index % 6) * 60,
						useNativeDriver: false,
					}),
				])
			);
		};
		const animations = animatedValues.current
			.map((_, index) => createPulseAnimation(index))
			.filter(Boolean);
		animations.forEach((a) => a?.start());
	}

	function resetBars() {
		animatedValues.current.forEach((animatedValue) => {
			animatedValue?.setValue(0.3);
		});
	}

	if (!isRecording) {
		return (
			<View style={styles.container}>
				<Text style={styles.placeholderText}>
					{duration > 0
						? "Tap to record again"
						: "Tap the mic to start recording"}
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.waveform}>
				{animatedValues.current.map((animatedValue, index) => (
					<Animated.View
						key={index}
						style={[
							styles.bar,
							{
								height: animatedValue.interpolate({
									inputRange: [0, 1],
									outputRange: [6, 56],
								}),
								backgroundColor: animatedValue.interpolate({
									inputRange: [0, 1],
									outputRange: ["#E9D5FF", "#6B2FBC"],
								}),
							},
						]}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 80,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
	},
	waveform: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		height: 80,
		width: "100%",
		maxWidth: "100%",
		flexWrap: "nowrap",
	},
	bar: {
		width: 3,
		backgroundColor: "#8B5CF6",
		marginHorizontal: 1.5,
		borderRadius: 2,
		flexShrink: 0,
	},
	placeholderText: {
		fontSize: 14,
		color: "#9CA3AF",
		fontStyle: "italic",
		textAlign: "center",
	},
});
