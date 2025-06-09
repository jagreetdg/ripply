export interface ProfileHeaderProps {
	userId: string;
	isCollapsed?: boolean;
	postCount?: number;
	displayName: string;
	avatarUrl?: string | null;
	coverPhotoUrl?: string | null;
	bio?: string;
	isVerified?: boolean;
	isOwnProfile?: boolean;
	username?: string;
	onHeaderPress?: () => void; // For scroll-to-top functionality in collapsed header
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

export interface ProfileHeaderState {
	isVoiceBioPlaying: boolean;
	isExpanded: boolean;
	progress: number;
	isSeeking: boolean;
	modalVisible: boolean;
	activePhoto: "profile" | "cover" | null;
	localAvatarUrl: string | null;
	localCoverPhotoUrl: string | null;
	voiceBio: VoiceBio | null;
	loadingVoiceBio: boolean;
}

export interface VoiceBioPlayerProps {
	voiceBio: VoiceBio | null;
	loadingVoiceBio: boolean;
	isVoiceBioPlaying: boolean;
	isExpanded: boolean;
	progress: number;
	isSeeking: boolean;
	onTogglePlay: () => void;
	onExpand: () => void;
	onCollapse: () => void;
	onSeek: (event: any) => void;
}

export interface CollapsedHeaderProps {
	userId: string;
	displayName: string;
	username: string;
	isVerified: boolean;
	localAvatarUrl: string | null;
	onHeaderPress?: () => void;
	onBackPress: () => void;
}

export interface ExpandedHeaderProps {
	userId: string;
	displayName: string;
	username: string;
	bio?: string;
	isVerified: boolean;
	localAvatarUrl: string | null;
	localCoverPhotoUrl: string | null;
	voiceBio: VoiceBio | null;
	loadingVoiceBio: boolean;
	isVoiceBioPlaying: boolean;
	isExpanded: boolean;
	progress: number;
	isSeeking: boolean;
	onPhotoPress: (type: "profile" | "cover") => void;
	onToggleVoiceBio: () => void;
	onExpandVoiceBio: () => void;
	onCollapseVoiceBio: () => void;
	onSeekVoiceBio: (event: any) => void;
} 