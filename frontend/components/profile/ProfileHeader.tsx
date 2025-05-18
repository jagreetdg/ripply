import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ImageBackground,
	Animated,
	ViewStyle,
	TextStyle,
	Modal,
	Dimensions,
	Pressable,
	ImageStyle,
	Platform,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { getVoiceBio } from "../../services/api/voiceBioService";
import DefaultAvatar from "../DefaultAvatar";

interface ProfileHeaderProps {
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
}

interface VoiceBio {
	id: string;
	user_id: string;
	duration: number;
	audio_url: string;
	transcript?: string;
	created_at: string;
	updated_at: string;
}

interface Styles {
	container: ViewStyle;
	coverPhoto: ViewStyle;
	topBar: ViewStyle;
	iconButton: ViewStyle;
	profileInfo: ViewStyle;
	avatarContainer: ViewStyle;
	avatar: ImageStyle;
	defaultAvatar: ViewStyle;
	defaultAvatarText: TextStyle;
	nameContainer: ViewStyle;
	nameGroup: ViewStyle;
	nameRow: ViewStyle;
	name: TextStyle;
	username: TextStyle;
	verifiedBadge: TextStyle;
	biosContainer: ViewStyle;
	bio: TextStyle;
	voiceBioButton: ViewStyle;
	voiceBioContent: ViewStyle;
	iconWrapper: ViewStyle;
	playIcon: TextStyle;
	progressContainer: ViewStyle;
	progressBackground: ViewStyle;
	progressBar: ViewStyle;
	collapseButton: ViewStyle;
	stats: ViewStyle;
	statItem: ViewStyle;
	statNumber: TextStyle;
	statLabel: TextStyle;
	statDivider: ViewStyle;
	collapsedContainer: ViewStyle;
	collapsedContent: ViewStyle;
	collapsedInfo: ViewStyle;
	collapsedNameRow: ViewStyle;
	collapsedName: TextStyle;
	collapsedUsername: TextStyle;
	collapsedPostCount: TextStyle;
	voiceBioButtonPlaying: ViewStyle;
	voiceBioContainer: ViewStyle;
	voiceBioDuration: TextStyle;
	modalOverlay: ViewStyle;
	modalContent: ViewStyle;
	fullscreenImage: ImageStyle;
	actionButton: ViewStyle;
	actionButtonText: TextStyle;
	actionButtons: ViewStyle;
	fullscreenImageContainer: ViewStyle;
	profileImageContainer: ViewStyle;
	modalContainer: ViewStyle;
	noVoiceBioText: TextStyle;
	wave: ViewStyle;
}

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function ProfileHeader({
	userId,
	isCollapsed = false,
	postCount = 0,
	displayName,
	avatarUrl = null,
	coverPhotoUrl = null,
	bio = "",
	isVerified = false,
	isOwnProfile = false,
	username = "",
}: ProfileHeaderProps) {
	const router = useRouter();
	const [isVoiceBioPlaying, setIsVoiceBioPlaying] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const buttonWidth = useRef(new Animated.Value(32)).current;
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const [wave1] = useState(new Animated.Value(0));
	const [wave2] = useState(new Animated.Value(0));
	const [wave3] = useState(new Animated.Value(0));
	const [modalVisible, setModalVisible] = useState(false);
	const [activePhoto, setActivePhoto] = useState<"profile" | "cover" | null>(
		null
	);
	const [imageAspectRatio, setImageAspectRatio] = useState(1);
	const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
	const [loadingVoiceBio, setLoadingVoiceBio] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Fetch voice bio data
	useEffect(() => {
		const fetchVoiceBio = async () => {
			if (!userId) return;

			try {
				setLoadingVoiceBio(true);
				const data = await getVoiceBio(userId);
				setVoiceBio(data as VoiceBio | null);
			} catch (error) {
				console.error("Error fetching voice bio:", error);
			} finally {
				setLoadingVoiceBio(false);
			}
		};

		fetchVoiceBio();
	}, [userId]);

	const handleVoiceBioCollapse = () => {
		setIsExpanded(false);
		setIsVoiceBioPlaying(false);
		setProgress(0);
		if (progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}

		// Stop audio playback if it's playing
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}

		Animated.spring(buttonWidth, {
			toValue: 32,
			useNativeDriver: false,
			friction: 8,
		}).start();
	};

	useEffect(() => {
		if (isVoiceBioPlaying && !isSeeking) {
			// If we have an actual audio element, use it for progress
			if (audioRef.current) {
				progressInterval.current = setInterval(() => {
					const currentTime = audioRef.current?.currentTime || 0;
					const duration = audioRef.current?.duration || 1;
					const newProgress = currentTime / duration;

					setProgress(newProgress);

					if (newProgress >= 0.999) {
						handleVoiceBioCollapse();
					}
				}, 100);
			} else {
				// Fallback to simulated progress
				progressInterval.current = setInterval(() => {
					setProgress((currentProgress) => {
						const newProgress = currentProgress + 0.01;
						if (newProgress >= 1) {
							handleVoiceBioCollapse();
							return 0;
						}
						return newProgress;
					});
				}, 100);
			}
		} else if (!isVoiceBioPlaying && progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}

		return () => {
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
				progressInterval.current = null;
			}
		};
	}, [isVoiceBioPlaying, isSeeking]);

	const handleVoiceBioPlayPause = useCallback(() => {
		if (!voiceBio && !loadingVoiceBio) {
			console.log("No voice bio available");
			return;
		}

		setIsVoiceBioPlaying(!isVoiceBioPlaying);

		if (!isExpanded) {
			setIsExpanded(true);
			Animated.spring(buttonWidth, {
				toValue: 220,
				useNativeDriver: false,
				friction: 8,
			}).start();
		}

		// Handle actual audio playback if available
		if (voiceBio?.audio_url) {
			if (!audioRef.current) {
				audioRef.current = new Audio(voiceBio.audio_url);
				audioRef.current.addEventListener("ended", handleVoiceBioCollapse);
			}

			if (isVoiceBioPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play();
			}
		}
	}, [voiceBio, isVoiceBioPlaying, isExpanded, loadingVoiceBio]);

	const handleSeekStart = () => {
		setIsSeeking(true);
		if (audioRef.current) {
			audioRef.current.pause();
		}
	};

	const handleSeekEnd = () => {
		setIsSeeking(false);
		if (isVoiceBioPlaying && audioRef.current) {
			audioRef.current.play();
		}
	};

	const handleSeek = (event: any) => {
		if (!isSeeking) return;
		const { locationX } = event.nativeEvent;
		const progressBarWidth = 100; // Width of progress bar
		const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
		setProgress(newProgress);

		// Update audio position if available
		if (audioRef.current && voiceBio) {
			audioRef.current.currentTime = newProgress * voiceBio.duration;
		}
	};

	const handlePhotoPress = (type: "profile" | "cover") => {
		setActivePhoto(type);
		setModalVisible(true);
	};

	const handleEditPhoto = () => {
		// TODO: Implement photo editing
		console.log(`Edit ${activePhoto} photo`);
		setModalVisible(false);
	};

	const handleRemovePhoto = () => {
		// TODO: Implement photo removal
		console.log(`Remove ${activePhoto} photo`);
		setModalVisible(false);
	};

	if (isCollapsed) {
		return (
			<View style={styles.collapsedContainer}>
				<View style={styles.collapsedContent}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.iconButton}
					>
						<Feather name="arrow-left" size={24} color="#666666" />
					</TouchableOpacity>

					<View style={styles.collapsedInfo}>
						<View style={styles.collapsedNameRow}>
							<Text style={styles.collapsedName}>{displayName}</Text>
							<Text style={styles.collapsedUsername}>
								@{username || userId}
							</Text>
						</View>
						<Text style={styles.collapsedPostCount}>
							{postCount} voice notes
						</Text>
					</View>

					<TouchableOpacity style={styles.iconButton}>
						<Feather name="more-vertical" size={24} color="#666666" />
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Cover Photo */}
			{!isCollapsed && coverPhotoUrl && (
				<ImageBackground
					source={{ uri: coverPhotoUrl }}
					style={styles.coverPhoto}
					resizeMode="cover"
				>
					<BlurView
						intensity={50}
						tint="light"
						style={StyleSheet.absoluteFill}
					/>
					<View style={styles.topBar}>
						<TouchableOpacity
							style={styles.iconButton}
							onPress={() => router.back()}
						>
							<Feather name="arrow-left" size={24} color="#FFFFFF" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.iconButton}>
							<Feather name="more-vertical" size={24} color="#FFFFFF" />
						</TouchableOpacity>
					</View>
				</ImageBackground>
			)}

			{/* Profile Information */}
			<View style={styles.profileInfo}>
				{/* Avatar */}
				<TouchableOpacity
					style={[
						styles.avatarContainer,
						isCollapsed && { marginRight: 12, marginBottom: 0 },
					]}
					onPress={() => handlePhotoPress("profile")}
				>
					{avatarUrl ? (
						<Image
							source={{ uri: avatarUrl }}
							style={[styles.avatar, isCollapsed && { width: 32, height: 32 }]}
						/>
					) : (
						<DefaultAvatar
							size={isCollapsed ? 32 : 80}
							userId={userId || displayName}
						/>
					)}
				</TouchableOpacity>

				{/* Name, Username & Bio */}
				<View
					style={[
						isCollapsed ? styles.collapsedInfo : styles.nameContainer,
						{ flexDirection: isCollapsed ? "row" : "column" },
					]}
				>
					<View
						style={isCollapsed ? styles.collapsedNameRow : styles.nameGroup}
					>
						<View style={styles.nameRow}>
							<Text
								style={isCollapsed ? styles.collapsedName : styles.name}
								numberOfLines={1}
							>
								{displayName}
							</Text>
							{isVerified && (
								<MaterialIcons
									name="verified"
									size={isCollapsed ? 14 : 18}
									color="#6B2FBC"
									style={[styles.verifiedBadge, { marginLeft: 4 }]}
								/>
							)}
						</View>
						<Text
							style={isCollapsed ? styles.collapsedUsername : styles.username}
							numberOfLines={1}
						>
							@{username}
						</Text>
					</View>
					{isCollapsed && (
						<View style={{ marginLeft: "auto" }}>
							<Text style={styles.collapsedPostCount} numberOfLines={1}>
								{postCount} {postCount === 1 ? "post" : "posts"}
							</Text>
						</View>
					)}
				</View>

				{/* Bio & Voice Bio Button only in expanded view */}
				{!isCollapsed && bio && (
					<View style={styles.biosContainer}>
						<Text style={styles.bio}>{bio}</Text>
					</View>
				)}

				{/* Voice Bio Button (only in expanded view) */}
				{!isCollapsed && voiceBio && (
					<View
						style={[
							styles.voiceBioContainer,
							isExpanded && {
								marginVertical: 12,
								marginHorizontal: 16,
								height: isExpanded ? 60 : 40,
							},
						]}
					>
						<TouchableOpacity
							style={[
								isVoiceBioPlaying
									? styles.voiceBioButtonPlaying
									: styles.voiceBioButton,
								isExpanded && { width: "100%", height: 60 },
							]}
							onPress={handleVoiceBioPlayPause}
						>
							<View style={styles.voiceBioContent}>
								<View style={styles.iconWrapper}>
									{!isVoiceBioPlaying && (
										<Feather name="play" size={16} color="#6B2FBC" />
									)}
									{isVoiceBioPlaying && (
										<View
											style={{ flexDirection: "row", alignItems: "center" }}
										>
											{/* Voice Bio Waves Animation */}
											<Animated.View
												style={[
													styles.wave,
													{
														height: wave1.interpolate({
															inputRange: [0, 0.5, 1],
															outputRange: [3, 12, 3],
														}),
													},
												]}
											/>
											<Animated.View
												style={[
													styles.wave,
													{
														height: wave2.interpolate({
															inputRange: [0, 0.5, 1],
															outputRange: [3, 20, 3],
														}),
														marginHorizontal: 3,
													},
												]}
											/>
											<Animated.View
												style={[
													styles.wave,
													{
														height: wave3.interpolate({
															inputRange: [0, 0.5, 1],
															outputRange: [3, 15, 3],
														}),
													},
												]}
											/>
										</View>
									)}
								</View>
								<Text
									style={[
										styles.voiceBioDuration,
										{
											color: isVoiceBioPlaying ? "#FFFFFF" : "#6B2FBC",
											marginLeft: 6,
										},
									]}
								>
									Voice Bio{" "}
									{voiceBio && voiceBio.duration
										? formatDuration(voiceBio.duration)
										: ""}
								</Text>
							</View>

							{/* Progress bar for voice bio playback */}
							{isExpanded && (
								<View style={styles.progressContainer}>
									<Pressable
										style={styles.progressBackground}
										onPress={handleSeek}
									>
										<Animated.View
											style={[
												styles.progressBar,
												{
													width: `${progress * 100}%`,
												},
											]}
										/>
									</Pressable>
								</View>
							)}
						</TouchableOpacity>
					</View>
				)}

				{!isCollapsed && loadingVoiceBio && (
					<View style={styles.voiceBioContainer}>
						<ActivityIndicator size="small" color="#6B2FBC" />
					</View>
				)}

				{!isCollapsed && !voiceBio && !loadingVoiceBio && isOwnProfile && (
					<View style={styles.voiceBioContainer}>
						<Text style={styles.noVoiceBioText}>
							Add a voice bio to your profile
						</Text>
						<TouchableOpacity
							style={styles.voiceBioButton}
							onPress={() => router.push("/profile/voice-bio")}
						>
							<View style={styles.voiceBioContent}>
								<View style={styles.iconWrapper}>
									<Feather name="mic" size={16} color="#6B2FBC" />
								</View>
								<Text style={styles.voiceBioDuration}>Record Voice Bio</Text>
							</View>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{/* Full Screen Photo Modal */}
			<Modal
				visible={modalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalContainer}>
					<Pressable
						style={styles.modalOverlay}
						onPress={() => setModalVisible(false)}
					>
						<View style={styles.fullscreenImageContainer}>
							{activePhoto === "profile" && avatarUrl ? (
								<Image
									source={{ uri: avatarUrl }}
									style={[
										styles.fullscreenImage,
										{ aspectRatio: imageAspectRatio },
									]}
									resizeMode="contain"
								/>
							) : activePhoto === "cover" && coverPhotoUrl ? (
								<Image
									source={{ uri: coverPhotoUrl }}
									style={[
										styles.fullscreenImage,
										{ aspectRatio: imageAspectRatio },
									]}
									resizeMode="contain"
								/>
							) : null}
						</View>

						{/* Action buttons if viewing own profile */}
						{isOwnProfile && (
							<View style={styles.actionButtons}>
								<TouchableOpacity
									style={styles.actionButton}
									onPress={handleEditPhoto}
								>
									<Feather name="edit-2" size={24} color="#FFFFFF" />
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: "#FF3B30" }]}
									onPress={handleRemovePhoto}
								>
									<Feather name="trash-2" size={24} color="#FFFFFF" />
								</TouchableOpacity>
							</View>
						)}
					</Pressable>
				</View>
			</Modal>

			{/* Load audio element on web */}
			{Platform.OS === "web" && voiceBio && voiceBio.audio_url && (
				<audio
					ref={audioRef}
					src={voiceBio.audio_url}
					preload="auto"
					style={{ display: "none" }}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create<Styles>({
	container: {
		backgroundColor: "#FFFFFF",
	},
	coverPhoto: {
		height: 120,
		justifyContent: "flex-start",
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingTop: Platform.OS === "ios" ? 12 : 12,
	},
	iconButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	profileInfo: {
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 8,
		marginTop: -40,
	},
	avatarContainer: {
		padding: 3,
		backgroundColor: "#FFFFFF",
		borderRadius: 54,
		marginBottom: 4,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#E1E1E1",
	} as ImageStyle,
	defaultAvatar: {
		width: 80, // Default size, will be overridden by inline styles
		height: 80, // Default size, will be overridden by inline styles
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 40, // Default, will be overridden
		alignSelf: "center", // Ensure it's centered within its container
		overflow: "hidden", // Match the regular avatar overflow property
		position: "absolute", // Position it absolutely to fill the container
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	defaultAvatarText: {
		color: "white",
		fontSize: 40, // Default size, will be overridden by inline styles
		fontWeight: "bold",
	},
	nameContainer: {
		alignItems: "center",
		marginTop: 4,
		marginBottom: 4,
	},
	nameGroup: {
		alignItems: "center",
		gap: 2,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 0,
	},
	name: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#000000",
	},
	username: {
		fontSize: 15,
		color: "#666666",
		lineHeight: 18,
		textAlign: "center",
		marginBottom: 2,
	},
	verifiedBadge: {
		marginLeft: 6,
		marginTop: 1,
	},
	biosContainer: {
		alignItems: "center",
		width: "100%",
		marginBottom: 8,
		paddingHorizontal: 12,
	},
	bio: {
		color: "#666666",
		fontSize: 14,
		lineHeight: 18,
		textAlign: "center",
	},
	voiceBioContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 6,
	},
	voiceBioButton: {
		backgroundColor: "rgba(107, 47, 188, 0.1)",
		borderRadius: 16,
		height: 32,
		justifyContent: "center",
		alignItems: "flex-start",
		borderWidth: 1,
		borderColor: "rgba(107, 47, 188, 0.2)",
		padding: 0,
		overflow: "hidden",
		marginTop: 6,
	},
	voiceBioButtonPlaying: {
		backgroundColor: "#6B2FBC",
		borderRadius: 16,
		height: 32,
		justifyContent: "center",
		alignItems: "flex-start",
		borderWidth: 1,
		borderColor: "rgba(107, 47, 188, 0.3)",
		padding: 0,
		overflow: "hidden",
		marginTop: 6,
	},
	voiceBioContent: {
		flexDirection: "row",
		alignItems: "center",
		height: "100%",
		minWidth: 80,
	},
	iconWrapper: {
		width: 32,
		height: 32,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	playIcon: {
		marginLeft: 10,
	},
	progressContainer: {
		flex: 1,
		height: 4,
		marginHorizontal: 12,
		borderRadius: 2,
		overflow: "hidden",
		backgroundColor: "rgba(107, 47, 188, 0.1)",
	},
	progressBackground: {
		position: "absolute",
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(107, 47, 188, 0.1)",
	},
	progressBar: {
		height: "100%",
		backgroundColor: "#FFFFFF",
		borderRadius: 2,
	},
	collapseButton: {
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 4,
	},
	stats: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
		paddingHorizontal: 16,
	},
	statItem: {
		alignItems: "center",
		width: "30%",
	},
	statNumber: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	statLabel: {
		color: "#666666",
	},
	statDivider: {
		width: 1,
		height: 30,
		backgroundColor: "#E1E1E1",
		marginHorizontal: 8,
	},
	collapsedContainer: {
		backgroundColor: "#FFFFFF",
		height: 60,
		justifyContent: "center",
	},
	collapsedContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		gap: 16,
	},
	collapsedInfo: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	collapsedNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 2,
	},
	collapsedName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#000000",
	},
	collapsedUsername: {
		fontSize: 14,
		color: "#666666",
	},
	collapsedPostCount: {
		fontSize: 12,
		color: "#666666",
	},
	voiceBioDuration: {
		fontSize: 15,
		color: "#6B2FBC",
		marginLeft: 2,
		marginRight: 5,
		marginBottom: 2,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.9)",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
		backgroundColor: "rgba(0, 0, 0, 0.75)", // Darker background for better contrast
	},
	fullscreenImageContainer: {
		width: "80%", // Reduced from 100% to make it smaller
		maxWidth: 500, // Maximum width to prevent it from being too large
		backgroundColor: "transparent", // Changed from #E1E1E1 to transparent
		borderRadius: 12,
		overflow: "hidden",
	},
	fullscreenImage: {
		width: "100%",
		height: undefined,
		// No default aspectRatio - will be set dynamically
	},
	profileImageContainer: {
		width: "70%", // Reduced from 100% to make it smaller
		maxWidth: 300, // Maximum width for profile image
		aspectRatio: 1,
		backgroundColor: "transparent", // Changed from #E1E1E1 to transparent
		borderRadius: 12,
		overflow: "hidden",
		alignSelf: "center",
		justifyContent: "center",
		alignItems: "center",
	},
	actionButtons: {
		position: "absolute",
		bottom: 50,
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "center",
		gap: 16,
		paddingHorizontal: 16,
	},
	actionButton: {
		backgroundColor: "#6B2FBC",
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	actionButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	noVoiceBioText: {
		fontSize: 14,
		color: "#666666",
		marginTop: 6,
	},
	wave: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#FFFFFF",
		marginHorizontal: 2,
	},
});
