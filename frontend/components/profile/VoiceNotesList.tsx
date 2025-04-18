import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text, RefreshControl, ScrollView } from "react-native";
import { VoiceNoteCard } from "./VoiceNoteCard";
import { Feather } from "@expo/vector-icons";

// Define the VoiceNote interface to match both API and local formats
interface VoiceNote {
	id: string;
	title: string;
	duration: number;
	likes: number | { count: number }[];
	comments: number | { count: number }[];
	plays: number | { count: number }[];
	shares?: number;
	backgroundImage?: string | null;
	background_image?: string | null;
	tags?: string[];
	user_id?: string;
	created_at?: string;
}

interface VoiceNotesListProps {
	userId: string;
	voiceNotes?: VoiceNote[];
	onPlayVoiceNote?: (voiceNoteId: string) => void;
	onRefresh?: () => void;
}

// Fallback mock data (only used if API fails)
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
		tags: ["music", "songwriting", "acoustic", "indie", "newmusic"],
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
		tags: ["life", "update", "personal", "journey"],
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
		tags: ["sunset", "beach", "ocean", "reflection", "nature", "thoughts"],
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
		tags: ["night", "vibes", "chill", "mood", "latenight", "ambient"],
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
		tags: ["motivation", "morning", "inspiration", "fitness", "wellness"],
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
		tags: ["rain", "thoughts", "cozy", "weather", "reflection", "mood"],
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
		tags: ["coffee", "cafe", "thoughts", "morning", "creative", "writing"],
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
		tags: ["city", "urban", "night", "lights", "story", "adventure", "cityscape"],
	},
];

export function VoiceNotesList({ userId, voiceNotes = [], onPlayVoiceNote, onRefresh }: VoiceNotesListProps) {
	// State for refresh control
	const [refreshing, setRefreshing] = useState(false);
	
	// Default user name (will be overridden by actual data)
	const userName = "User";
	
	// Handle refresh
	const handleRefresh = () => {
		if (onRefresh) {
			setRefreshing(true);
			// Call the parent's refresh function
			onRefresh();
			// Reset refreshing state after a timeout
			setTimeout(() => setRefreshing(false), 1500);
		}
	};
	
	// Handle playing a voice note
	const handlePlay = (voiceNoteId: string) => {
		if (onPlayVoiceNote) {
			onPlayVoiceNote(voiceNoteId);
		}
	};
	
	// Use provided voice notes or fallback to mock data if empty
	const displayVoiceNotes = voiceNotes.length > 0 ? voiceNotes : MOCK_VOICE_NOTES;
	
	return (
		<View style={styles.container}>
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
				<View style={styles.separatorDot} />
				<View style={styles.separatorLine} />
			</View>
			
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor="#6B2FBC"
						colors={["#6B2FBC"]}
					/>
				}
			>
				<View style={styles.content}>
					{displayVoiceNotes.length > 0 ? (
						displayVoiceNotes.map((item) => {
							// Normalize the voice note to match the expected format
							const normalizedVoiceNote = {
								id: item.id,
								title: item.title,
								duration: item.duration,
								// Handle different formats of likes/comments/plays
								likes: Array.isArray(item.likes) ? (item.likes[0]?.count || 0) : (item.likes || 0),
								comments: Array.isArray(item.comments) ? (item.comments[0]?.count || 0) : (item.comments || 0),
								plays: Array.isArray(item.plays) ? (item.plays[0]?.count || 0) : (item.plays || 0),
								shares: item.shares || 0,
								backgroundImage: item.backgroundImage || (item as any).background_image || null,
								tags: item.tags || [],
							};
							
							return (
								<View key={item.id} style={styles.cardContainer}>
									<VoiceNoteCard 
										voiceNote={normalizedVoiceNote} 
										userId={userId} 
										userName={userName}
										onPlay={() => handlePlay(item.id)}
									/>
								</View>
							);
						})
					) : (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>No voice notes found</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	emptyContainer: {
		padding: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
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
