import React, { useState, useCallback, useRef, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ImageBackground,
	Pressable,
	Animated,
	Platform,
	Share,
	Alert,
	ScrollView,
} from "react-native";
import { Feather, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { CommentPopup } from "../comments/CommentPopup";
import {
	recordShare,
	likeVoiceNote,
	unlikeVoiceNote,
	addComment,
	getComments,
	checkLikeStatus,
	checkShareStatus,
	getShareCount,
	getVoiceNoteById,
	getVoiceNoteStats,
} from "../../services/api/voiceNoteService";
import DefaultAvatar from "../DefaultAvatar";
import { useUser } from "../../context/UserContext";

// Development mode flag
const isDev = process.env.NODE_ENV === "development" || __DEV__;

// Define API response types
interface ShareResponse {
	shareCount: number;
	isShared: boolean;
	message?: string;
	voiceNoteId?: string;
	userId?: string;
	error?: string;
}

interface CommentsResponse {
	data: Comment[];
}

// Use the same Comment interface as in CommentPopup
interface Comment {
	id: string;
	voice_note_id?: string;
	content: string;
	created_at: string;
	user_id: string;
	user?: {
		id?: string;
		username: string;
		display_name: string;
		avatar_url?: string | null;
	};
}

export interface VoiceNote {
	id: string;
	duration: number;
	title: string;
	likes: number;
	comments: number;
	plays: number;
	shares: number;
	backgroundImage: string | null;
	tags?: string[];
	userAvatarUrl?: string | null;
	// Add the users property to match the API response structure
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

interface VoiceNoteCardProps {
	voiceNote: VoiceNote;
	userId?: string;
	displayName?: string; // Display name (human-readable)
	username?: string; // Username for routing and @ mentions
	userAvatarUrl?: string | null;
	timePosted?: string;
	onPlay?: () => void;
	onPlayPress?: () => void; // Alternative name for onPlay
	onProfilePress?: () => void;
	onUserProfilePress?: () => void; // Alternative name for onProfilePress
	onShare?: (voiceNoteId: string) => void;
	currentUserId?: string;
	isShared?: boolean; // Whether this post is a shared/reposted voice note
	sharedBy?: {
		// Info about who shared the voice note
		id: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
	} | null;
	showRepostAttribution?: boolean; // Whether to show repost attribution
	voiceNoteUsers?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
}

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatNumber = (num: any): string => {
	// Log unexpected values for debugging
	if (num === null || num === undefined) {
		console.log("formatNumber received null/undefined");
		return "0";
	}

	if (typeof num === "object") {
		console.log(
			"formatNumber received an object instead of a number:",
			JSON.stringify(num)
		);
		// Try to extract count from object
		if (num && typeof num.count === "number") {
			return formatNumber(num.count);
		}
		return "0";
	}

	// Convert to number to ensure consistent handling
	const numValue = Number(num);

	// Check if conversion resulted in a valid number
	if (isNaN(numValue)) {
		console.log(`formatNumber received non-numeric value: ${num}`);
		return "0";
	}

	if (numValue >= 1000000) {
		return (numValue / 1000000).toFixed(1) + "m";
	}
	if (numValue >= 1000) {
		return (numValue / 1000).toFixed(1) + "k";
	}
	return numValue.toString();
};

const DefaultProfilePicture = ({
	userId,
	size = 32,
	avatarUrl = null,
}: {
	userId: string;
	size: number;
	avatarUrl?: string | null;
}) => {
	// State to track if the avatar image failed to load
	const [imageError, setImageError] = useState(false);

	// Only try to load the avatar if a URL is provided and there hasn't been an error
	if (avatarUrl && !imageError) {
		return (
			<Image
				source={{ uri: avatarUrl }}
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
				}}
				onError={() => {
					console.log("Error loading avatar in VoiceNoteCard");
					setImageError(true); // Mark this image as failed
				}}
				// Don't use local assets for default source
				defaultSource={
					Platform.OS === "ios"
						? { uri: "https://ui-avatars.com/api/?name=" + (userId || "U") }
						: undefined
				}
			/>
		);
	}

	// Fallback to our new DefaultAvatar
	return <DefaultAvatar userId={userId} size={size} />;
};

// Function to safely extract plays count from various formats
const normalizePlaysCount = (plays: any): number => {
	if (typeof plays === "number") {
		return plays;
	}

	if (plays && typeof plays === "object") {
		// If it's an object with count property
		if (typeof plays.count === "number") {
			return plays.count;
		}

		// If it's an array of objects with count
		if (
			Array.isArray(plays) &&
			plays.length > 0 &&
			typeof plays[0].count === "number"
		) {
			return plays[0].count;
		}
	}

	return 0; // Default to 0 if no valid format is found
};

export function VoiceNoteCard({
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
	const { user } = useUser(); // Get current logged-in user from context
	const [isPlaying, setIsPlaying] = useState(false);
	const loggedInUserId = user?.id || currentUserId; // Use user from context or fallback to prop
	const progressContainerRef = useRef<View>(null);
	const statusTimeout = useRef<any>(null);
	const scrollViewRef = useRef<ScrollView>(null);

	// Combine username sources with fallbacks
	const effectiveUsername = username || voiceNoteUsers?.username || "user";
	const effectiveDisplayName =
		displayName || voiceNoteUsers?.display_name || "User";
	const effectiveAvatarUrl =
		userAvatarUrl || voiceNoteUsers?.avatar_url || null;

	// Handle duplicate isShared identifier by using the prop value or defaulting to the state
	const [isSharedState, setIsShared] = useState<boolean>(
		isSharedProp !== undefined ? isSharedProp : false
	);

	// Use the prop if provided, otherwise use the state
	const isSharedEffective =
		isSharedProp !== undefined ? isSharedProp : isSharedState;

	// Debug log to check the username value
	console.log("VoiceNoteCard received props:", {
		userId,
		displayName,
		username,
		userAvatarUrl,
		voiceNoteUsers: voiceNote.users,
		loggedInUserId,
	});

	// Ensure we have a valid username for display and navigation
	// If username is undefined, try to extract it from voiceNote.users
	console.log("Using effectiveUsername:", effectiveUsername);
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
	const likeScale = useRef(new Animated.Value(1)).current;
	const shareScale = useRef(new Animated.Value(1)).current;
	const [playsCount, setPlaysCount] = useState(
		normalizePlaysCount(voiceNote.plays || 0)
	);

	// Keep track of stats loading
	const [statsLoaded, setStatsLoaded] = useState(false);

	// Fetch the actual share count
	const fetchShareCount = useCallback(async () => {
		if (!voiceNote.id) return;

		try {
			setIsLoadingShareCount(true);
			console.log("Fetching share count for voice note:", voiceNote.id);
			const count = await getShareCount(voiceNote.id);
			// Make sure count is a number
			setSharesCount(typeof count === "number" ? count : 0);
			console.log("Retrieved share count:", count);
		} catch (error) {
			console.error("Error fetching share count:", error);
			// Keep the initial value from the voiceNote object
		} finally {
			setIsLoadingShareCount(false);
		}
	}, [voiceNote.id]);

	// Fetch comments when needed
	const fetchComments = useCallback(async () => {
		if (!voiceNote.id) return;

		setIsLoadingComments(true);
		try {
			// Use type assertion with unknown as intermediate step
			const response = (await getComments(
				voiceNote.id
			)) as unknown as CommentsResponse;
			setComments(response.data || []);
			// Update the comment count based on the actual data
			setCommentsCount(response.data?.length || 0);
		} catch (error) {
			console.error("Error fetching comments:", error);
		} finally {
			setIsLoadingComments(false);
		}
	}, [voiceNote.id]);

	// Handle profile press
	const handleProfilePress = useCallback(() => {
		// Support both onProfilePress and onUserProfilePress props for backward compatibility
		if (onUserProfilePress) {
			onUserProfilePress();
		} else if (onProfilePress) {
			onProfilePress();
		} else if (username) {
			router.push({
				pathname: "/profile/[username]",
				params: { username },
			});
		}
	}, [router, username, onProfilePress, onUserProfilePress]);

	// Handle like button press
	const handleLikePress = useCallback(() => {
		if (!loggedInUserId) {
			Alert.alert("Sign In Required", "Please sign in to like voice notes.");
			return;
		}

		// Toggle like state
		setIsLiked((prevState) => {
			const newLikeState = !prevState;

			// Update likes count immediately for UI responsiveness
			setLikesCount((prevCount) =>
				newLikeState ? prevCount + 1 : Math.max(0, prevCount - 1)
			);

			// Call the API to like/unlike the voice note
			if (newLikeState) {
				likeVoiceNote(voiceNote.id, loggedInUserId)
					.then((response) => {
						console.log("Voice note liked successfully:", response);
					})
					.catch((error) => {
						console.error("Error liking voice note:", error);
						// Revert UI state on error
						setIsLiked(false);
						setLikesCount((prevCount) => Math.max(0, prevCount - 1));
					});
			} else {
				unlikeVoiceNote(voiceNote.id, loggedInUserId)
					.then((response) => {
						console.log("Voice note unliked successfully:", response);
					})
					.catch((error) => {
						console.error("Error unliking voice note:", error);
						// Revert UI state on error
						setIsLiked(true);
						setLikesCount((prevCount) => prevCount + 1);
					});
			}

			// Animate the like button
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

		// Fetch comments before showing popup
		fetchComments();
		setShowCommentPopup(true);
	}, [fetchComments, loggedInUserId]);

	// Handle comment added
	const handleCommentAdded = useCallback(
		(newComment: Comment | string) => {
			if (!loggedInUserId || !voiceNote.id) return;

			// Update comments array and count
			setComments((prevComments) => [newComment as Comment, ...prevComments]);
			setCommentsCount((prevCount) => prevCount + 1);
		},
		[voiceNote.id, loggedInUserId]
	);

	// Handle close comment popup
	const handleCloseCommentPopup = useCallback(() => {
		setShowCommentPopup(false);

		// Fetch the latest stats for this voice note
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
		// TODO: Implement plays functionality
		console.log("Plays button pressed");
		// This might show who listened to the voice note
	}, []);

	// Handle repost (share) button press
	const handleRepostPress = useCallback(() => {
		if (!loggedInUserId) {
			Alert.alert("Sign In Required", "Please sign in to repost voice notes.");
			return;
		}

		// Prevent multiple rapid clicks
		if (isLoadingShareCount) {
			return;
		}

		setIsLoadingShareCount(true);

		// Call the API to toggle the share
		recordShare(voiceNote.id, loggedInUserId)
			.then((response: any) => {
				console.log("Voice note share toggled:", response);

				// Check if the response has an error property, which means something went wrong
				if (response.error) {
					console.error("Error in sharing response:", response.error);
					// Don't update UI state if there was an error
					return;
				}

				// Update the shared state based on the response
				const newSharedState = response.isShared;
				setIsShared(newSharedState);

				// Update shares count with the accurate number from server
				if (typeof response.shareCount === "number") {
					setSharesCount(response.shareCount);
				}

				// Animate the share button
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

				// Notify parent component if callback provided
				if (onShare) {
					onShare(voiceNote.id);
				}
			})
			.catch((error) => {
				console.error("Error toggling voice note share:", error);
				// We don't need to handle the error here since recordShare now returns a valid response even on error
			})
			.finally(() => {
				setIsLoadingShareCount(false);
			});
	}, [shareScale, voiceNote.id, loggedInUserId, onShare, isLoadingShareCount]);

	// Handle native share
	const handleNativeShare = useCallback(async () => {
		if (isLoadingShareCount) {
			return;
		}

		try {
			setIsLoadingShareCount(true);

			// Create a shareable link/message
			const shareMessage = `Check out this voice note: ${voiceNote.title}\n\nhttps://ripply.app/voice-note/${voiceNote.id}`;

			// Use native share API
			const result = await Share.share({
				message: shareMessage,
				title: voiceNote.title,
			});

			// Record share if completed
			if (result.action === Share.sharedAction && loggedInUserId) {
				try {
					const response = await recordShare(voiceNote.id, loggedInUserId);
					console.log("Voice note share recorded:", response);

					// Check if there was an error
					if (response.error) {
						console.error("Error in sharing response:", response.error);
						return;
					}

					// Update the shared state based on the response
					setIsShared(response.isShared);

					// Update shares count with the accurate number from server
					if (typeof response.shareCount === "number") {
						setSharesCount(response.shareCount);
					}
				} catch (shareError) {
					console.error("Error recording share:", shareError);
				}
			}
		} catch (error) {
			console.error("Error sharing:", error);
			Alert.alert("Error", "Could not share this voice note");
		} finally {
			setIsLoadingShareCount(false);
		}
	}, [voiceNote, loggedInUserId, isLoadingShareCount]);

	// Handle play button press
	const handlePlayPress = useCallback(() => {
		setIsPlaying((prev) => !prev);
		// Support both onPlay and onPlayPress props for backward compatibility
		if (onPlayPress) {
			onPlayPress();
		} else if (onPlay) {
			onPlay();
		}
	}, [onPlay, onPlayPress]);

	// Calculate progress based on touch position
	const calculateProgress = useCallback((pageX: number) => {
		if (progressContainerRef.current) {
			progressContainerRef.current.measure(
				(x, y, width, height, pageXOffset, pageYOffset) => {
					const containerStart = pageXOffset;
					const newProgress = Math.max(
						0,
						Math.min(1, (pageX - containerStart) / width)
					);
					setProgress(newProgress);
				}
			);
		}
	}, []);

	// Handle seek start
	const handleSeekStart = useCallback(
		(event: any) => {
			setIsSeeking(true);
			calculateProgress(event.nativeEvent.pageX);
		},
		[calculateProgress]
	);

	// Handle seek move
	const handleSeekMove = useCallback(
		(event: any) => {
			if (isSeeking) {
				calculateProgress(event.nativeEvent.pageX);
			}
		},
		[isSeeking, calculateProgress]
	);

	// Handle seek end
	const handleSeekEnd = useCallback(() => {
		setIsSeeking(false);
	}, []);

	// Render progress bar
	const renderProgressBar = useCallback(
		() => (
			<View ref={progressContainerRef} style={styles.progressContainer}>
				<View style={styles.progressBackground} />
				<View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
				<Pressable
					style={styles.progressHitSlop}
					onPressIn={handleSeekStart}
					onTouchMove={handleSeekMove}
					onPressOut={handleSeekEnd}
				/>
			</View>
		),
		[progress, handleSeekStart, handleSeekMove, handleSeekEnd]
	);

	// Effect to load stats and check like/share status
	useEffect(() => {
		// Only proceed if voice note ID is available
		if (!voiceNote.id) return;

		// Load current share count immediately
		const loadInitialData = async () => {
			try {
				console.log(`Loading full data for voice note: ${voiceNote.id}`);

				// Fetch the complete voice note stats
				const stats = await getVoiceNoteStats(voiceNote.id);
				console.log(`Received stats for ${voiceNote.id}:`, stats);

				// Only update the UI with the fetched stats if they exist and are different from current values
				if (stats) {
					// Don't set lower values - that prevents flickering
					if (typeof stats.likes === "number" && stats.likes > likesCount)
						setLikesCount(stats.likes);
					if (
						typeof stats.comments === "number" &&
						stats.comments > commentsCount
					)
						setCommentsCount(stats.comments);
					if (typeof stats.plays === "number" && stats.plays > playsCount)
						setPlaysCount(stats.plays);
					if (typeof stats.shares === "number" && stats.shares > sharesCount)
						setSharesCount(stats.shares);
					setStatsLoaded(true);
				}

				// Also check if logged-in user has liked/shared this voice note
				if (loggedInUserId) {
					const isUserShared = await checkShareStatus(
						voiceNote.id,
						loggedInUserId
					);
					setIsShared(isUserShared);

					const isUserLiked = await checkLikeStatus(
						voiceNote.id,
						loggedInUserId
					);
					setIsLiked(isUserLiked);
				}
			} catch (error) {
				console.error("Error loading initial voice note data:", error);
				// Even if we catch an error, mark stats as loaded so we don't continually retry
				setStatsLoaded(true);
			}
		};

		// Only load stats if they haven't been loaded yet
		if (!statsLoaded) {
			loadInitialData();
		}
	}, [
		voiceNote.id,
		loggedInUserId,
		statsLoaded,
		likesCount,
		commentsCount,
		playsCount,
		sharesCount,
	]);

	// Add a debug function to check share count directly
	const debugCheckShareCount = useCallback(async () => {
		if (!voiceNote.id) return;

		console.log(`[DEBUG] Checking share count for voice note: ${voiceNote.id}`);

		try {
			// Fetch the voice note data first
			const noteData = await getVoiceNoteById(voiceNote.id);
			console.log(`[DEBUG] Raw voice note data:`, JSON.stringify(noteData));

			// Then get specific share count
			const shareCount = await getShareCount(voiceNote.id, true);
			console.log(`[DEBUG] Share count from getShareCount: ${shareCount}`);

			// Get the complete stats
			const stats = await getVoiceNoteStats(voiceNote.id);
			console.log(`[DEBUG] Complete stats:`, stats);

			// Safely access properties to avoid TypeScript errors
			const rawShares =
				noteData && typeof noteData === "object" && "shares" in noteData
					? noteData.shares
					: "N/A";

			// Show alert with findings
			Alert.alert(
				"Share Count Debug",
				`Raw count: ${rawShares}\nAPI count: ${shareCount}\nStats count: ${stats.shares}`
			);
		} catch (error) {
			console.error("[DEBUG] Error checking share count:", error);
			Alert.alert("Error", "Failed to debug share count");
		}
	}, [voiceNote.id]);

	// In development mode only, long press on share count to check the API data
	const handleShareCountLongPress = useCallback(() => {
		// Only enable this in development mode
		if (isDev) {
			debugCheckShareCount();
		}
	}, [debugCheckShareCount, isDev]);

	// Handle tag click to navigate to search
	const handleTagPress = (tag: string) => {
		// Remove # if it's already in the tag
		const cleanTag = tag.startsWith("#") ? tag.substring(1) : tag;

		console.log(
			`Tag pressed: ${tag}, navigating to search with tag=${cleanTag}`
		);

		// Force a reset of any existing search before navigation
		const uniqueTimestamp = Date.now().toString();

		router.push({
			pathname: "/(tabs)/search",
			params: {
				tag: cleanTag,
				searchType: "tag",
				timestamp: uniqueTimestamp,
			},
		});
	};

	// Render the card with or without background image
	if (!voiceNote.backgroundImage) {
		return (
			<>
				<View style={[styles.container, styles.plainContainer]}>
					{/* Add repost attribution if needed */}
					{showRepostAttribution && isSharedEffective && sharedBy && (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								paddingHorizontal: 10,
								paddingVertical: 5,
								backgroundColor: voiceNote.backgroundImage
									? "rgba(255, 255, 255, 0.1)"
									: "rgba(0,0,0,0.7)",
								borderTopLeftRadius: 10,
								borderTopRightRadius: 10,
							}}
						>
							<Text
								style={{
									fontSize: 12,
									color: "#fff",
									fontWeight: "400",
								}}
							>
								<Feather name="repeat" size={14} color="#fff" /> Reposted by{" "}
								<TouchableOpacity
									onPress={() => {
										if (sharedBy.username) {
											router.push({
												pathname: "/profile/[username]",
												params: { username: sharedBy.username },
											});
										}
									}}
								>
									<Text
										style={{
											fontWeight: "600",
											color: "#fff",
										}}
									>
										@{sharedBy.username}
									</Text>
								</TouchableOpacity>
							</Text>
						</View>
					)}
					<View style={styles.content}>
						{/* User info and options header */}
						{(userId || displayName) && (
							<View style={styles.cardHeader}>
								<TouchableOpacity
									style={styles.userInfoContainer}
									onPress={handleProfilePress}
								>
									<DefaultProfilePicture
										userId={userId || "user"}
										size={32}
										avatarUrl={effectiveAvatarUrl}
									/>
									<View style={styles.userInfo}>
										<Text style={styles.displayName}>
											{effectiveDisplayName}
										</Text>
										<Text style={styles.username}>@{effectiveUsername}</Text>
									</View>
								</TouchableOpacity>
								<View style={styles.headerActions}>
									{timePosted && (
										<Text style={styles.timePosted}>{timePosted}</Text>
									)}
									<TouchableOpacity style={styles.optionsButton}>
										<Feather
											name="more-horizontal"
											size={16}
											color="#666666"
											style={{
												textShadowColor: "#FFFFFF",
												textShadowOffset: { width: 0.5, height: 0.5 },
												textShadowRadius: 1,
											}}
										/>
									</TouchableOpacity>
								</View>
							</View>
						)}
						<Text style={styles.title}>{voiceNote.title}</Text>

						<View style={styles.playerContainer}>
							<TouchableOpacity
								onPress={handlePlayPress}
								style={styles.playButton}
								activeOpacity={0.7}
							>
								<MaterialIcons
									name={isPlaying ? "pause" : "play-arrow"}
									size={24}
									color="white"
									style={{
										textShadowColor: "#000000",
										textShadowOffset: { width: 0.5, height: 0.5 },
										textShadowRadius: 1,
									}}
								/>
							</TouchableOpacity>

							{renderProgressBar()}

							<Text style={styles.duration}>
								{formatDuration(voiceNote.duration)}
							</Text>
						</View>

						{/* Tags section */}
						{voiceNote.tags && voiceNote.tags.length > 0 && (
							<View style={styles.tagsContainer}>
								{voiceNote.tags.slice(0, 10).map((tag, index) => (
									<TouchableOpacity
										key={index}
										style={styles.tagItem}
										activeOpacity={0.7}
										onPress={() => handleTagPress(tag)}
									>
										<Text style={styles.tagText}>#{tag}</Text>
									</TouchableOpacity>
								))}
							</View>
						)}

						<View style={styles.interactions}>
							<TouchableOpacity
								style={styles.interactionButton}
								activeOpacity={0.7}
								onPress={handleLikePress}
							>
								<View style={styles.interactionContent}>
									<Animated.View
										style={[
											styles.iconContainer,
											{ transform: [{ scale: likeScale }] },
										]}
									>
										<Feather
											name={isLiked ? "heart" : "heart"}
											size={18}
											color={isLiked ? "#E53935" : "#888"}
											style={{
												// Fill the heart if liked
												...(isLiked && {
													backgroundColor: "transparent",
													// This creates a filled heart effect
													textShadowColor: "#E53935",
													textShadowOffset: { width: 0, height: 0 },
													textShadowRadius: 1,
												}),
											}}
										/>
									</Animated.View>
									<Text
										style={[
											styles.interactionCount,
											isLiked && { color: "#E53935" },
										]}
									>
										{formatNumber(likesCount)}
									</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.interactionButton}
								activeOpacity={0.7}
								onPress={handleCommentPress}
							>
								<View style={styles.interactionContent}>
									<Feather
										name="message-circle"
										size={18}
										color="#666666"
										style={{
											textShadowColor: "#FFFFFF",
											textShadowOffset: { width: 0.5, height: 0.5 },
											textShadowRadius: 1,
										}}
									/>
									<Text style={styles.interactionText}>
										{formatNumber(commentsCount)}
									</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.interactionButton}
								activeOpacity={0.7}
								onPress={handlePlaysPress}
							>
								<View style={styles.interactionContent}>
									<Feather
										name="headphones"
										size={18}
										color="#666666"
										style={{
											textShadowColor: "#FFFFFF",
											textShadowOffset: { width: 0.5, height: 0.5 },
											textShadowRadius: 1,
										}}
									/>
									<Text style={styles.interactionText}>
										{formatNumber(playsCount)}
									</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.interactionButton}
								activeOpacity={0.7}
								onPress={handleRepostPress}
								onLongPress={handleShareCountLongPress}
								disabled={isLoadingShareCount}
							>
								<View style={styles.interactionContent}>
									<Animated.View
										style={[
											styles.iconContainer,
											{ transform: [{ scale: shareScale }] },
										]}
									>
										<Feather
											name="repeat"
											size={18}
											color={isSharedEffective ? "#4CAF50" : "#888"}
										/>
									</Animated.View>
									{isLoadingShareCount ? (
										<Text
											style={[
												styles.interactionCount,
												isSharedEffective && { color: "#4CAF50" },
												{ opacity: 0.5 }, // Dim when loading
											]}
										>
											{formatNumber(sharesCount)}
										</Text>
									) : (
										<Text
											style={[
												styles.interactionCount,
												isSharedEffective && { color: "#4CAF50" },
											]}
										>
											{formatNumber(sharesCount)}
										</Text>
									)}
								</View>
							</TouchableOpacity>
						</View>
					</View>
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

	return (
		<>
			<ImageBackground
				source={{ uri: voiceNote.backgroundImage }}
				style={styles.container}
				imageStyle={{ opacity: 1 }}
			>
				<View style={styles.overlay} />
				{/* Add repost attribution if needed */}
				{showRepostAttribution && isSharedEffective && sharedBy && (
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							paddingHorizontal: 10,
							paddingVertical: 5,
							backgroundColor: voiceNote.backgroundImage
								? "rgba(0,0,0,0.15)"
								: "rgba(0,0,0,0.3)",
							borderTopLeftRadius: 10,
							borderTopRightRadius: 10,
						}}
					>
						<Text
							style={{
								fontSize: 12,
								color: "#fff",
								fontWeight: "400",
							}}
						>
							<Feather name="repeat" size={14} color="#fff" /> Reposted by{" "}
							<TouchableOpacity
								onPress={() => {
									if (sharedBy.username) {
										router.push({
											pathname: "/profile/[username]",
											params: { username: sharedBy.username },
										});
									}
								}}
							>
								<Text
									style={{
										fontWeight: "600",
										color: "#fff",
									}}
								>
									@{sharedBy.username}
								</Text>
							</TouchableOpacity>
						</Text>
					</View>
				)}
				<View style={styles.content}>
					{/* User info and options header */}
					{(userId || displayName) && (
						<View style={styles.cardHeader}>
							<TouchableOpacity
								style={styles.userInfoContainer}
								onPress={handleProfilePress}
							>
								<DefaultProfilePicture
									userId={userId || "@user"}
									size={32}
									avatarUrl={effectiveAvatarUrl}
								/>
								<View style={styles.userInfo}>
									<Text style={styles.displayName}>{effectiveDisplayName}</Text>
									<Text style={styles.username}>@{effectiveUsername}</Text>
								</View>
							</TouchableOpacity>
							<View style={styles.headerActions}>
								{timePosted && (
									<Text style={styles.timePosted}>{timePosted}</Text>
								)}
								<TouchableOpacity style={styles.optionsButton}>
									<Feather
										name="more-horizontal"
										size={16}
										color="#666666"
										style={{
											textShadowColor: "#FFFFFF",
											textShadowOffset: { width: 0.5, height: 0.5 },
											textShadowRadius: 1,
										}}
									/>
								</TouchableOpacity>
							</View>
						</View>
					)}
					<Text style={styles.title}>{voiceNote.title}</Text>

					<View style={styles.playerContainer}>
						<TouchableOpacity
							onPress={handlePlayPress}
							style={styles.playButton}
							activeOpacity={0.7}
						>
							<MaterialIcons
								name={isPlaying ? "pause" : "play-arrow"}
								size={24}
								color="white"
								style={{
									textShadowColor: "#000000",
									textShadowOffset: { width: 0.5, height: 0.5 },
									textShadowRadius: 1,
								}}
							/>
						</TouchableOpacity>

						{renderProgressBar()}

						<Text style={styles.duration}>
							{formatDuration(voiceNote.duration)}
						</Text>
					</View>

					{/* Tags section */}
					{voiceNote.tags && voiceNote.tags.length > 0 && (
						<View style={styles.tagsContainer}>
							{voiceNote.tags.slice(0, 10).map((tag, index) => (
								<TouchableOpacity
									key={index}
									style={styles.tagItem}
									activeOpacity={0.7}
									onPress={() => handleTagPress(tag)}
								>
									<Text style={styles.tagText}>#{tag}</Text>
								</TouchableOpacity>
							))}
						</View>
					)}

					<View style={styles.interactions}>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
							onPress={handleLikePress}
						>
							<View style={styles.interactionContent}>
								<Animated.View
									style={[
										styles.iconContainer,
										{ transform: [{ scale: likeScale }] },
									]}
								>
									<Feather
										name={isLiked ? "heart" : "heart"}
										size={18}
										color={isLiked ? "#E53935" : "#888"}
										style={{
											// Fill the heart if liked
											...(isLiked && {
												backgroundColor: "transparent",
												// This creates a filled heart effect
												textShadowColor: "#E53935",
												textShadowOffset: { width: 0, height: 0 },
												textShadowRadius: 1,
											}),
										}}
									/>
								</Animated.View>
								<Text
									style={[
										styles.interactionCount,
										isLiked && { color: "#E53935" },
									]}
								>
									{formatNumber(likesCount)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
							onPress={handleCommentPress}
						>
							<View style={styles.interactionContent}>
								<Feather
									name="message-circle"
									size={18}
									color="#666666"
									style={{
										textShadowColor: "#FFFFFF",
										textShadowOffset: { width: 0.5, height: 0.5 },
										textShadowRadius: 1,
									}}
								/>
								<Text style={styles.interactionText}>
									{formatNumber(commentsCount)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
							onPress={handlePlaysPress}
						>
							<View style={styles.interactionContent}>
								<Feather
									name="headphones"
									size={18}
									color="#666666"
									style={{
										textShadowColor: "#FFFFFF",
										textShadowOffset: { width: 0.5, height: 0.5 },
										textShadowRadius: 1,
									}}
								/>
								<Text style={styles.interactionText}>
									{formatNumber(playsCount)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
							onPress={handleRepostPress}
							onLongPress={handleShareCountLongPress}
							disabled={isLoadingShareCount}
						>
							<View style={styles.interactionContent}>
								<Animated.View
									style={[
										styles.iconContainer,
										{ transform: [{ scale: shareScale }] },
									]}
								>
									<Feather
										name="repeat"
										size={18}
										color={isSharedEffective ? "#4CAF50" : "#888"}
									/>
								</Animated.View>
								{isLoadingShareCount ? (
									<Text
										style={[
											styles.interactionCount,
											isSharedEffective && { color: "#4CAF50" },
											{ opacity: 0.5 }, // Dim when loading
										]}
									>
										{formatNumber(sharesCount)}
									</Text>
								) : (
									<Text
										style={[
											styles.interactionCount,
											isSharedEffective && { color: "#4CAF50" },
										]}
									>
										{formatNumber(sharesCount)}
									</Text>
								)}
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</ImageBackground>

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

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "#FFFFFF",
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: 12,
	},
	tagItem: {
		backgroundColor: "rgba(107, 47, 188, 0.1)",
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginRight: 8,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "rgba(107, 47, 188, 0.3)",
	},
	tagText: {
		color: "#6B2FBC",
		fontSize: 12,
		fontWeight: "500",
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	plainContainer: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.1)",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
	},
	content: {
		padding: 16,
		backgroundColor: "rgba(255, 255, 255, 0.7)",
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	userInfoContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	userInfo: {
		marginLeft: 8,
		justifyContent: "center",
	},
	displayName: {
		fontWeight: "bold",
		fontSize: 14,
		color: "#000000",
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	username: {
		fontSize: 12,
		color: "#666666",
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
	},
	timePosted: {
		fontSize: 12,
		color: "#666666",
		marginRight: 8,
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	optionsButton: {
		padding: 4,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 12,
		color: "#000000",
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	playerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	playButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	progressContainer: {
		flex: 1,
		height: 24,
		backgroundColor: "transparent",
		borderRadius: 2,
		marginRight: 12,
		justifyContent: "center",
		position: "relative",
	},
	progressBackground: {
		position: "absolute",
		width: "100%",
		height: 4,
		backgroundColor: "rgba(107, 47, 188, 0.2)",
		borderRadius: 2,
		top: 10,
	},
	progressBar: {
		position: "absolute",
		height: 4,
		backgroundColor: "#6B2FBC",
		borderRadius: 2,
		top: 10,
		left: 0,
		zIndex: 1,
	},
	progressHitSlop: {
		position: "absolute",
		width: "100%",
		height: "100%",
		backgroundColor: "transparent",
	},
	duration: {
		fontSize: 14,
		color: "#666666",
		minWidth: 45,
		textAlign: "right",
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	interactions: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
	},
	interactionButton: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 16,
		marginHorizontal: 16,
		minWidth: 48,
		width: 60,
	},
	interactionContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: 72,
	},
	interactionText: {
		fontSize: 14,
		color: "#666666",
		marginLeft: 8,
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
	likedText: {
		color: "#FF4D67",
	},
	sharedText: {
		color: "#4CAF50",
		fontWeight: "600",
	},
	iconContainer: {
		width: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	interactionCount: {
		fontSize: 14,
		color: "#666666",
		marginLeft: 8,
		textShadowColor: "#FFFFFF",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
});
