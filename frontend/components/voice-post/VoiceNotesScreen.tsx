import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	TouchableOpacity,
	Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { VoiceRecorder } from "./VoiceRecorder";
import { VoiceNotesList } from "./VoiceNotesList";

interface VoiceNote {
	id: string;
	uri: string;
	caption: string;
	duration: number;
	createdAt: Date;
}

export function VoiceNotesScreen() {
	const [notes, setNotes] = useState<VoiceNote[]>([]);
	const [showRecorder, setShowRecorder] = useState(false);

	const handleRecordingComplete = useCallback((uri: string) => {
		console.log("Recording completed:", uri);
		// The recording will be handled by the upload process
	}, []);

	const handleUploadComplete = useCallback(() => {
		console.log("Upload completed");
		setShowRecorder(false);
		// In a real app, you would refresh the notes list here
		// For now, we'll just show a success message
		Alert.alert("Success", "Voice note saved successfully!");
	}, []);

	const handleDeleteNote = useCallback((id: string) => {
		setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
	}, []);

	const handleAddNote = useCallback(() => {
		setShowRecorder(true);
	}, []);

	const handleCloseRecorder = useCallback(() => {
		setShowRecorder(false);
	}, []);

	if (showRecorder) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.closeButton}
						onPress={handleCloseRecorder}
					>
						<Feather name="x" size={24} color="#1F2937" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Record Voice Note</Text>
					<View style={styles.placeholder} />
				</View>

				<VoiceRecorder
					onRecordingComplete={handleRecordingComplete}
					onUploadComplete={handleUploadComplete}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Voice Notes</Text>
				<TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
					<Feather name="plus" size={24} color="#FFFFFF" />
				</TouchableOpacity>
			</View>

			<VoiceNotesList notes={notes} onDeleteNote={handleDeleteNote} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#1F2937",
	},
	addButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#8B5CF6",
		alignItems: "center",
		justifyContent: "center",
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	closeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F3F4F6",
	},
	placeholder: {
		width: 40,
	},
});
