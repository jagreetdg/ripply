import React from "react";
import { StyleSheet, FlatList } from "react-native";
import { VoiceNoteCard } from "./VoiceNoteCard";

interface VoiceNotesListProps {
	userId: string;
}

// Temporary mock data
const MOCK_VOICE_NOTES = [
	{
		id: "1",
		duration: 45,
		title: "My first voice note",
		likes: 123,
		comments: 45,
		backgroundImage:
			"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
	},
	{
		id: "2",
		duration: 30,
		title: "Quick update",
		likes: 89,
		comments: 12,
		backgroundImage: null,
	},
];

export function VoiceNotesList({ userId }: VoiceNotesListProps) {
	return (
		<FlatList
			data={MOCK_VOICE_NOTES}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => <VoiceNoteCard voiceNote={item} />}
			contentContainerStyle={styles.container}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
});
