import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { VoiceNoteCard } from "./VoiceNoteCard";
import { Feather } from "@expo/vector-icons";

interface VoiceNotesListProps {
	userId: string;
}

// Temporary mock data
const MOCK_VOICE_NOTES = [
	{
		id: "1",
		duration: 120,
		title: "🎵 New song idea - let me know what you think!",
		likes: 2341,
		comments: 156,
		plays: 15723,
		shares: 432,
		backgroundImage:
			"https://images.unsplash.com/photo-1511379938547-c1f69419868d", // Music studio image
	},
	{
		id: "2",
		duration: 45,
		title: "Quick life update ✨",
		likes: 892,
		comments: 73,
		plays: 3421,
		shares: 127,
		backgroundImage: null,
	},
	{
		id: "3",
		duration: 180,
		title: "Sunset thoughts at the beach 🌅",
		likes: 1567,
		comments: 89,
		plays: 8932,
		shares: 345,
		backgroundImage:
			"https://images.unsplash.com/photo-1507525428034-b723cf961d3e", // Beautiful beach sunset
	},
	{
		id: "4",
		duration: 30,
		title: "Late night vibes 🌙",
		likes: 743,
		comments: 42,
		plays: 2156,
		shares: 98,
		backgroundImage:
			"https://images.unsplash.com/photo-1519692933481-e162a57d6721", // Starry night sky
	},
	{
		id: "5",
		duration: 60,
		title: "Morning motivation 💪",
		likes: 456,
		comments: 28,
		plays: 1893,
		shares: 76,
		backgroundImage: null,
	},
	{
		id: "6",
		duration: 90,
		title: "Rainy day thoughts 🌧️",
		likes: 921,
		comments: 67,
		plays: 4521,
		shares: 187,
		backgroundImage:
			"https://images.unsplash.com/photo-1519692933481-e162a57d6721", // Rain on window
	},
	{
		id: "7",
		duration: 40,
		title: "Coffee shop musings ☕",
		likes: 634,
		comments: 45,
		plays: 2789,
		shares: 123,
		backgroundImage: null,
	},
	{
		id: "8",
		duration: 150,
		title: "City lights story 🌆",
		likes: 1243,
		comments: 92,
		plays: 6234,
		shares: 276,
		backgroundImage:
			"https://images.unsplash.com/photo-1519501025264-65ba15a82390", // Night city view
	},
];

export function VoiceNotesList({ userId }: VoiceNotesListProps) {
	// Mock user data for profile
	const userName = "User";
	
	return (
		<View style={styles.container}>
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
				<View style={styles.separatorDot} />
				<View style={styles.separatorLine} />
			</View>
			<View style={styles.content}>
				{MOCK_VOICE_NOTES.map((item) => (
					<View key={item.id} style={styles.cardContainer}>
						<VoiceNoteCard 
							voiceNote={item} 
							userId={userId} 
							userName={userName}
						/>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	content: {
		padding: 16,
		backgroundColor: "#FFFFFF",
	},
	cardContainer: {
		marginBottom: 16,
	},
	separatorContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 24,
		paddingVertical: 8,
		backgroundColor: "#FFFFFF",
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: "rgba(107, 47, 188, 0.15)", // Updated to purple theme
	},
	separatorDot: {
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: "rgba(107, 47, 188, 0.3)", // Updated to purple theme
		marginHorizontal: 8,
	},
});
