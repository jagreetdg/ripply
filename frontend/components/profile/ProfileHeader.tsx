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
	Platform,
	ActivityIndicator,
	TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { getVoiceBio } from "../../services/api/voiceBioService";
import DefaultAvatar from "../DefaultAvatar";
import DefaultCoverPhoto from "../DefaultCoverPhoto";
import { useTheme } from "../../context/ThemeContext";
import { PhotoViewerModal } from "./PhotoViewerModal";

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
	onHeaderPress?: () => void; // For scroll-to-top functionality in collapsed header
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
	avatar: ViewStyle;
	avatarSmall: ViewStyle;
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

	noVoiceBioText: TextStyle;
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
	onHeaderPress,
}: ProfileHeaderProps) {
	const router = useRouter();
	const { colors, isDarkMode } = useTheme();
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
	const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(
		avatarUrl
	);
	const [localCoverPhotoUrl, setLocalCoverPhotoUrl] = useState<string | null>(
		coverPhotoUrl
	);
	const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
	const [loadingVoiceBio, setLoadingVoiceBio] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const progressContainerRef = useRef<View>(null);

	// Sync local state with props
	useEffect(() => {
		setLocalAvatarUrl(avatarUrl);
		setLocalCoverPhotoUrl(coverPhotoUrl);
	}, [avatarUrl, coverPhotoUrl]);

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

	const handlePhotoUpdated = (
		type: "profile" | "cover",
		newUrl: string | null
	) => {
		if (type === "profile") {
			setLocalAvatarUrl(newUrl);
		} else {
			setLocalCoverPhotoUrl(newUrl);
		}
	};

	// Dynamic styles based on theme
	const styles = StyleSheet.create({
		container: {
			backgroundColor: colors.background,
		},
		coverPhotoContainer: {
			position: "relative",
			width: "100%",
			height: 150,
		},
		coverPhoto: {
			width: "100%",
			height: 150,
		},
		backButtonAbsolute: {
			position: "absolute",
			top: 16,
			left: 16,
			zIndex: 10,
			// Complete button style - no inheritance
			width: 42,
			height: 42,
			borderRadius: 21,
			backgroundColor: "rgba(0, 0, 0, 0.3)",
			justifyContent: "center",
			alignItems: "center",
			// No margins or padding that could expand touch area
			margin: 0,
			padding: 0,
			// Make it visual-only, not touchable
			pointerEvents: "none",
		},
		iconButton: {
			width: 42,
			height: 42,
			borderRadius: 21,
			backgroundColor: "rgba(0, 0, 0, 0.3)",
			justifyContent: "center",
			alignItems: "center",
			marginHorizontal: 12,
			padding: 8,
		},
		profileInfo: {
			padding: 16,
			alignItems: "center", // Center the profile info
		},
		avatarContainer: {
			position: "absolute",
			top: -45, // Half of avatar height to overlap the cover photo
			alignSelf: "center", // Center the avatar
			width: 90, // Slightly larger than avatar for padding
			height: 90, // Keep it square
			borderRadius: 45, // Half of width for perfect circle
			backgroundColor: colors.background, // Solid background matching page
			// Drop shadow for container
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 3 },
			shadowOpacity: 0.25,
			shadowRadius: 6,
			// Center the avatar inside
			alignItems: "center",
			justifyContent: "center",
			// Add a subtle ring/glow effect with border
			borderWidth: 1,
			borderColor: isDarkMode
				? "rgba(255,255,255,0.15)" // Light border in dark mode
				: "rgba(0,0,0,0.05)", // Dark border in light mode
		},
		avatar: {
			width: 80, // Slightly smaller than container
			height: 80,
			borderRadius: 40, // Half of width for perfect circle
			borderWidth: isDarkMode ? 1 : 0, // Thin inner border in dark mode for definition
			borderColor: "rgba(255,255,255,0.2)", // Subtle white border
		},
		avatarSmall: {
			width: 40,
			height: 40,
			borderRadius: 20,
			borderWidth: isDarkMode ? 1 : 0, // Thin inner border in dark mode for definition
			borderColor: "rgba(255,255,255,0.2)", // Subtle white border
		},
		defaultAvatar: {
			width: 80,
			height: 80,
			borderRadius: 40,
			backgroundColor: colors.tint,
			justifyContent: "center",
			alignItems: "center",
		},
		defaultAvatarText: {
			color: "white",
			fontSize: 32,
			fontWeight: "bold",
		},
		nameContainer: {
			marginTop: 48, // Space for the avatar
			alignItems: "center", // Center name and bio
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
			color: colors.text,
		},
		username: {
			fontSize: 14,
			color: colors.textSecondary,
			marginTop: 2,
		},
		verifiedBadge: {
			marginLeft: 4,
			marginTop: 2,
		},
		biosContainer: {
			marginTop: 12,
			alignItems: "center", // Center the bio text
		},
		bio: {
			fontSize: 14,
			lineHeight: 20,
			color: colors.text,
			textAlign: "center", // Center align the bio text
		},
		voiceBioButton: {
			height: 32,
			borderRadius: 16,
			backgroundColor: `${colors.tint}20`,
			marginTop: 12,
			paddingHorizontal: 8,
			flexDirection: "row",
			alignItems: "center",
			width: "auto", // Auto width instead of fixed width
			minWidth: 120, // Minimum width for the button
		},
		voiceBioButtonPlaying: {
			backgroundColor: `${colors.tint}30`,
		},
		voiceBioContent: {
			flex: 1,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			paddingRight: 8,
		},
		iconWrapper: {
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: colors.tint,
			justifyContent: "center",
			alignItems: "center",
		},
		playIcon: {
			color: "white",
		},
		voiceBioContainer: {
			flex: 1,
			flexDirection: "row",
			alignItems: "center",
			paddingLeft: 8,
			paddingRight: 8, // Add right padding to match left padding
		},
		voiceBioDuration: {
			fontSize: 12,
			color: colors.textSecondary,
			marginLeft: 8,
			marginRight: 8, // Add right margin to match left margin for perfect symmetry
		},
		progressContainer: {
			flex: 1,
			flexDirection: "row",
			height: 4,
			marginLeft: 8,
			marginRight: 8,
			alignItems: "center",
		},
		progressBackground: {
			flex: 1,
			height: 4,
			backgroundColor: `${colors.tint}30`,
			borderRadius: 2,
		},
		progressBar: {
			height: 4,
			backgroundColor: colors.tint,
			borderRadius: 2,
		},
		collapseButton: {
			width: 24,
			height: 24,
			justifyContent: "center",
			alignItems: "center",
		},
		stats: {
			flexDirection: "row",
			justifyContent: "space-around",
			paddingVertical: 16,
			borderTopWidth: 1,
			borderTopColor: colors.border,
		},
		statItem: {
			alignItems: "center",
		},
		statNumber: {
			fontSize: 16,
			fontWeight: "bold",
			color: colors.text,
		},
		statLabel: {
			fontSize: 12,
			color: colors.textSecondary,
		},
		statDivider: {
			width: 1,
			height: "60%",
			alignSelf: "center",
			backgroundColor: colors.border,
		},
		collapsedContainer: {
			borderBottomWidth: 1,
			borderBottomColor: colors.border,
			flexDirection: "row",
			padding: 16,
			alignItems: "center",
			justifyContent: "space-between",
			// Add shadow for depth without solid background
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: isDarkMode ? 0.3 : 0.1,
			shadowRadius: 3,
			elevation: 3,
			zIndex: 100, // Ensure it stays above content
		},
		collapsedContent: {
			flexDirection: "row",
			alignItems: "center",
			flex: 1,
			justifyContent: "center", // Center the content
			transform: [{ translateX: -8 }], // Small adjustment for visual balance
		},
		collapsedInfo: {
			marginLeft: 12,
			alignItems: "flex-start", // Keep text left-aligned within its container
		},
		avatarSmallContainer: {
			width: 44, // Slightly larger than the avatar
			height: 44,
			borderRadius: 22,
			backgroundColor: colors.background,
			alignItems: "center",
			justifyContent: "center",
			// Subtle shadow
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.1,
			shadowRadius: 2,
			elevation: 2,
			// Subtle ring effect with border
			borderWidth: 1,
			borderColor: isDarkMode
				? "rgba(255,255,255,0.15)" // Light border in dark mode
				: "rgba(0,0,0,0.05)", // Dark border in light mode
		},
		collapsedRightSpace: {
			width: 32, // Match the width of the back button
		},
		collapsedNameRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
		},
		collapsedName: {
			fontSize: 16,
			fontWeight: "600",
			marginRight: 4,
			color: colors.text,
		},
		collapsedUsername: {
			fontSize: 14,
			color: colors.textSecondary,
		},
		collapsedPostCount: {
			fontSize: 14,
			color: colors.textSecondary,
		},

		noVoiceBioText: {
			fontSize: 12,
			color: colors.textSecondary,
			marginLeft: 8,
		},
	});

	if (isCollapsed) {
		return (
			<BlurView
				intensity={80}
				tint={isDarkMode ? "dark" : "light"}
				style={[
					styles.collapsedContainer,
					{
						backgroundColor: isDarkMode
							? "rgba(20, 20, 20, 0.7)"
							: "rgba(255, 255, 255, 0.7)",
						borderBottomColor: isDarkMode
							? "rgba(255, 255, 255, 0.1)"
							: "rgba(0, 0, 0, 0.1)",
					},
				]}
			>
				<TouchableOpacity
					onPress={() => router.back()}
					style={[styles.iconButton, { backgroundColor: "transparent" }]}
				>
					<Feather name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>

				{/* Scroll-to-top area - everything except the back button */}
				<TouchableOpacity
					onPress={onHeaderPress}
					activeOpacity={0.7}
					style={styles.collapsedContent}
				>
					<View style={styles.avatarSmallContainer}>
						{localAvatarUrl ? (
							<Image
								source={{ uri: localAvatarUrl }}
								style={styles.avatarSmall}
								resizeMode="cover"
							/>
						) : (
							<DefaultAvatar userId={userId} size={40} />
						)}
					</View>
					<View style={styles.collapsedInfo}>
						<View style={styles.collapsedNameRow}>
							<Text style={styles.collapsedName}>{displayName}</Text>
							{isVerified && (
								<MaterialIcons
									name="verified"
									size={16}
									color={colors.tint}
									style={styles.verifiedBadge}
								/>
							)}
						</View>
						<Text style={styles.collapsedUsername}>@{username}</Text>
					</View>
				</TouchableOpacity>

				{/* Right space to balance the layout */}
				<View style={styles.collapsedRightSpace} />
			</BlurView>
		);
	}

	return (
		<View style={styles.container}>
			{/* Cover photo - clickable for photo viewer */}
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => handlePhotoPress("cover")}
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
				{/* Avatar - using pointerEvents: "box-none" to allow touches to pass through the container but still make the avatar touchable */}
				<View style={[styles.avatarContainer, { pointerEvents: "box-none" }]}>
					<TouchableOpacity
						onPress={() => handlePhotoPress("profile")}
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
							<Text style={styles.name}>{displayName}</Text>
							{isVerified && (
								<MaterialIcons
									name="verified"
									size={16}
									color={colors.tint}
									style={styles.verifiedBadge}
								/>
							)}
						</View>
						<Text style={styles.username}>@{username}</Text>
					</View>

					{/* Bio text */}
					{bio && (
						<View style={styles.biosContainer}>
							<Text style={styles.bio}>{bio}</Text>
						</View>
					)}

					{/* Voice bio button - fixed width */}
					{loadingVoiceBio ? (
						<View style={styles.voiceBioButton}>
							<View style={styles.voiceBioContainer}>
								<ActivityIndicator size="small" color={colors.tint} />
								<Text style={styles.noVoiceBioText}>Loading...</Text>
							</View>
						</View>
					) : voiceBio ? (
						<Animated.View
							style={[
								styles.voiceBioButton,
								isVoiceBioPlaying && styles.voiceBioButtonPlaying,
								isExpanded ? { width: 200 } : { width: "auto" },
							]}
						>
							{isExpanded ? (
								<>
									<View style={styles.voiceBioContent}>
										<TouchableOpacity
											onPress={() => {
												setIsVoiceBioPlaying(!isVoiceBioPlaying);

												if (!isVoiceBioPlaying) {
													// Audio is not playing, start it
													if (audioRef.current) {
														audioRef.current.play();
													}
												} else {
													// Audio is playing, pause it
													if (audioRef.current) {
														audioRef.current.pause();
													}
												}
											}}
										>
											<View style={styles.iconWrapper}>
												<Feather
													name={isVoiceBioPlaying ? "pause" : "play"}
													size={14}
													style={styles.playIcon}
												/>
											</View>
										</TouchableOpacity>

										<TouchableWithoutFeedback onPress={handleSeek}>
											<View
												style={styles.progressContainer}
												ref={progressContainerRef}
											>
												<View style={styles.progressBackground} />
												<View
													style={[
														styles.progressBar,
														{ width: `${progress * 100}%` },
													]}
												/>
											</View>
										</TouchableWithoutFeedback>

										<TouchableOpacity
											onPress={handleVoiceBioCollapse}
											style={styles.collapseButton}
										>
											<Feather
												name="chevron-left"
												size={18}
												color={colors.tint}
											/>
										</TouchableOpacity>
									</View>
									{Platform.OS === "web" && voiceBio && (
										// @ts-ignore
										<audio
											ref={audioRef}
											src={voiceBio.audio_url}
											onTimeUpdate={() => {
												if (audioRef.current && !isSeeking) {
													const currentTime = audioRef.current.currentTime;
													const duration = audioRef.current.duration;
													setProgress(currentTime / duration);
												}
											}}
											onEnded={handleVoiceBioCollapse}
											style={{ display: "none" }}
										/>
									)}
								</>
							) : (
								<TouchableOpacity
									style={styles.voiceBioContainer}
									onPress={() => {
										setIsExpanded(true);
									}}
								>
									<View style={styles.iconWrapper}>
										<Feather
											name="headphones"
											size={14}
											style={styles.playIcon}
										/>
									</View>
									<Text style={styles.voiceBioDuration}>
										{formatDuration(voiceBio.duration)}
									</Text>
								</TouchableOpacity>
							)}
						</Animated.View>
					) : !loadingVoiceBio && isOwnProfile ? (
						<TouchableOpacity
							style={styles.voiceBioButton}
							onPress={() => router.push("/profile/voice-bio")}
						>
							<View style={styles.voiceBioContainer}>
								<Feather name="mic" size={14} color={colors.tint} />
								<Text style={styles.voiceBioDuration}>Record voice bio</Text>
							</View>
						</TouchableOpacity>
					) : null}
				</View>
			</View>

			{/* Enhanced Photo Viewer Modal */}
			<PhotoViewerModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				photoType={activePhoto}
				imageUrl={
					activePhoto === "profile" ? localAvatarUrl : localCoverPhotoUrl
				}
				userId={userId}
				isOwnProfile={isOwnProfile}
				onPhotoUpdated={handlePhotoUpdated}
			/>
		</View>
	);
}
