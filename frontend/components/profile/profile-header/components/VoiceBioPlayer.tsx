import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	ActivityIndicator,
	Animated,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import { VoiceBioPlayerProps } from "../types";
import { formatDuration } from "../utils";

export const VoiceBioPlayer: React.FC<
	VoiceBioPlayerProps & {
		audioRef: React.RefObject<HTMLAudioElement>;
		progressContainerRef: React.RefObject<View>;
	}
> = ({
	voiceBio,
	loadingVoiceBio,
	isVoiceBioPlaying,
	isExpanded,
	progress,
	isSeeking,
	onTogglePlay,
	onExpand,
	onCollapse,
	onSeek,
	audioRef,
	progressContainerRef,
}) => {
	const { colors } = useTheme();

	const styles = {
		voiceBioButton: {
			height: 32,
			borderRadius: 16,
			backgroundColor: `${colors.tint}20`,
			marginTop: 12,
			paddingHorizontal: 8,
			flexDirection: "row" as const,
			alignItems: "center" as const,
			width: "auto" as const,
			minWidth: 120,
		},
		voiceBioButtonPlaying: {
			backgroundColor: `${colors.tint}30`,
		},
		voiceBioContent: {
			flex: 1,
			flexDirection: "row" as const,
			alignItems: "center" as const,
			justifyContent: "space-between" as const,
			paddingRight: 8,
		},
		iconWrapper: {
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: colors.tint,
			justifyContent: "center" as const,
			alignItems: "center" as const,
		},
		playIcon: {
			color: "white",
		},
		voiceBioContainer: {
			flex: 1,
			flexDirection: "row" as const,
			alignItems: "center" as const,
			paddingLeft: 8,
			paddingRight: 8,
		},
		voiceBioDuration: {
			fontSize: 12,
			color: colors.textSecondary,
			marginLeft: 8,
			marginRight: 8,
		},
		progressContainer: {
			flex: 1,
			flexDirection: "row" as const,
			height: 4,
			marginLeft: 8,
			marginRight: 8,
			alignItems: "center" as const,
		},
		progressBackground: {
			flex: 1,
			height: 4,
			backgroundColor: `${colors.tint}30`,
			borderRadius: 2,
		},
		progressBar: {
			height: 4,
			backgroundColor: colors.tint,
			borderRadius: 2,
		},
		collapseButton: {
			width: 24,
			height: 24,
			justifyContent: "center" as const,
			alignItems: "center" as const,
		},
		noVoiceBioText: {
			fontSize: 12,
			color: colors.textSecondary,
			marginLeft: 8,
		},
	};

	if (loadingVoiceBio) {
		return (
			<View style={styles.voiceBioButton}>
				<View style={styles.voiceBioContainer}>
					<ActivityIndicator size="small" color={colors.tint} />
					<Text style={styles.noVoiceBioText}>Loading...</Text>
				</View>
			</View>
		);
	}

	if (!voiceBio) {
		return null;
	}

	return (
		<Animated.View
			style={[
				styles.voiceBioButton,
				isVoiceBioPlaying && styles.voiceBioButtonPlaying,
				isExpanded ? { width: 200 } : { width: "auto" },
			]}
		>
			{isExpanded ? (
				<>
					<View style={styles.voiceBioContent}>
						<TouchableOpacity onPress={onTogglePlay}>
							<View style={styles.iconWrapper}>
								<Feather
									name={isVoiceBioPlaying ? "pause" : "play"}
									size={14}
									style={styles.playIcon}
								/>
							</View>
						</TouchableOpacity>

						<TouchableWithoutFeedback onPress={onSeek}>
							<View style={styles.progressContainer} ref={progressContainerRef}>
								<View style={styles.progressBackground} />
								<View
									style={[styles.progressBar, { width: `${progress * 100}%` }]}
								/>
							</View>
						</TouchableWithoutFeedback>

						<TouchableOpacity
							onPress={onCollapse}
							style={styles.collapseButton}
						>
							<Feather name="chevron-left" size={18} color={colors.tint} />
						</TouchableOpacity>
					</View>
					{Platform.OS === "web" && voiceBio && (
						// @ts-ignore
						<audio
							ref={audioRef}
							src={voiceBio.audio_url}
							onTimeUpdate={() => {
								if (audioRef.current && !isSeeking) {
									const currentTime = audioRef.current.currentTime;
									const duration = audioRef.current.duration;
									// This would need to be handled by the parent component
									// setProgress(currentTime / duration);
								}
							}}
							onEnded={onCollapse}
							style={{ display: "none" }}
						/>
					)}
				</>
			) : (
				<TouchableOpacity style={styles.voiceBioContainer} onPress={onExpand}>
					<View style={styles.iconWrapper}>
						<Feather name="headphones" size={14} style={styles.playIcon} />
					</View>
					<Text style={styles.voiceBioDuration}>
						{formatDuration(voiceBio.duration)}
					</Text>
				</TouchableOpacity>
			)}
		</Animated.View>
	);
};
