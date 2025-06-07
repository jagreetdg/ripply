import React, { useCallback, memo } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VoiceNoteCard } from "../voice-note-card/VoiceNoteCard";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useRepostStatus } from "../../hooks/useRepostStatus";

interface FeedItemProps {
	item: {
		id: string;
		userId: string;
		userName: string;
		displayName?: string;
		userAvatar: string | null;
		timePosted: string;
		isShared?: boolean;
		sharedBy?: {
			id: string;
			username: string;
			displayName: string;
			avatarUrl: string | null;
		};
		voiceNote: {
			id: string;
			duration: number;
			title: string;
			likes: number;
			comments: number;
			plays: number;
			shares: number;
			backgroundImage: string | null;
		};
	};
	onProfilePress?: (userId: string) => void;
}

function FeedItemComponent({ item, onProfilePress }: FeedItemProps) {
	const router = useRouter();
	const { colors, isDarkMode } = useTheme();
	const { user } = useUser();

	// Use our new hook to get repost status
	const {
		isReposted: isRepostedByCurrentUser,
		isLoading: isLoadingRepostStatus,
	} = useRepostStatus(item.voiceNote.id);

	// Log the repost status for debugging
	console.log(`[FeedItem] Repost status for ${item.voiceNote.id}:`, {
		isRepostedByCurrentUser,
		isLoadingRepostStatus,
		currentUserId: user?.id,
	});

	// Use proper expo-router navigation
	const handleProfilePress = useCallback(() => {
		if (onProfilePress) {
			onProfilePress(item.userId);
		} else {
			// Fallback to default navigation if no custom handler is provided
			router.push({
				pathname: "/profile/[username]",
				params: { username: item.userName },
			});
		}
	}, [item.userId, item.userName, onProfilePress, router]);

	// Handle navigation to reposter's profile
	const handleReposterProfilePress = useCallback(() => {
		if (item.sharedBy) {
			router.push({
				pathname: "/profile/[username]",
				params: { username: item.sharedBy.username },
			});
		}
	}, [item.sharedBy, router]);

	// Determine if this is a reposted item (for attribution display)
	const isRepostedItem = !!item.isShared;

	// Log the current state for debugging
	console.log(`[FeedItem] Rendering voice note ${item.voiceNote.id}:`, {
		isRepostedItem, // Whether this post is a repost by someone (for attribution)
		isRepostedByCurrentUser, // Whether current user has reposted this (determines green highlight)
		currentUserId: user?.id,
		isShared: item.isShared,
	});

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					borderBottomColor: colors.border,
				},
			]}
		>
			{/* Show repost attribution if needed */}
			{isRepostedItem && item.sharedBy && (
				<View style={styles.repostAttribution}>
					<View style={styles.repostRow}>
						<Feather
							name="repeat"
							size={14}
							color={colors.textSecondary}
							style={{ marginRight: 4 }}
						/>
						<Text style={[styles.repostText, { color: colors.textSecondary }]}>
							Reposted by{" "}
							<Text
								style={[styles.repostUsername, { color: colors.tint }]}
								onPress={handleReposterProfilePress}
							>
								@{item.sharedBy.username}
							</Text>
						</Text>
					</View>
				</View>
			)}

			<View style={styles.header}>
				<TouchableOpacity
					style={styles.userInfoContainer}
					onPress={handleProfilePress}
				>
					<View style={[styles.avatar, { backgroundColor: colors.tint }]}>
						<Text style={styles.avatarText}>
							{item.userName.charAt(0).toUpperCase()}
						</Text>
					</View>
					<View style={styles.userInfo}>
						<Text style={[styles.userName, { color: colors.text }]}>
							{item.displayName || item.userName}
						</Text>
						<Text style={[styles.userId, { color: colors.textSecondary }]}>
							@{item.userName}
						</Text>
					</View>
				</TouchableOpacity>

				<View style={styles.timeContainer}>
					<Text style={[styles.timeText, { color: colors.textSecondary }]}>
						{item.timePosted}
					</Text>
					<TouchableOpacity style={styles.moreButton}>
						<Feather
							name="more-horizontal"
							size={16}
							color={colors.textSecondary}
						/>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.content}>
				<VoiceNoteCard
					voiceNote={item.voiceNote}
					userId={item.userId}
					username={item.userName}
					currentUserId={user?.id}
					onProfilePress={handleProfilePress}
					isReposted={isRepostedByCurrentUser}
					showRepostAttribution={isRepostedItem}
					sharedBy={item.sharedBy}
					isLoadingRepostStatus={isLoadingRepostStatus}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 8,
		borderBottomWidth: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	userInfoContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	avatarText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 16,
	},
	userInfo: {
		justifyContent: "center",
	},
	userName: {
		fontWeight: "bold",
		fontSize: 15,
	},
	userId: {
		fontSize: 13,
	},
	timeContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	timeText: {
		fontSize: 13,
		marginRight: 8,
	},
	moreButton: {
		padding: 4,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	repostAttribution: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 0,
	},
	repostRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	repostText: {
		fontSize: 13,
	},
	repostUsername: {
		fontWeight: "bold",
	},
});

// Use memo to prevent unnecessary re-renders
export const FeedItem = memo(FeedItemComponent);
