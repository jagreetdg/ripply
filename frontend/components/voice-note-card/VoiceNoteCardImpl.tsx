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
	StyleSheet,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { CommentPopup } from "../comments/CommentPopup";
import {
	likeVoiceNote,
	unlikeVoiceNote,
	getComments,
	checkLikeStatus,
	getVoiceNoteStats,
	recordPlay,
} from "../../services/api/voiceNoteService";
import {
	hasUserRepostedVoiceNote,
	toggleRepost,
	getRepostCount,
} from "../../services/api/repostService";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import Colors, { hexToRgba, opacityValues } from "../../constants/Colors";

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
	onShareStatusChanged,
	onVoiceNoteUnshared,
	currentUserId,
	isReposted: isRepostedProp,
	isLoadingRepostStatus = false,
	sharedBy,
	showRepostAttribution,
	voiceNoteUsers,
}: VoiceNoteCardProps) {
	const router = useRouter();
	const { user } = useUser();
	const { colors, isDarkMode } = useTheme();
	const progressContainerRef = useRef<View>(null);

	// Get user ID from context or props
	const loggedInUserId = user?.id || currentUserId;

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

	// Determine overlay intensity based on theme
	const overlayIntensity = isDarkMode
		? opacityValues.heavy
		: opacityValues.semitransparent;

	// Combine username sources with fallbacks
	const effectiveUsername = username || voiceNoteUsers?.username || "user";
	const effectiveDisplayName =
		displayName || voiceNoteUsers?.display_name || "User";
	const effectiveAvatarUrl =
		userAvatarUrl || voiceNoteUsers?.avatar_url || null;

	// State for repost status - use the prop if available, otherwise track locally
	const [internalRepostedState, setInternalRepostedState] = useState<boolean>(
		isRepostedProp !== undefined ? Boolean(isRepostedProp) : false
	);

	// Determine effective repost status (prop takes precedence)
	const isRepostedEffective = isLoadingRepostStatus
		? false // Don't show as reposted while loading
		: Boolean(
				isRepostedProp !== undefined ? isRepostedProp : internalRepostedState
		  );

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

	// Theme-specific colors for repost attribution
	const repostAttributionBackgroundColor = hasBackgroundImage
		? hexToRgba(colors.black, opacityValues.heavy) // Darker background for image voice notes
		: effectiveIsDarkMode
		? hexToRgba(colors.black, opacityValues.nearsolid) // Darker, more opaque background for dark mode
		: hexToRgba(colors.lightGrey, opacityValues.nearsolid); // Lighter background for light mode
	const repostAttributionTextColor = hasBackgroundImage
		? colors.white // Brighter text for image backgrounds
		: effectiveIsDarkMode
		? hexToRgba(colors.white, opacityValues.solid) // Light gray text for dark mode
		: effectiveColors.text; // Default text color for light mode

	// Read isLoadingStats from the voiceNote or default to false
	const isLoadingStats =
		voiceNote.isLoadingStats !== undefined ? voiceNote.isLoadingStats : false;

	// Fetch the actual share count
	const fetchShareCount = useCallback(async () => {
		if (!voiceNote.id) return;

		try {
			setIsLoadingShareCount(true);
			const count = await getRepostCount(voiceNote.id);
			setSharesCount(typeof count === "number" ? count : 0);
		} catch (error) {
			console.error("Error fetching repost count:", error);
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

	// Update internal state when the prop changes
	useEffect(() => {
		if (
			isRepostedProp !== undefined &&
			internalRepostedState !== isRepostedProp
		) {
			setInternalRepostedState(isRepostedProp);
		}
	}, [isRepostedProp]);

	// Handle repost button press using our new repost service
	const handleRepostPress = useCallback(() => {
		if (!loggedInUserId) {
			Alert.alert("Sign In Required", "Please sign in to repost voice notes.");
			return;
		}

		if (isLoadingShareCount) {
			return;
		}

		setIsLoadingShareCount(true);
		console.log(`Reposting voice note ${voiceNote.id}`);

		toggleRepost(voiceNote.id, loggedInUserId)
			.then((response) => {
				// Update share count and internal state based on response
				if (typeof response.repostCount === "number") {
					setSharesCount(response.repostCount);
				} else {
					// Fallback to fetching the count
					fetchShareCount();
				}

				// Update repost state
				const wasReposted = internalRepostedState;
				const isNowReposted = response.isReposted;

				console.log(
					`Repost status changed from ${wasReposted} to ${isNowReposted}`
				);
				setInternalRepostedState(isNowReposted);

				// Call callback with the new status
				if (onShareStatusChanged) {
					onShareStatusChanged(voiceNote.id, isNowReposted);
				}

				// Call unshared callback if the note was unreposted
				if (wasReposted && !isNowReposted && onVoiceNoteUnshared) {
					console.log(`Calling onVoiceNoteUnshared for ${voiceNote.id}`);
					onVoiceNoteUnshared(voiceNote.id);
				}

				// Animate the repost button
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
				console.error("Error toggling repost:", error);
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
		onVoiceNoteUnshared,
		onShareStatusChanged,
		internalRepostedState,
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
		console.log(`Tag clicked: ${tag}`);
		router.push({
			pathname: "/(tabs)/search",
			params: {
				tag: tag,
				searchType: "tag",
				timestamp: Date.now(), // Add timestamp to ensure route refresh
			},
		});
	};

	// Load initial data on mount
	useEffect(() => {
		if (!voiceNote.id || !loggedInUserId || statsLoaded) {
			return;
		}

		const loadInitialData = async () => {
			// Check like status
			try {
				const likeStatus = await checkLikeStatus(voiceNote.id, loggedInUserId);
				setIsLiked(likeStatus);
			} catch (error) {
				console.error("Error checking like status:", error);
			}

			// Check repost status
			try {
				const repostStatus = await hasUserRepostedVoiceNote(
					voiceNote.id,
					loggedInUserId
				);
				setInternalRepostedState(repostStatus);
			} catch (error) {
				console.error("Error checking repost status:", error);
				setInternalRepostedState(false);
			}

			// Fetch share count
			fetchShareCount();
			setStatsLoaded(true);
		};

		loadInitialData();
	}, [voiceNote.id, loggedInUserId, fetchShareCount, statsLoaded]);

	// Add a new effect to fetch stats on component mount
	useEffect(() => {
		// Only fetch stats if we have a valid voice note ID
		if (!voiceNote.id) return;

		const fetchStats = async () => {
			try {
				const stats = await getVoiceNoteStats(voiceNote.id);
				console.log(`VoiceNoteCard: Fetched stats for ${voiceNote.id}:`, stats);

				// Update all the stats
				setLikesCount(stats.likes);
				setCommentsCount(stats.comments);
				setPlaysCount(normalizePlaysCount(stats.plays));
				setSharesCount(stats.shares);
			} catch (error) {
				console.error(
					`Error fetching stats for voice note ${voiceNote.id}:`,
					error
				);
			}
		};

		fetchStats();
	}, [voiceNote.id]); // Re-run when the voice note ID changes

	// Determine text style based on background image
	const titleStyle = hasBackgroundImage ? styles.titleOnImage : styles.title;

	// Repost attribution component - refactored for clarity
	const RepostAttribution = () => {
		// Only show repost attribution if explicitly requested, there's a reposter, and showRepostAttribution is true
		if (!showRepostAttribution || !sharedBy) {
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
				isReposted={isRepostedEffective}
				shareScale={shareScale}
				sharesCount={sharesCount}
				isLoadingShareCount={isLoadingShareCount}
				isLoadingStats={isLoadingStats}
				handleLikePress={handleLikePress}
				handleCommentPress={handleCommentPress}
				handlePlaysPress={handlePlaysPress}
				handleRepostPress={handleRepostPress}
				handleShareCountLongPress={handleShareCountLongPress}
				isLoadingRepostStatus={isLoadingRepostStatus}
			/>
		</View>
	);

	// Render the card (basic structure, regardless of type)
	return (
		<View style={styles.cardOuterContainer}>
			{hasBackgroundImage ? (
				<ImageBackground
					source={{ uri: voiceNote.backgroundImage }}
					style={styles.container}
					imageStyle={{ borderRadius: 16 }}
					resizeMode="cover"
				>
					{/* Add blur effect for better text readability */}
					<BlurView
						intensity={8}
						tint={isDarkMode ? "dark" : "light"}
						style={{
							...StyleSheet.absoluteFillObject,
							borderRadius: 16, // Match container
						}}
					/>

					{/* Add overlay with adaptive intensity based on theme */}
					<View
						style={[
							styles.overlay,
							{ backgroundColor: hexToRgba(colors.black, overlayIntensity) },
						]}
					/>

					{/* Always render the repost attribution component and let it decide whether to show */}
					<RepostAttribution />
					<CardContent />
				</ImageBackground>
			) : (
				<View
					style={[
						styles.container,
						!hasBackgroundImage && styles.plainContainer,
					]}
				>
					{/* Always render the repost attribution component and let it decide whether to show */}
					<RepostAttribution />
					<CardContent />
				</View>
			)}

			{/* Comment Popup */}
			<CommentPopup
				visible={showCommentPopup}
				voiceNoteId={voiceNote.id}
				currentUserId={loggedInUserId}
				onClose={handleCloseCommentPopup}
				onCommentAdded={handleCommentAdded}
			/>
		</View>
	);
}
