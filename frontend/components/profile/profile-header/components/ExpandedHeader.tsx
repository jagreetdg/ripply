import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Image,
	ImageBackground,
	StyleSheet,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import DefaultAvatar from "../../../DefaultAvatar";
import DefaultCoverPhoto from "../../../DefaultCoverPhoto";
import { VoiceBioPlayer } from "./VoiceBioPlayer";
import { ExpandedHeaderProps } from "../types";

export const ExpandedHeader: React.FC<
	ExpandedHeaderProps & {
		audioRef: React.RefObject<HTMLAudioElement>;
		progressContainerRef: React.RefObject<any>;
	}
> = ({
	userId,
	displayName,
	username,
	bio,
	isVerified,
	localAvatarUrl,
	localCoverPhotoUrl,
	voiceBio,
	loadingVoiceBio,
	isVoiceBioPlaying,
	isExpanded,
	progress,
	isSeeking,
	onPhotoPress,
	onToggleVoiceBio,
	onExpandVoiceBio,
	onCollapseVoiceBio,
	onSeekVoiceBio,
	audioRef,
	progressContainerRef,
}) => {
	const { colors, isDarkMode } = useTheme();

	return (
		<View style={styles.container}>
			{/* Cover photo - clickable for photo viewer */}
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => onPhotoPress("cover")}
				style={styles.coverPhotoContainer}
			>
				{localCoverPhotoUrl ? (
					<ImageBackground
						source={{ uri: localCoverPhotoUrl }}
						style={styles.coverPhoto}
						resizeMode="cover"
					/>
				) : (
					<DefaultCoverPhoto
						width={400}
						height={150}
						style={styles.coverPhoto}
					/>
				)}

				{/* Visual back button (not touchable) */}
				<View style={styles.backButtonAbsolute}>
					<Feather
						name="arrow-left"
						size={24}
						color={
							localCoverPhotoUrl ? "white" : isDarkMode ? "white" : "black"
						}
					/>
				</View>
			</TouchableOpacity>

			{/* Profile info */}
			<View style={styles.profileInfo}>
				{/* Avatar */}
				<View style={[styles.avatarContainer, { pointerEvents: "box-none" }]}>
					<TouchableOpacity
						onPress={() => onPhotoPress("profile")}
						activeOpacity={0.8}
						style={{
							width: 80,
							height: 80,
							borderRadius: 40,
							pointerEvents: "auto",
						}}
					>
						{localAvatarUrl ? (
							<Image
								source={{ uri: localAvatarUrl }}
								style={styles.avatar}
								resizeMode="cover"
							/>
						) : (
							<DefaultAvatar userId={userId} size={80} />
						)}
					</TouchableOpacity>
				</View>

				{/* Name and bio */}
				<View style={styles.nameContainer}>
					<View style={styles.nameGroup}>
						<View style={styles.nameRow}>
							<Text style={[styles.name, { color: colors.text }]}>
								{displayName}
							</Text>
							{isVerified && (
								<MaterialIcons
									name="verified"
									size={16}
									color={colors.tint}
									style={styles.verifiedBadge}
								/>
							)}
						</View>
						<Text style={[styles.username, { color: colors.textSecondary }]}>
							@{username}
						</Text>
					</View>

					{/* Bio text */}
					{bio && (
						<View style={styles.biosContainer}>
							<Text style={[styles.bio, { color: colors.text }]}>{bio}</Text>
						</View>
					)}

					{/* Voice bio player */}
					<VoiceBioPlayer
						voiceBio={voiceBio}
						loadingVoiceBio={loadingVoiceBio}
						isVoiceBioPlaying={isVoiceBioPlaying}
						isExpanded={isExpanded}
						progress={progress}
						isSeeking={isSeeking}
						onTogglePlay={onToggleVoiceBio}
						onExpand={onExpandVoiceBio}
						onCollapse={onCollapseVoiceBio}
						onSeek={onSeekVoiceBio}
						audioRef={audioRef}
						progressContainerRef={progressContainerRef}
					/>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: "transparent",
	},
	coverPhotoContainer: {
		position: "relative",
	},
	coverPhoto: {
		width: "100%",
		height: 150,
		justifyContent: "flex-end",
	},
	backButtonAbsolute: {
		position: "absolute",
		top: 16,
		left: 16,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	profileInfo: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	avatarContainer: {
		alignItems: "center",
		marginTop: -40,
		marginBottom: 16,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 3,
		borderColor: "white",
	},
	nameContainer: {
		alignItems: "center",
	},
	nameGroup: {
		alignItems: "center",
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	name: {
		fontSize: 18,
		fontWeight: "bold",
		marginRight: 4,
	},
	username: {
		fontSize: 14,
		marginTop: 2,
	},
	verifiedBadge: {
		marginLeft: 4,
		marginTop: 2,
	},
	biosContainer: {
		marginTop: 12,
		alignItems: "center",
	},
	bio: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
	},
});
