export interface UserType {
	id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	is_verified?: boolean;
}

export interface FollowRelation {
	follower_id?: string;
	following_id?: string;
	users?: UserType;
	[key: string]: any; // For other potential fields
}

export interface FollowersFollowingPopupProps {
	visible: boolean;
	userId: string;
	onClose: () => void;
	initialTab: "followers" | "following";
}

export interface FollowersFollowingState {
	users: UserType[];
	loading: boolean;
	mounted: boolean;
	renderKey: number;
}

export interface UserItemProps {
	user: UserType;
	currentUserId?: string;
	onProfilePress: (username: string) => void;
	onFollowChange: (userId: string, isFollowing: boolean, updatedCount?: number) => void;
	isLast?: boolean;
}

export interface UserAvatarProps {
	user: UserType;
} 