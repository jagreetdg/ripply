import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Text, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "./VoiceNoteCard";
import { Feather } from "@expo/vector-icons";
import { recordShare, recordPlay } from "../../services/api/voiceNoteService";

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
	// User data that might be included in the API response
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

interface VoiceNotesListProps {
	userId: string;
	userName?: string;
	voiceNotes?: VoiceNote[];
	onPlayVoiceNote?: (voiceNoteId: string) => void;
	onRefresh?: () => void;
}

// Empty array for when no voice notes are available
const EMPTY_VOICE_NOTES: VoiceNote[] = [];

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	
	if (diffInSeconds < 60) {
		return `${diffInSeconds}s ago`;
	} else if (diffInSeconds < 3600) {
		return `${Math.floor(diffInSeconds / 60)}m ago`;
	} else if (diffInSeconds < 86400) {
		return `${Math.floor(diffInSeconds / 3600)}h ago`;
	} else if (diffInSeconds < 604800) {
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	} else {
		return date.toLocaleDateString();
	}
};

// Define response types for API calls
interface PlayResponse {
  data?: {
    playCount: number;
    voiceNoteId: string;
  };
}

interface ShareResponse {
  data?: {
    shareCount: number;
    voiceNoteId: string;
  };
}

export function VoiceNotesList({ userId, userName, voiceNotes = [], onPlayVoiceNote, onRefresh }: VoiceNotesListProps) {
	// Get router for navigation
	const router = useRouter();
	// State for refresh control
	const [refreshing, setRefreshing] = useState(false);
	// State for voice notes
	const [localVoiceNotes, setLocalVoiceNotes] = useState<VoiceNote[]>(voiceNotes);
	
	// Use the provided userName or default to "User"
	const displayName = userName || "User";
	
	// Update local state when props change
	useEffect(() => {
		setLocalVoiceNotes(voiceNotes);
	}, [voiceNotes]);
	
	// Handle refresh
	const handleRefresh = () => {
		if (onRefresh) {
			setRefreshing(true);
			onRefresh();
			setRefreshing(false);
		}
	};
	
	// Handle play voice note
	const handlePlayVoiceNote = (voiceNoteId: string) => {
		// Call the provided callback if available
		if (onPlayVoiceNote) {
			onPlayVoiceNote(voiceNoteId);
		}
		
		// Record the play in the backend
		recordPlay(voiceNoteId, userId)
			.then((response: PlayResponse) => {
				// Update the local state with the new play count
				if (response?.data?.playCount) {
					setLocalVoiceNotes(prev => 
						prev.map(vn => 
							vn.id === voiceNoteId 
								? { ...vn, plays: response.data!.playCount } 
								: vn
						)
					);
				}
			})
			.catch(error => {
				console.error('Error recording play:', error);
			});
	};
	
	// Handle share voice note
	const handleShareVoiceNote = (voiceNoteId: string) => {
		// Record the share in the backend
		recordShare(voiceNoteId, userId)
			.then((response: ShareResponse) => {
				// Update the local state with the new share count
				if (response?.data?.shareCount) {
					setLocalVoiceNotes(prev => 
						prev.map(vn => 
							vn.id === voiceNoteId 
								? { ...vn, shares: response.data!.shareCount } 
								: vn
						)
					);
				}
			})
			.catch(error => {
				console.error('Error recording share:', error);
			});
	};
	
	// Handle playing a voice note
	const handlePlay = (voiceNoteId: string) => {
		if (onPlayVoiceNote) {
			onPlayVoiceNote(voiceNoteId);
		}
	};
	
	// Use provided voice notes or empty array
	const displayVoiceNotes = localVoiceNotes && localVoiceNotes.length > 0 ? localVoiceNotes : EMPTY_VOICE_NOTES;
	
	// Debug voice notes data
	console.log('VoiceNotesList received voice notes:', displayVoiceNotes);
	
	return (
		<View style={styles.container}>
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
				<View style={styles.separatorDot} />
				<View style={styles.separatorLine} />
			</View>
			
			{displayVoiceNotes.length === 0 ? (
				<View style={styles.emptyStateContainer}>
					<Feather name="mic-off" size={48} color="#ccc" />
					<Text style={styles.emptyStateText}>No voice notes yet</Text>
					<Text style={styles.emptyStateSubtext}>Voice notes you create will appear here</Text>
				</View>
			) : (
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
						{displayVoiceNotes.map((item) => {
							// Normalize the voice note to match the expected format
							const normalizedVoiceNote = {
								id: item.id,
								title: item.title,
								duration: item.duration,
								// Handle different formats of likes/comments/plays
								likes: Array.isArray(item.likes) ? (item.likes[0]?.count || 0) : (typeof item.likes === 'number' ? item.likes : 0),
								comments: Array.isArray(item.comments) ? (item.comments[0]?.count || 0) : (typeof item.comments === 'number' ? item.comments : 0),
								plays: Array.isArray(item.plays) ? (item.plays[0]?.count || 0) : (typeof item.plays === 'number' ? item.plays : 0),
								shares: item.shares || 0,
								backgroundImage: item.backgroundImage || item.background_image || null,
								tags: item.tags || [],
								// Add user avatar URL
								userAvatarUrl: item.users?.avatar_url || null
							};
							
							// Format the post date
							const timePosted = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';
							
							// Get the correct user ID and name for this specific voice note
							const noteUserId = item.user_id || userId;
							const noteUserName = item.users?.display_name || displayName;
							
							return (
								<View key={item.id} style={styles.cardContainer}>
									<VoiceNoteCard 
										voiceNote={normalizedVoiceNote} 
										userId={noteUserId} 
										userName={noteUserName}
										userAvatarUrl={normalizedVoiceNote.userAvatarUrl}
										timePosted={timePosted}
										onPlay={() => handlePlayVoiceNote(item.id)}
										onShare={() => handleShareVoiceNote(item.id)}
										onProfilePress={() => {
											// Use the voice note's user ID for navigation
											router.push(`/profile?userId=${noteUserId}`);
										}}
										currentUserId={userId}
									/>
								</View>
							);
						})}
					</View>
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	separatorContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: "#EEEEEE",
	},
	separatorDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#6B2FBC",
		marginHorizontal: 8,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 20,
	},
	cardContainer: {
		marginBottom: 16,
	},
	emptyStateContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 60,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#666',
		marginTop: 16,
	},
	emptyStateSubtext: {
		fontSize: 14,
		color: '#999',
		marginTop: 8,
		textAlign: 'center',
		paddingHorizontal: 32,
	},
});
