import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	FlatList,
	Alert,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";

interface VoiceNote {
	id: string;
	uri: string;
	caption: string;
	duration: number;
	createdAt: Date;
}

interface VoiceNotesListProps {
	notes: VoiceNote[];
	onDeleteNote?: (id: string) => void;
}

export function VoiceNotesList({ notes, onDeleteNote }: VoiceNotesListProps) {
	const [playingId, setPlayingId] = useState<string | null>(null);
	const [sound, setSound] = useState<Audio.Sound | null>(null);

	const playPauseNote = useCallback(
		async (note: VoiceNote) => {
			try {
				if (playingId === note.id) {
					// Pause current note
					if (sound) {
						await sound.pauseAsync();
						setPlayingId(null);
					}
				} else {
					// Stop any currently playing sound
					if (sound) {
						await sound.unloadAsync();
					}

					// Play new note
					const { sound: newSound } = await Audio.Sound.createAsync(
						{ uri: note.uri },
						{ shouldPlay: true }
					);

					setSound(newSound);
					setPlayingId(note.id);

					// Set up event listeners
					newSound.setOnPlaybackStatusUpdate((status) => {
						if (status.isLoaded && status.didJustFinish) {
							setPlayingId(null);
							newSound.unloadAsync();
						}
					});
				}
			} catch (error) {
				console.error("Playback error:", error);
				Alert.alert("Error", "Failed to play voice note");
			}
		},
		[playingId, sound]
	);

	const deleteNote = useCallback(
		(id: string) => {
			Alert.alert(
				"Delete Voice Note",
				"Are you sure you want to delete this voice note?",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: () => {
							onDeleteNote?.(id);
							if (playingId === id) {
								setPlayingId(null);
								sound?.unloadAsync();
							}
						},
					},
				]
			);
		},
		[playingId, sound, onDeleteNote]
	);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const renderNote = ({ item }: { item: VoiceNote }) => {
		const isPlaying = playingId === item.id;

		return (
			<View style={styles.noteCard}>
				<View style={styles.noteHeader}>
					<Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
					<TouchableOpacity
						style={styles.deleteButton}
						onPress={() => deleteNote(item.id)}
					>
						<Feather name="trash-2" size={16} color="#EF4444" />
					</TouchableOpacity>
				</View>

				<Text style={styles.noteCaption} numberOfLines={2}>
					{item.caption || "No caption"}
				</Text>

				<View style={styles.noteFooter}>
					<TouchableOpacity
						style={[
							styles.playButton,
							{ backgroundColor: isPlaying ? "#EF4444" : "#8B5CF6" },
						]}
						onPress={() => playPauseNote(item)}
					>
						<Feather
							name={isPlaying ? "pause" : "play"}
							size={16}
							color="#FFFFFF"
						/>
					</TouchableOpacity>

					<Text style={styles.durationText}>{formatTime(item.duration)}</Text>
				</View>
			</View>
		);
	};

	if (notes.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Feather name="mic-off" size={48} color="#9CA3AF" />
				<Text style={styles.emptyTitle}>No Voice Notes Yet</Text>
				<Text style={styles.emptySubtitle}>
					Start recording your first voice note!
				</Text>
			</View>
		);
	}

	return (
		<FlatList
			data={notes}
			renderItem={renderNote}
			keyExtractor={(item) => item.id}
			style={styles.list}
			contentContainerStyle={styles.listContent}
			showsVerticalScrollIndicator={false}
		/>
	);
}

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
	listContent: {
		padding: 16,
	},
	noteCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	noteHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	noteDate: {
		fontSize: 12,
		color: "#9CA3AF",
		fontWeight: "500",
	},
	deleteButton: {
		padding: 4,
	},
	noteCaption: {
		fontSize: 16,
		color: "#1F2937",
		marginBottom: 12,
		lineHeight: 22,
	},
	noteFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	playButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	durationText: {
		fontSize: 14,
		color: "#6B7280",
		fontWeight: "500",
		fontFamily: "monospace",
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 40,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#1F2937",
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 16,
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 24,
	},
});
