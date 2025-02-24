import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ImageBackground,
	Platform,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";

interface VoiceNote {
	id: string;
	duration: number;
	title: string;
	likes: number;
	comments: number;
	plays: number;
	shares: number;
	backgroundImage: string | null;
}

interface VoiceNoteCardProps {
	voiceNote: VoiceNote;
}

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatNumber = (num: number): string => {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + "m";
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + "k";
	}
	return num.toString();
};

const DefaultProfilePicture = ({
	userId,
	size = 32,
}: {
	userId: string;
	size: number;
}) => (
	<View
		style={[
			styles.defaultAvatar,
			{
				width: size,
				height: size,
				borderRadius: size / 2,
			},
		]}
	>
		<Text style={[styles.defaultAvatarText, { fontSize: size * 0.4 }]}>
			{userId.charAt(1).toUpperCase()}
		</Text>
	</View>
);

export function VoiceNoteCard({ voiceNote }: VoiceNoteCardProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const progressContainerRef = useRef<View>(null);
	const [progressContainerWidth, setProgressContainerWidth] = useState(0);

	useEffect(() => {
		if (isPlaying && !isSeeking) {
			progressInterval.current = setInterval(() => {
				setProgress((currentProgress) => {
					const newProgress = currentProgress + 0.01;
					if (newProgress >= 1) {
						setIsPlaying(false);
						return 0;
					}
					return newProgress;
				});
			}, 100);
		} else if (!isPlaying && progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}

		return () => {
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
				progressInterval.current = null;
			}
		};
	}, [isPlaying, isSeeking]);

	const handlePlayPause = () => {
		setIsPlaying(!isPlaying);
		// TODO: Implement actual audio playback
	};

	const calculateProgress = (pageX: number) => {
		progressContainerRef.current?.measure(
			(x, y, width, height, pageXOffset, pageYOffset) => {
				const containerStart = pageXOffset;
				const relativeX = Math.max(0, Math.min(width, pageX - containerStart));
				const newProgress = Math.max(0, Math.min(1, relativeX / width));
				setProgress(newProgress);
			}
		);
	};

	const handleSeekStart = (event: any) => {
		setIsSeeking(true);
		calculateProgress(event.nativeEvent.pageX);
	};

	const handleSeekMove = (event: any) => {
		if (isSeeking) {
			calculateProgress(event.nativeEvent.pageX);
		}
	};

	const handleSeekEnd = () => {
		setIsSeeking(false);
	};

	const renderProgressBar = () => (
		<View
			ref={progressContainerRef}
			style={styles.progressContainer}
			onTouchStart={handleSeekStart}
			onTouchMove={handleSeekMove}
			onTouchEnd={handleSeekEnd}
		>
			<View style={styles.progressBackground} />
			<View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
			<View style={styles.progressHitSlop} />
		</View>
	);

	if (!voiceNote.backgroundImage) {
		return (
			<View style={[styles.container, styles.plainContainer]}>
				<View style={styles.profilePictureContainer}>
					<DefaultProfilePicture userId="@username" size={32} />
				</View>
				<View style={styles.content}>
					<Text style={styles.title}>{voiceNote.title}</Text>

					<View style={styles.playerContainer}>
						<TouchableOpacity
							onPress={handlePlayPause}
							style={styles.playButton}
							activeOpacity={0.7}
						>
							<MaterialIcons
								name={isPlaying ? "pause" : "play-arrow"}
								size={24}
								color="white"
							/>
						</TouchableOpacity>

						{renderProgressBar()}

						<Text style={styles.duration}>
							{formatDuration(voiceNote.duration)}
						</Text>
					</View>

					<View style={styles.interactions}>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
						>
							<View style={styles.interactionContent}>
								<Feather name="heart" size={18} color="#666666" />
								<Text style={styles.interactionText}>
									{formatNumber(voiceNote.likes)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
						>
							<View style={styles.interactionContent}>
								<Feather name="message-circle" size={18} color="#666666" />
								<Text style={styles.interactionText}>
									{formatNumber(voiceNote.comments)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
						>
							<View style={styles.interactionContent}>
								<Feather name="headphones" size={18} color="#666666" />
								<Text style={styles.interactionText}>
									{formatNumber(voiceNote.plays || 0)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
						>
							<View style={styles.interactionContent}>
								<Feather name="share-2" size={18} color="#666666" />
								<Text style={styles.interactionText}>
									{formatNumber(voiceNote.shares)}
								</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	}

	return (
		<ImageBackground
			source={{ uri: voiceNote.backgroundImage }}
			style={styles.container}
			imageStyle={{ opacity: 1 }}
		>
			<View style={styles.overlay} />
			<View style={styles.profilePictureContainer}>
				<DefaultProfilePicture userId="@username" size={32} />
			</View>
			<View style={styles.content}>
				<Text style={styles.title}>{voiceNote.title}</Text>

				<View style={styles.playerContainer}>
					<TouchableOpacity
						onPress={handlePlayPause}
						style={styles.playButton}
						activeOpacity={0.7}
					>
						<MaterialIcons
							name={isPlaying ? "pause" : "play-arrow"}
							size={24}
							color="white"
						/>
					</TouchableOpacity>

					{renderProgressBar()}

					<Text style={styles.duration}>
						{formatDuration(voiceNote.duration)}
					</Text>
				</View>

				<View style={styles.interactions}>
					<TouchableOpacity
						style={styles.interactionButton}
						activeOpacity={0.7}
					>
						<View style={styles.interactionContent}>
							<Feather name="heart" size={18} color="#666666" />
							<Text style={styles.interactionText}>
								{formatNumber(voiceNote.likes)}
							</Text>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.interactionButton}
						activeOpacity={0.7}
					>
						<View style={styles.interactionContent}>
							<Feather name="message-circle" size={18} color="#666666" />
							<Text style={styles.interactionText}>
								{formatNumber(voiceNote.comments)}
							</Text>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.interactionButton}
						activeOpacity={0.7}
					>
						<View style={styles.interactionContent}>
							<Feather name="headphones" size={18} color="#666666" />
							<Text style={styles.interactionText}>
								{formatNumber(voiceNote.plays || 0)}
							</Text>
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.interactionButton}
						activeOpacity={0.7}
					>
						<View style={styles.interactionContent}>
							<Feather name="share-2" size={18} color="#666666" />
							<Text style={styles.interactionText}>
								{formatNumber(voiceNote.shares)}
							</Text>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
		borderRadius: 12,
		overflow: "hidden",
		minHeight: 150,
	},
	plainContainer: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.1)",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
		backgroundImage:
			"linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)",
	},
	content: {
		padding: 16,
		backgroundColor: "rgba(255, 255, 255, 0.7)",
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 12,
		color: "#000000",
	},
	playerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	playButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	progressContainer: {
		flex: 1,
		height: 24,
		backgroundColor: "transparent",
		borderRadius: 2,
		marginRight: 12,
		justifyContent: "center",
		position: "relative",
	},
	progressBackground: {
		position: "absolute",
		width: "100%",
		height: 4,
		backgroundColor: "rgba(107, 47, 188, 0.2)",
		borderRadius: 2,
		top: 10,
	},
	progressBar: {
		position: "absolute",
		height: 4,
		backgroundColor: "#6B2FBC",
		borderRadius: 2,
		top: 10,
		left: 0,
		zIndex: 1,
	},
	progressHitSlop: {
		position: "absolute",
		width: "100%",
		height: "100%",
		backgroundColor: "transparent",
	},
	duration: {
		fontSize: 14,
		color: "#666666",
		minWidth: 45,
		textAlign: "right",
	},
	interactions: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 12,
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
	},
	interactionButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	interactionContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: 65,
	},
	interactionText: {
		fontSize: 14,
		color: "#666666",
		marginLeft: 6,
	},
	defaultAvatar: {
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#fff",
	},
	defaultAvatarText: {
		color: "white",
		fontWeight: "bold",
	},
	profilePictureContainer: {
		position: "absolute",
		top: 12,
		right: 12,
		zIndex: 2,
		borderRadius: 16,
		backgroundColor: "transparent",
		overflow: Platform.OS === "android" ? "hidden" : "visible",
		...Platform.select({
			ios: {
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4,
			},
			android: {
				elevation: 4,
			},
		}),
	},
});
