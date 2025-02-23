import React from "react";
import { StyleSheet, View } from "react-native";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { VoiceNotesList } from "../components/profile/VoiceNotesList";

export default function ProfileScreen() {
	return (
		<View style={styles.container}>
			<ProfileHeader userId="@username" />
			<VoiceNotesList userId="@username" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
});
