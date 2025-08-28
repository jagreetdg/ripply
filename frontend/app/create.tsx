import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { VoicePostRecorder } from "../components/voice-post/VoicePostRecorder";

export default function CreateScreen() {
	const [modalVisible, setModalVisible] = useState(true);
	const router = useRouter();

	const handleClose = () => {
		setModalVisible(false);
		// Small delay to allow modal animation to complete before navigation
		setTimeout(() => {
			router.back();
		}, 300);
	};

	return (
		<View style={{ flex: 1 }}>
			<VoicePostRecorder visible={modalVisible} onClose={handleClose} />
		</View>
	);
}
