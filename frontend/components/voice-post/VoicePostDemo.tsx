import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Modal,
	SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { VoiceRecorder } from "./VoiceRecorder";

interface VoicePostDemoProps {
	visible: boolean;
	onClose: () => void;
}

export function VoicePostDemo({ visible, onClose }: VoicePostDemoProps) {
	const [isRecording, setIsRecording] = useState(false);

	const handleRecordingComplete = (uri: string) => {
		console.log("Recording completed:", uri);
		setIsRecording(false);
	};

	const handleUploadComplete = () => {
		console.log("Upload completed");
		onClose();
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
		</Modal>
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
