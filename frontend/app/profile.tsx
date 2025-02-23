import React from "react";
import { StyleSheet, SafeAreaView } from "react-native";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { VoiceNotesList } from "../components/profile/VoiceNotesList";

export default function ProfileScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<ProfileHeader userId="@username" />
			<VoiceNotesList userId="@username" />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
});
