import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export interface VoiceRecorderControlsProps {
	isRecording: boolean;
	isPlaying: boolean;
	isUploading: boolean;
	hasRecording: boolean;
	recordingDuration: number;
	onStartRecording: () => void;
	onStopRecording: () => void;
	onPlayPause: () => void;
	onSave: () => void;
	onDelete: () => void;
}

export const VoiceRecorderControls: React.FC<VoiceRecorderControlsProps> = ({
	isRecording,
	isPlaying,
	isUploading,
	hasRecording,
	recordingDuration,
	onStartRecording,
	onStopRecording,
	onPlayPause,
	onSave,
	onDelete,
}) => {
	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
	};

	return (
		<View style={styles.controls}>
			{isRecording ? (
				<>
					<View style={styles.durationContainer}>
						<Text style={styles.duration}>
							{formatDuration(recordingDuration)}
						</Text>
						<View style={styles.recordingIndicator} />
					</View>
					<TouchableOpacity
						style={[styles.button, styles.stopButton]}
						onPress={onStopRecording}
						disabled={isUploading}
					>
						<Feather name="square" size={24} color="white" />
						<Text style={styles.buttonText}>Stop</Text>
					</TouchableOpacity>
				</>
			) : hasRecording ? (
				<>
					<View style={styles.durationContainer}>
						<Text style={styles.duration}>
							{formatDuration(recordingDuration)}
						</Text>
					</View>
					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.button, styles.playButton]}
							onPress={onPlayPause}
							disabled={isUploading}
						>
							<Feather
								name={isPlaying ? "pause" : "play"}
								size={24}
								color="white"
							/>
							<Text style={styles.buttonText}>
								{isPlaying ? "Pause" : "Play"}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.recordButton]}
							onPress={onStartRecording}
							disabled={isUploading}
						>
							<Feather name="mic" size={24} color="white" />
							<Text style={styles.buttonText}>Re-record</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.buttonRow}>
						<TouchableOpacity
							style={[styles.button, styles.saveButton]}
							onPress={onSave}
							disabled={isUploading}
						>
							{isUploading ? (
								<ActivityIndicator color="white" size="small" />
							) : (
								<>
									<Feather name="save" size={24} color="white" />
									<Text style={styles.buttonText}>Save</Text>
								</>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.deleteButton]}
							onPress={onDelete}
							disabled={isUploading}
						>
							<Feather name="trash-2" size={24} color="white" />
							<Text style={styles.buttonText}>Delete</Text>
						</TouchableOpacity>
					</View>
				</>
			) : (
				<TouchableOpacity
					style={[styles.button, styles.recordButton]}
					onPress={onStartRecording}
					disabled={isUploading}
				>
					<Feather name="mic" size={24} color="white" />
					<Text style={styles.buttonText}>Record</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	controls: {
		alignItems: "center",
	},
	durationContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	duration: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginRight: 8,
	},
	recordingIndicator: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#e74c3c",
		marginLeft: 8,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		marginBottom: 12,
	},
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		minWidth: 120,
	},
	recordButton: {
		backgroundColor: "#6B2FBC",
		flex: 1,
	},
	stopButton: {
		backgroundColor: "#e74c3c",
		width: "100%",
	},
	playButton: {
		backgroundColor: "#3498db",
		flex: 1,
		marginRight: 8,
	},
	saveButton: {
		backgroundColor: "#2ecc71",
		flex: 1,
		marginRight: 8,
	},
	deleteButton: {
		backgroundColor: "#e74c3c",
		flex: 1,
	},
	buttonText: {
		color: "white",
		fontWeight: "bold",
		marginLeft: 8,
		fontSize: 16,
	},
});
