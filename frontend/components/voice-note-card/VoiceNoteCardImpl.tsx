import React, { useState, useCallback, useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ImageBackground,
	Animated,
	Alert,
	GestureResponderEvent,
	Platform,
	Share,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { CommentPopup } from "../comments/CommentPopup";
import {
	recordShare,
	likeVoiceNote,
	unlikeVoiceNote,
	getComments,
	checkLikeStatus,
	checkShareStatus,
	getShareCount,
	getVoiceNoteStats,
} from "../../services/api/voiceNoteService";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import Colors from "../../constants/Colors";

// Import types
import {
	VoiceNoteCardProps,
	Comment,
	CommentsResponse,
} from "./VoiceNoteCardTypes"; // Path becomes ./

// Import helper functions
import { formatDuration, normalizePlaysCount } from "./VoiceNoteCardUtils"; // Path becomes ./

// Import styles
import { getStyles } from "./VoiceNoteCardStyles"; // Path becomes ./

// Import sub-components
import { VoiceNoteProfilePicture } from "./VoiceNoteProfilePicture"; // Path becomes ./
import { VoiceNoteProgressBar } from "./VoiceNoteProgressBar"; // Path becomes ./
import { VoiceNoteInteractions } from "./VoiceNoteInteractions"; // Path becomes ./
import { VoiceNoteUserInfo } from "./VoiceNoteUserInfo"; // Path becomes ./
import { VoiceNoteTags } from "./VoiceNoteTags"; // Path becomes ./

export function VoiceNoteCardImpl({
	voiceNote,
	userId,
	displayName,
	username,
	userAvatarUrl,
	timePosted,
	onPlay,
	onPlayPress,
	onProfilePress,
	onUserProfilePress,
	onShare,
	currentUserId,
	isShared: isSharedProp,
	sharedBy,
	showRepostAttribution,
	voiceNoteUsers,
}: VoiceNoteCardProps) {
	const router = useRouter();
	const { user } = useUser();
	const { colors, isDarkMode } = useTheme();
	const progressContainerRef = useRef<View>(null);

	// Check if this voice note has a background image
	const hasBackgroundImage = !!voiceNote.backgroundImage;

	// For voice notes with background images, always use light mode colors
	// This ensures consistent appearance in both light and dark mode
	const effectiveColors = hasBackgroundImage ? Colors.light : colors;
	const effectiveIsDarkMode = hasBackgroundImage ? false : isDarkMode;

	// Get styles based on effective theme and background image presence
	const styles = getStyles(
		effectiveColors,
		effectiveIsDarkMode,
		hasBackgroundImage
	);

	// Combine username sources with fallbacks
	const effectiveUsername = username || voiceNoteUsers?.username || "user";
	const effectiveDisplayName =
		displayName || voiceNoteUsers?.display_name || "User";
	const effectiveAvatarUrl =
		userAvatarUrl || voiceNoteUsers?.avatar_url || null;

	// Handle duplicate isShared identifier by using the prop value or defaulting to the state
	const [internalIsShared, setInternalIsShared] = useState<boolean>(
		isSharedProp !== undefined ? isSharedProp : false
	);

	// Use the prop if provided, otherwise use the state
	const isSharedEffective =
		isSharedProp !== undefined ? isSharedProp : internalIsShared;

	// State management
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(
		typeof voiceNote.likes === "number" && voiceNote.likes > 0
			? voiceNote.likes
			: 0
	);
	const [sharesCount, setSharesCount] = useState(
		typeof voiceNote.shares === "number" && voiceNote.shares > 0
			? voiceNote.shares
			: 0
	);
	const [isLoadingShareCount, setIsLoadingShareCount] = useState(false);
	const [showCommentPopup, setShowCommentPopup] = useState(false);
	const [commentsCount, setCommentsCount] = useState(
		typeof voiceNote.comments === "number" && voiceNote.comments > 0
			? voiceNote.comments
			: 0
	);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);
	const [playsCount, setPlaysCount] = useState(
		normalizePlaysCount(voiceNote.plays || 0)
	);
	const [statsLoaded, setStatsLoaded] = useState(false);

	// Animation refs
	const likeScale = useRef(new Animated.Value(1)).current;
	const shareScale = useRef(new Animated.Value(1)).current;

	// Get user ID from context or props
	const loggedInUserId = user?.id || currentUserId;

	// Theme-specific colors for repost attribution
	const repostAttributionBackgroundColor = hasBackgroundImage
		? "rgba(0, 0, 0, 0.7)" // Darker background for image voice notes
		: effectiveIsDarkMode
		? "rgba(30, 30, 30, 0.8)" // Darker, more opaque background for dark mode
		: "rgba(245, 245, 245, 0.8)"; // Lighter background for light mode
	const repostAttributionTextColor = hasBackgroundImage
		? "rgba(255, 255, 255, 0.95)" // Brighter text for image backgrounds
		: effectiveIsDarkMode
		? "rgba(220, 220, 220, 0.9)" // Light gray text for dark mode
		: effectiveColors.text; // Default text color for light mode

	// Fetch the actual share count
	const fetchShareCount = useCallback(async () => {
		if (!voiceNote.id) return;

		try {
			setIsLoadingShareCount(true);
			const count = await getShareCount(voiceNote.id);
			setSharesCount(typeof count === "number" ? count : 0);
		} catch (error) {
			console.error("Error fetching share count:", error);
		} finally {
			setIsLoadingShareCount(false);
		}
	}, [voiceNote.id]);

	// Fetch comments when needed
	const fetchComments = useCallback(async () => {
		if (!voiceNote.id) return;

		setIsLoadingComments(true);
		try {
			const response = (await getComments(
				voiceNote.id
			)) as unknown as CommentsResponse; // Cast to unknown first, then to CommentsResponse
			if (response && response.data) {
				setComments(response.data || []);
				setCommentsCount(response.data?.length || 0);
			}
		} catch (error) {
			console.error("Error fetching comments:", error);
		} finally {
			setIsLoadingComments(false);
		}
	}, [voiceNote.id]);

	// Handle profile press
	const handleProfilePress = useCallback(() => {
		if (onUserProfilePress) {
			onUserProfilePress();
		} else if (onProfilePress) {
			onProfilePress();
		} else if (effectiveUsername && effectiveUsername !== "user") {
			router.push({
				pathname: "/profile/[username]",
				params: { username: effectiveUsername },
			});
		}
	}, [router, effectiveUsername, onProfilePress, onUserProfilePress]);

	// Handle like button press
	const handleLikePress = useCallback(() => {
		if (!loggedInUserId) {
			Alert.alert("Sign In Required", "Please sign in to like voice notes.");
			return;
		}

		setIsLiked((prevState) => {
			const newLikeState = !prevState;
			setLikesCount((prevCount) =>
				newLikeState ? prevCount + 1 : Math.max(0, prevCount - 1)
			);

			if (newLikeState) {
				likeVoiceNote(voiceNote.id, loggedInUserId).catch((error) => {
					console.error("Error liking voice note:", error);
					setIsLiked(false);
					setLikesCount((prevCount) => Math.max(0, prevCount - 1));
				});
			} else {
				unlikeVoiceNote(voiceNote.id, loggedInUserId).catch((error) => {
					console.error("Error unliking voice note:", error);
					setIsLiked(true);
					setLikesCount((prevCount) => prevCount + 1);
				});
			}

			Animated.sequence([
				Animated.timing(likeScale, {
					toValue: 1.2,
					duration: 100,
					useNativeDriver: true,
				}),
				Animated.timing(likeScale, {
					toValue: 1,
					duration: 100,
					useNativeDriver: true,
				}),
			]).start();

			return newLikeState;
		});
	}, [likeScale, voiceNote.id, loggedInUserId]);

	// Handle comment button press
	const handleCommentPress = useCallback(() => {
		if (!loggedInUserId) {
			Alert.alert(
				"Sign In Required",
				"Please sign in to comment on voice notes."
			);
			return;
		}
		fetchComments();
		setShowCommentPopup(true);
	}, [fetchComments, loggedInUserId]);

	// Handle comment added
	const handleCommentAdded = useCallback(
		(newComment: Comment | string) => {
			if (!loggedInUserId || !voiceNote.id) return;
			setComments((prevComments) => [newComment as Comment, ...prevComments]);
			setCommentsCount((prevCount) => prevCount + 1);
		},
		[voiceNote.id, loggedInUserId]
	);

	// Handle close comment popup
	const handleCloseCommentPopup = useCallback(() => {
		setShowCommentPopup(false);
		if (voiceNote.id) {
			getVoiceNoteStats(voiceNote.id)
				.then((stats) => {
					if (stats && typeof stats.comments === "number") {
						setCommentsCount(stats.comments);
					}
				})
				.catch((error) => {
					console.error("Error fetching voice note stats:", error);
				});
		}
	}, [voiceNote.id]);

	// Handle plays button press
	const handlePlaysPress = useCallback(() => {
		console.log("Plays button pressed");
	}, []);

	// Handle repost (share) button press
	const handleRepostPress = useCallback(() => {
		if (!loggedInUserId) {
			Alert.alert("Sign In Required", "Please sign in to repost voice notes.");
			return;
		}

		if (isLoadingShareCount) return;

		setIsLoadingShareCount(true);
		recordShare(voiceNote.id, loggedInUserId)
			.then((response: any) => {
				if (response.error) return;

				if (response?.shareCount) {
					setSharesCount(response.shareCount);
				} else {
					fetchShareCount();
				}

				if (typeof response?.isShared === "boolean") {
					setInternalIsShared(response.isShared);
				} else {
					setInternalIsShared((prev) => !prev);
				}

				Animated.sequence([
					Animated.timing(shareScale, {
						toValue: 1.2,
						duration: 100,
						useNativeDriver: true,
					}),
					Animated.timing(shareScale, {
						toValue: 1,
						duration: 100,
						useNativeDriver: true,
					}),
				]).start();
			})
			.catch((error) => {
				console.error("Error toggling share:", error);
			})
			.finally(() => {
				setIsLoadingShareCount(false);
			});
	}, [
		voiceNote.id,
		loggedInUserId,
		isLoadingShareCount,
		fetchShareCount,
		shareScale,
	]);

	// Handle native share button long press
	const handleShareCountLongPress = useCallback(() => {
		if (Platform.OS !== "web") {
			Share.share({
				message: `Check out this voice note: ${voiceNote.title}`,
				url: `https://ripply.app/voice-note/${voiceNote.id}`,
				title: "Share Voice Note",
			});
		}
	}, [voiceNote.id, voiceNote.title]);

	// Handle play button press
	const handlePlayPress = useCallback(() => {
		if (onPlayPress) {
			onPlayPress();
		} else if (onPlay) {
			onPlay();
		} else {
			setIsPlaying((prev) => !prev);
		}
	}, [onPlay, onPlayPress]);

	// Handle progress bar interactions
	const handleProgressBarPress = useCallback((event: GestureResponderEvent) => {
		if (progressContainerRef.current) {
			progressContainerRef.current.measure(
				(x, y, width, height, pageX, pageY) => {
					const touchX = event.nativeEvent.pageX - pageX;
					const newProgress = Math.max(0, Math.min(1, touchX / width));
					setProgress(newProgress);
				}
			);
		}
	}, []);

	const handleProgressBarDrag = useCallback(
		(event: GestureResponderEvent) => {
			setIsSeeking(true);
			handleProgressBarPress(event);
		},
		[handleProgressBarPress]
	);

	const handleProgressBarRelease = useCallback(() => {
		setIsSeeking(false);
	}, []);

	// Handle tag press
	const handleTagPress = (tag: string) => {
		router.push({
			pathname: "/search",
			params: { q: tag },
		});
	};

	// Load initial data on mount
	useEffect(() => {
		if (!voiceNote.id || !loggedInUserId || statsLoaded) return;

		const loadInitialData = async () => {
			// Check like status
			try {
				const likeStatus = await checkLikeStatus(voiceNote.id, loggedInUserId);
				setIsLiked(likeStatus);
			} catch (error) {
				console.error("Error checking like status:", error);
			}

			// Check share status
			try {
				const shareStatus = await checkShareStatus(
					voiceNote.id,
					loggedInUserId
				);
				setInternalIsShared(shareStatus);
			} catch (error) {
				console.error("Error checking share status:", error);
			}

			// Fetch share count
			fetchShareCount();
			setStatsLoaded(true);
		};

		loadInitialData();
	}, [voiceNote.id, loggedInUserId, fetchShareCount, statsLoaded]);

	// Determine text style based on background image
	const titleStyle = hasBackgroundImage ? styles.titleOnImage : styles.title;

	// Repost attribution component
	const RepostAttribution = () => {
		if (!showRepostAttribution || !isSharedEffective || !sharedBy) {
			return null;
		}

		return (
			<View
				style={[
					styles.repostAttributionContainer,
					hasBackgroundImage && styles.repostAttributionContainerOnImage,
					{ backgroundColor: repostAttributionBackgroundColor },
				]}
			>
				<Feather
					name="repeat"
					size={14}
					color={hasBackgroundImage ? "#FFFFFF" : effectiveColors.tint}
					style={{ marginRight: 6 }}
				/>
				<Text
					style={[
						hasBackgroundImage
							? styles.repostAttributionTextOnImage
							: styles.repostAttributionText,
						{ color: repostAttributionTextColor },
					]}
				>
					Reposted by{" "}
					<Text
						style={[
							hasBackgroundImage
								? styles.repostAttributionUsernameOnImage
								: styles.repostAttributionUsername,
							{
								color: hasBackgroundImage ? "#FFFFFF" : effectiveColors.tint,
								fontWeight: hasBackgroundImage ? "800" : "700",
							},
						]}
						onPress={() => {
							if (sharedBy.username) {
								router.push({
									pathname: "/profile/[username]",
									params: { username: sharedBy.username },
								});
							}
						}}
					>
						@{sharedBy.username || "user"}
					</Text>
				</Text>
			</View>
		);
	};

	// Card Content Component
	const CardContent = () => (
		<View style={styles.content}>
			{/* User info header */}
			{(userId || displayName) && (
				<VoiceNoteUserInfo
					styles={styles}
					userId={userId || "user"}
					displayName={effectiveDisplayName}
					username={effectiveUsername}
					avatarUrl={effectiveAvatarUrl}
					timePosted={timePosted}
					hasBackgroundImage={hasBackgroundImage}
					onProfilePress={handleProfilePress}
					colors={effectiveColors}
				/>
			)}

			{/* Title */}
			<Text style={titleStyle}>{voiceNote.title}</Text>

			{/* Player controls */}
			<View style={styles.playerContainer}>
				<TouchableOpacity
					onPress={handlePlayPress}
					style={[
						styles.playButton,
						hasBackgroundImage && styles.playButtonOnImage,
					]}
					activeOpacity={0.7}
				>
					<MaterialIcons
						name={isPlaying ? "pause" : "play-arrow"}
						size={24}
						color={
							hasBackgroundImage
								? effectiveColors.text
								: effectiveColors.background
						}
					/>
				</TouchableOpacity>

				{/* Progress bar */}
				<VoiceNoteProgressBar
					progress={progress}
					colors={effectiveColors}
					isDarkMode={effectiveIsDarkMode}
					hasBackgroundImage={hasBackgroundImage}
					onProgressBarPress={handleProgressBarPress}
					onProgressBarDrag={handleProgressBarDrag}
					onProgressBarRelease={handleProgressBarRelease}
					progressContainerRef={progressContainerRef}
				/>

				{/* Duration */}
				<Text
					style={hasBackgroundImage ? styles.durationOnImage : styles.duration}
				>
					{formatDuration(voiceNote.duration)}
				</Text>
			</View>

			{/* Tags */}
			<VoiceNoteTags
				styles={styles}
				tags={voiceNote.tags || []}
				hasBackgroundImage={hasBackgroundImage}
				onTagPress={handleTagPress}
				colors={effectiveColors}
			/>

			{/* Interaction buttons */}
			<VoiceNoteInteractions
				styles={styles}
				colors={effectiveColors}
				hasBackgroundImage={hasBackgroundImage}
				isLiked={isLiked}
				likeScale={likeScale}
				likesCount={likesCount}
				commentsCount={commentsCount}
				playsCount={playsCount}
				isShared={isSharedEffective}
				shareScale={shareScale}
				sharesCount={sharesCount}
				isLoadingShareCount={isLoadingShareCount}
				handleLikePress={handleLikePress}
				handleCommentPress={handleCommentPress}
				handlePlaysPress={handlePlaysPress}
				handleRepostPress={handleRepostPress}
				handleShareCountLongPress={handleShareCountLongPress}
			/>
		</View>
	);

	return (
		<>
			<View style={styles.cardOuterContainer}>
				{hasBackgroundImage ? (
					<ImageBackground
						source={{ uri: voiceNote.backgroundImage as string }}
						style={styles.container}
						imageStyle={{ borderRadius: 16 }}
						blurRadius={3}
					>
						<View style={styles.overlay} />
						<RepostAttribution />
						<CardContent />
					</ImageBackground>
				) : (
					<View style={[styles.container, styles.plainContainer]}>
						<RepostAttribution />
						<CardContent />
					</View>
				)}
			</View>

			{/* Comment Popup */}
			<CommentPopup
				visible={showCommentPopup}
				voiceNoteId={voiceNote.id}
				currentUserId={loggedInUserId}
				onClose={handleCloseCommentPopup}
				onCommentAdded={handleCommentAdded}
			/>
		</>
	);
}
