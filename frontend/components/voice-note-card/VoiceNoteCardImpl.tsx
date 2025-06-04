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
import Colors, { hexToRgba, opacityValues } from "../../constants/Colors";
import { getApiUrl } from "../../services/api/config";

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

// Import debounce from lodash if available, or define a simple version
const debounce = (func: Function, wait: number) => {
	let timeout: NodeJS.Timeout;
	return function (...args: any[]) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

// Debug mode - set to false in production
const DEBUG_MODE = true;

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
			const count = await getShareCount(voiceNote.id, true); // Enable debug logging
			console.log(
				`Successfully fetched share count for ${voiceNote.id}: ${count}`
			);
			setSharesCount(typeof count === "number" ? count : 0);
		} catch (error) {
			console.error("Error fetching share count:", error);

			// Check if this is an authentication error
			if (
				error instanceof Error &&
				(error.message.includes("Authentication required") ||
					error.message.includes("Invalid token") ||
					error.message.includes("Token expired"))
			) {
				console.log("Authentication error when fetching share count");
				// Do not show alert here as it would be too disruptive for a background operation
			}
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

		if (isLoadingShareCount) {
			return;
		}

		console.log("Attempting to share/unshare voice note", {
			voiceNoteId: voiceNote.id,
			userId: loggedInUserId,
		});

		setIsLoadingShareCount(true);
		recordShare(voiceNote.id, loggedInUserId)
			.then((response: any) => {
				console.log("Share response:", response);

				if (response.error) {
					console.error("Share error response:", response.error);

					// Check if this is an auth error
					if (
						response.message === "Authentication required" ||
						response.message === "Invalid token"
					) {
						Alert.alert(
							"Authentication Error",
							"Please sign in again to share this voice note.",
							[{ text: "OK" }]
						);
						return;
					}

					// Enhanced error display for debugging Render backend
					let errorDetails = response.error;

					// If we have server details, add them to the error message
					if (response.serverDetails) {
						const serverMsg =
							response.serverDetails.error ||
							response.serverDetails.message ||
							"";
						errorDetails = `${errorDetails}\n\nServer details: ${serverMsg}`;

						if (response.serverDetails.code) {
							errorDetails += `\nCode: ${response.serverDetails.code}`;
						}
					}

					// If there's a status code, show it
					if (response.status) {
						errorDetails += `\n\nStatus: ${response.status}`;
					}

					// If we're in debug mode and there's a database table issue, offer to fix it
					if (
						DEBUG_MODE &&
						(response.message === "Database table missing" ||
							(response.serverDetails &&
								response.serverDetails.code === "TABLE_MISSING"))
					) {
						Alert.alert(
							"Share Error",
							`There was a problem with the database tables:\n\n${errorDetails}`,
							[
								{ text: "Cancel", style: "cancel" },
								{
									text: "Repair Database",
									onPress: () => attemptDatabaseRepair(response),
								},
							]
						);
					} else {
						Alert.alert(
							"Share Error",
							`There was a problem sharing this voice note:\n\n${errorDetails}`,
							[{ text: "OK" }]
						);
					}
					return;
				}

				if (response?.shareCount !== undefined) {
					setSharesCount(response.shareCount);
				} else {
					console.log("No shareCount in response, fetching fresh count");
					fetchShareCount();
				}

				if (typeof response?.isShared === "boolean") {
					setInternalIsShared(response.isShared);
				} else {
					console.log("No isShared in response, toggling current value");
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
				Alert.alert(
					"Share Error",
					"There was a problem sharing this voice note. Please try again.",
					[{ text: "OK" }]
				);
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

	// Debug function to attempt to repair the database issue
	const attemptDatabaseRepair = async (errorResponse: any) => {
		try {
			console.log("[RENDER DEBUG] Attempting to repair database issue");

			// Get the API base URL from the environment or a constant
			const API_URL = getApiUrl();

			// First check database health
			const healthResponse = await fetch(
				`${API_URL}/voice-notes/debug/db-health`
			);
			const healthData = await healthResponse.json();
			console.log("[RENDER DEBUG] Database health:", healthData);

			// If the voice_note_shares table doesn't exist, attempt to create it
			if (healthData?.tables?.voice_note_shares?.exists === false) {
				console.log(
					"[RENDER DEBUG] Attempting to create voice_note_shares table"
				);

				const fixResponse = await fetch(
					`${API_URL}/voice-notes/debug/fix-shares-table`,
					{
						method: "POST",
					}
				);

				const fixData = await fixResponse.json();
				console.log("[RENDER DEBUG] Fix response:", fixData);

				if (fixData.message === "Fix applied successfully") {
					Alert.alert(
						"Database Repaired",
						"The database issue has been fixed. Please try sharing again.",
						[{ text: "OK" }]
					);
					return;
				}
			}

			// If that didn't work, try running specific migrations
			console.log("[RENDER DEBUG] Attempting to run migrations");
			const migrations = [
				"create_migration_function",
				"create_voice_note_shares",
				"create_shares_function",
				"create_shares_view",
			];

			let success = false;

			for (const migration of migrations) {
				console.log(`[RENDER DEBUG] Running migration: ${migration}`);
				const migrationResponse = await fetch(
					`${API_URL}/voice-notes/debug/run-migration`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ migration }),
					}
				);

				const migrationData = await migrationResponse.json();
				console.log(
					`[RENDER DEBUG] Migration '${migration}' response:`,
					migrationData
				);

				if (migrationData.message === "Migration successful") {
					success = true;
				}
			}

			if (success) {
				Alert.alert(
					"Database Repaired",
					"The database tables have been created. Please try sharing again.",
					[{ text: "OK" }]
				);
			} else {
				Alert.alert(
					"Repair Failed",
					"Unable to repair the database issue. Please contact support.",
					[{ text: "OK" }]
				);
			}
		} catch (error) {
			console.error("[RENDER DEBUG] Error repairing database:", error);
			Alert.alert(
				"Repair Failed",
				"An error occurred while attempting to repair the database.",
				[{ text: "OK" }]
			);
		}
	};

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
				isLoadingStats={isLoadingStats}
				handleLikePress={handleLikePress}
				handleCommentPress={handleCommentPress}
				handlePlaysPress={handlePlaysPress}
				handleRepostPress={handleRepostPress}
				handleShareCountLongPress={handleShareCountLongPress}
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

					{isSharedEffective && showRepostAttribution ? (
						<RepostAttribution />
					) : null}
					<CardContent />
				</ImageBackground>
			) : (
				<View
					style={[
						styles.container,
						!hasBackgroundImage && styles.plainContainer,
					]}
				>
					{isSharedEffective && showRepostAttribution ? (
						<RepostAttribution />
					) : null}
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
