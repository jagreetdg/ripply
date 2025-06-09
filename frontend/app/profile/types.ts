export interface UserProfile {
	id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	cover_photo_url: string | null;
	bio: string | null;
	is_verified: boolean;
	created_at: string;
	updated_at: string;
}

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
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
	is_shared?: boolean;
	shared_at?: string;
	shared_by?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

export interface VoiceBio {
	id: string;
	user_id: string;
	duration: number;
	audio_url: string;
	transcript?: string;
	created_at: string;
	updated_at: string;
}

export interface ProfilePageState {
	userProfile: UserProfile | null;
	voiceNotes: VoiceNote[];
	sharedVoiceNotes: VoiceNote[];
	combinedVoiceNotes: VoiceNote[];
	voiceBio: VoiceBio | null;
	followerCount: number;
	followingCount: number;
	loading: boolean;
	loadingVoiceNotes: boolean;
	loadingShared: boolean;
	refreshing: boolean;
	userNotFound: boolean;
	isOwnProfile: boolean;
	showFollowersPopup: boolean;
	showFollowingPopup: boolean;
	isHeaderCollapsed: boolean;
} 