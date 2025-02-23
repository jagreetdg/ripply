import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ImageBackground,
} from "react-native";

interface VoiceNote {
	id: string;
	duration: number;
	title: string;
	likes: number;
	comments: number;
	backgroundImage: string | null;
}

interface VoiceNoteCardProps {
	voiceNote: VoiceNote;
}

export function VoiceNoteCard({ voiceNote }: VoiceNoteCardProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);

	const handlePlayPause = () => {
		setIsPlaying(!isPlaying);
		// TODO: Implement actual audio playback
	};

	const Container = voiceNote.backgroundImage ? ImageBackground : View;
	const containerProps = voiceNote.backgroundImage
		? { source: { uri: voiceNote.backgroundImage }, style: styles.container }
		: { style: [styles.container, styles.plainContainer] };

	return (
		<Container {...containerProps}>
			<View style={styles.content}>
				<Text style={styles.title}>{voiceNote.title}</Text>

				<View style={styles.playerContainer}>
					<TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
						<Text style={styles.playButtonText}>{isPlaying ? "⏸" : "▶"}</Text>
					</TouchableOpacity>

					<View style={styles.progressContainer}>
						<View style={[styles.progressBar, { width: `${progress}%` }]} />
						<View style={styles.progressBackground} />
					</View>

					<Text style={styles.duration}>{voiceNote.duration}s</Text>
				</View>

				<View style={styles.interactions}>
					<TouchableOpacity style={styles.interactionButton}>
						<Text>❤️ {voiceNote.likes}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.interactionButton}>
						<Text>💬 {voiceNote.comments}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.interactionButton}>
						<Text>↗️</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Container>
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
	},
	content: {
		padding: 16,
		backgroundColor: "rgba(255, 255, 255, 0.9)",
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 12,
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
		backgroundColor: "#000000",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	playButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
	},
	progressContainer: {
		flex: 1,
		height: 4,
		backgroundColor: "#E1E1E1",
		borderRadius: 2,
		marginRight: 12,
	},
	progressBar: {
		position: "absolute",
		height: "100%",
		backgroundColor: "#000000",
		borderRadius: 2,
	},
	progressBackground: {
		position: "absolute",
		width: "100%",
		height: "100%",
		backgroundColor: "#E1E1E1",
		borderRadius: 2,
	},
	duration: {
		fontSize: 14,
		color: "#666666",
	},
	interactions: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
	},
	interactionButton: {
		padding: 8,
	},
});
