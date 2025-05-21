// Types for VoiceNoteCard component

// Define API response types
export interface ShareResponse {
	shareCount: number;
	isShared: boolean;
	message?: string;
	voiceNoteId?: string;
	userId?: string;
	error?: string;
}

export interface CommentsResponse {
	data: Comment[];
}

// Comment interface
export interface Comment {
	id: string;
	voice_note_id?: string;
	content: string;
	created_at: string;
	user_id: string;
	user?: {
		id?: string;
		username: string;
		display_name: string;
		avatar_url?: string | null;
	};
}

export interface VoiceNote {
	id: string;
	duration: number;
	title: string;
	likes: number;
	comments: number;
	plays: number;
	shares: number;
	backgroundImage: string | null;
	tags?: string[];
	userAvatarUrl?: string | null;
	// Add the users property to match the API response structure
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	isLoadingStats?: boolean; // Flag to show loading indicators for stats
}

export interface VoiceNoteCardProps {
	voiceNote: VoiceNote;
	userId?: string;
	displayName?: string; // Display name (human-readable)
	username?: string; // Username for routing and @ mentions
	userAvatarUrl?: string | null;
	timePosted?: string;
	onPlay?: () => void;
	onPlayPress?: () => void; // Alternative name for onPlay
	onProfilePress?: () => void;
	onUserProfilePress?: () => void; // Alternative name for onProfilePress
	onShare?: (voiceNoteId: string) => void;
	currentUserId?: string;
	isShared?: boolean; // Whether this post is a shared/reposted voice note
	sharedBy?: {
		// Info about who shared the voice note
		id: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
	} | null;
	showRepostAttribution?: boolean; // Whether to show repost attribution
	voiceNoteUsers?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
} 