import React from 'react'; // Needed for React.ReactElement

// Define the VoiceNote interface to match API format
export interface VoiceNote {
	id: string;
	title: string;
	duration: number;
	audio_url: string;
	created_at: string;
	likes: number;
	comments: number;
	plays: number;
	shares: number;
	tags?: string[];
	background_image?: string | null;
	backgroundImage?: string | null; // Alternative name for compatibility
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	user_id?: string; // Sometimes included instead of users object
	// Shared information
	is_shared?: boolean;
	shared_at?: string;
	shared_by?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	// For shared voice notes
	original_user_id?: string;
	original_voice_note_id?: string;
	sharer_id?: string;
	sharer_username?: string;
	sharer_display_name?: string;
	sharer_avatar_url?: string | null;
	originalVoiceNote?: VoiceNote; // Nested original voice note details
	currentUserHasShared?: boolean; // Whether the currently logged in user has shared this note
}

export interface VoiceNotesListProps {
	userId: string;
	username?: string;
	displayName?: string;
	voiceNotes: VoiceNote[];
	onPlayVoiceNote?: (voiceNoteId: string) => void;
	onRefresh?: () => void;
	isSharedList?: boolean;
	showRepostAttribution?: boolean;
	listHeaderComponent?: React.ReactElement | null;
	isOwnProfile: boolean;
	activeTab?: "voicenotes" | "shared"; // Made optional since we're combining tabs
	loadingNotes?: boolean; // Add this property to indicate if notes are being loaded
} 