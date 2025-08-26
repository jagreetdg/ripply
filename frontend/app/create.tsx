import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { VoicePostRecorder } from "../components/voice-post/VoicePostRecorder";

export default function CreateVoicePostScreen() {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<VoicePostRecorder />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
