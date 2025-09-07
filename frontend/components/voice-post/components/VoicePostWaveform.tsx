import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Platform, Dimensions } from "react-native";
import { VoiceWaveform } from "../VoiceWaveform";

interface Props {
	isRecording: boolean;
	audioBlob: Blob | null;
	duration: number;
	isPlaying: boolean;
	playbackPosition: number;
	onAudioLevelsReady?: (levels: number[]) => void;
}

export function VoicePostWaveform({
	isRecording,
	audioBlob,
	duration,
	isPlaying,
	playbackPosition,
}: Props) {
	// During recording: realtime mic-based waveform (web handled inside VoiceWaveform)
	if (isRecording) {
		return (
			<View style={{ flex: 1 }}>
				<VoiceWaveform isRecording={true} duration={duration} />
			</View>
		);
	}

	// After recording: decoded waveform synced to playback
	return (
		<DecodedWaveform
			audioBlob={audioBlob}
			isPlaying={isPlaying}
			playbackPosition={playbackPosition}
			totalDuration={duration}
		/>
	);
}

function DecodedWaveform({
	audioBlob,
	isPlaying,
	playbackPosition,
	totalDuration,
}: {
	audioBlob: Blob | null;
	isPlaying: boolean;
	playbackPosition: number;
	totalDuration: number;
}) {
	const [levels, setLevels] = useState<number[]>([]);
	// Dynamic bar count based on screen width
	const screenWidth = Dimensions.get("window").width;
	const containerWidth = screenWidth - 120; // Account for padding and play button
	const BAR_COUNT = Math.max(15, Math.min(50, Math.floor(containerWidth / 6))); // 6px per bar (2.5px width + 3.5px margin)
	const decodedRef = useRef<boolean>(false);

	useEffect(() => {
		if (!audioBlob || Platform.OS !== "web" || decodedRef.current) return;
		let cancelled = false;
		(async () => {
			try {
				const arrayBuf = await audioBlob.arrayBuffer();
				const AudioCtx =
					(window as any).AudioContext || (window as any).webkitAudioContext;
				const ctx = new AudioCtx();
				const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
				if (cancelled) {
					ctx.close();
					return;
				}
				const channelData = audioBuffer.getChannelData(0);
				const samplesPerBar = Math.max(
					1,
					Math.floor(channelData.length / BAR_COUNT)
				);
				const arr: number[] = [];
				for (let i = 0; i < BAR_COUNT; i++) {
					const start = i * samplesPerBar;
					const end = Math.min(channelData.length, start + samplesPerBar);
					let peak = 0;
					for (let j = start; j < end; j++) {
						peak = Math.max(peak, Math.abs(channelData[j]));
					}
					arr.push(Math.min(1, Math.max(peak, 0.02)));
				}
				setLevels(arr);
				decodedRef.current = true;
				ctx.close();
			} catch (e) {
				setLevels([]);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [audioBlob]);

	const playIndex = useMemo(() => {
		if (!Array.isArray(levels) || levels.length === 0 || !totalDuration)
			return -1;
		const ratio = Math.max(
			0,
			Math.min(1, playbackPosition / Math.max(0.001, totalDuration))
		);
		return Math.min(levels.length - 1, Math.floor(ratio * (levels.length - 1)));
	}, [levels, playbackPosition, totalDuration]);

	return (
		<View
			style={{
				flex: 1,
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				height: 60,
				width: "100%",
				maxWidth: "100%",
				flexWrap: "nowrap",
			}}
		>
			{levels.map((v, i) => {
				const filled = isPlaying ? i <= playIndex : i < 0; // if not playing, keep all gray
				return (
					<View
						key={i}
						style={{
							width: 2,
							marginHorizontal: 1,
							height: 8 + v * 36,
							borderRadius: 2,
							backgroundColor: filled ? "#8B5CF6" : "#D1D5DB",
							opacity: filled ? 1 : 0.9,
							flexShrink: 0,
						}}
					/>
				);
			})}
		</View>
	);
}
