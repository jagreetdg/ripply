import { useState, useCallback, useRef, useEffect } from "react";
import { Animated, Alert, Share, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../context/UserContext";
import {
	likeVoiceNote,
	unlikeVoiceNote,
	getComments,
	checkLikeStatus,
	getVoiceNoteStats,
	recordPlay,
} from "../../../services/api";
import {
	hasUserRepostedVoiceNote,
	toggleRepost,
	getRepostCount,
} from "../../../services/api";
import { VoiceNoteCardProps, Comment, CommentsResponse } from "../VoiceNoteCardTypes";
import { normalizePlaysCount } from "../VoiceNoteCardUtils";

export const useVoiceNoteCard = ({
	voiceNote,
	userId,
	currentUserId,
	isReposted: isRepostedProp,
	isLoadingRepostStatus = false,
	onPlay,
	onPlayPress,
	onProfilePress,
	onUserProfilePress,
	onShare,
	onShareStatusChanged,
	onVoiceNoteUnshared,
}: Pick<VoiceNoteCardProps, 
	"voiceNote" | "userId" | "currentUserId" | "isReposted" | "isLoadingRepostStatus" |
	"onPlay" | "onPlayPress" | "onProfilePress" | "onUserProfilePress" | 
	"onShare" | "onShareStatusChanged" | "onVoiceNoteUnshared"
>) => {
	const router = useRouter();
	const { user } = useUser();
	const progressContainerRef = useRef<View>(null);

	// Get user ID from context or props
	const loggedInUserId = user?.id || currentUserId;

	// State for repost status
	const [internalRepostedState, setInternalRepostedState] = useState<boolean>(
		isRepostedProp !== undefined ? Boolean(isRepostedProp) : false
	);

	// Determine effective repost status
	const isRepostedEffective = isLoadingRepostStatus
		? false
		: Boolean(isRepostedProp !== undefined ? isRepostedProp : internalRepostedState);

	// State management
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(
		typeof voiceNote.likes === "number" && voiceNote.likes > 0 ? voiceNote.likes : 0
	);
	const [sharesCount, setSharesCount] = useState(
		typeof voiceNote.shares === "number" && voiceNote.shares > 0 ? voiceNote.shares : 0
	);
	const [isLoadingShareCount, setIsLoadingShareCount] = useState(false);
	const [showCommentPopup, setShowCommentPopup] = useState(false);
	const [commentsCount, setCommentsCount] = useState(
		typeof voiceNote.comments === "number" && voiceNote.comments > 0 ? voiceNote.comments : 0
	);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);
	const [playsCount, setPlaysCount] = useState(normalizePlaysCount(voiceNote.plays || 0));
	const [statsLoaded, setStatsLoaded] = useState(false);

	// Animation refs
	const likeScale = useRef(new Animated.Value(1)).current;
	const shareScale = useRef(new Animated.Value(1)).current;

	// Add comprehensive state logging for debugging
	const logShareState = useCallback((context: string) => {
		console.log(`[SHARE DEBUG] State Snapshot - ${context}:`, {
			voiceNoteId: voiceNote.id,
			// State values
			sharesCount,
			isLoadingShareCount,
			isRepostedEffective,
			internalRepostedState,
			// Props
			isRepostedProp,
			isLoadingRepostStatus,
			// User
			loggedInUserId,
			// Voice note data
			voiceNoteShares: voiceNote.shares,
			voiceNoteIsShared: voiceNote.is_shared
		});
	}, [
		voiceNote.id, 
		voiceNote.shares, 
		voiceNote.is_shared,
		sharesCount,
		isLoadingShareCount,
		isRepostedEffective,
		internalRepostedState,
		isRepostedProp,
		isLoadingRepostStatus,
		loggedInUserId
	]);

	// Log state changes for debugging
	useEffect(() => {
		logShareState("State Change");
	}, [sharesCount, isRepostedEffective, logShareState]);

	// Fetch comments when needed
	const fetchComments = useCallback(async () => {
		if (!voiceNote.id) return;

		setIsLoadingComments(true);
		try {
			const response = (await getComments(voiceNote.id)) as unknown as CommentsResponse;
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

	// Handle play button press
	const handlePlayPress = useCallback(() => {
		setIsPlaying(!isPlaying);
		
		if (onPlayPress) {
			onPlayPress();
		}
		
		if (onPlay) {
			onPlay();
		}

		// Record play
		if (loggedInUserId) {
			recordPlay(voiceNote.id, loggedInUserId).catch((error) => {
				console.error("Error recording play:", error);
			});
		}
	}, [isPlaying, onPlayPress, onPlay, voiceNote.id, loggedInUserId]);

	// Handle profile press
	const handleProfilePress = useCallback(() => {
		if (onProfilePress) {
			onProfilePress();
		} else if (onUserProfilePress) {
			onUserProfilePress();
		}
	}, [onProfilePress, onUserProfilePress]);

	// Handle like press
	const handleLikePress = useCallback(async () => {
		if (!loggedInUserId) {
			Alert.alert("Please log in", "You need to be logged in to like voice notes.");
			return;
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

		try {
			if (isLiked) {
				const result = await unlikeVoiceNote(voiceNote.id, loggedInUserId);
				setIsLiked(false);
				setLikesCount(result.likesCount);
			} else {
				const result = await likeVoiceNote(voiceNote.id, loggedInUserId);
				setIsLiked(true);
				setLikesCount(result.likesCount);
			}
		} catch (error) {
			console.error("Error toggling like:", error);
			Alert.alert("Error", "Failed to update like status. Please try again.");
		}
	}, [loggedInUserId, likeScale, voiceNote.id, isLiked]);

	// Handle comment press
	const handleCommentPress = useCallback(() => {
		setShowCommentPopup(true);
		fetchComments();
	}, [fetchComments]);

	// Handle plays press
	const handlePlaysPress = useCallback(() => {
		// Show plays information or navigate to plays list
	}, []);

	// Handle repost press
	const handleRepostPress = useCallback(async () => {
		if (!loggedInUserId) {
			console.log("[SHARE DEBUG] handleRepostPress - No logged in user, showing alert");
			Alert.alert("Please log in", "You need to be logged in to repost voice notes.");
			return;
		}

		logShareState("Before handleRepostPress");

		console.log("[SHARE DEBUG] handleRepostPress - Starting repost toggle:", {
			voiceNoteId: voiceNote.id,
			userId: loggedInUserId,
			currentRepostState: isRepostedEffective
		});

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

		try {
			console.log("[SHARE DEBUG] handleRepostPress - Calling toggleRepost API");
			const result = await toggleRepost(voiceNote.id, loggedInUserId);
			console.log("[SHARE DEBUG] handleRepostPress - toggleRepost result:", result);
			
			const newRepostedState = result.isReposted;
			console.log("[SHARE DEBUG] handleRepostPress - New repost state:", {
				oldState: isRepostedEffective,
				newState: newRepostedState
			});
			
			// Update internal state immediately
			setInternalRepostedState(newRepostedState);
			console.log("[SHARE DEBUG] handleRepostPress - Internal repost state updated");
			
			// Update share count if provided in result
			if (typeof result.repostCount === "number") {
				console.log("[SHARE DEBUG] handleRepostPress - Updating share count from result:", result.repostCount);
				setSharesCount(result.repostCount);
			}
			
			if (onShareStatusChanged) {
				console.log("[SHARE DEBUG] handleRepostPress - Calling onShareStatusChanged callback");
				onShareStatusChanged(voiceNote.id, newRepostedState);
			} else {
				console.log("[SHARE DEBUG] handleRepostPress - No onShareStatusChanged callback provided");
			}

			if (!newRepostedState && onVoiceNoteUnshared) {
				console.log("[SHARE DEBUG] handleRepostPress - Voice note unshared, calling callback");
				onVoiceNoteUnshared(voiceNote.id);
			}

			console.log("[SHARE DEBUG] handleRepostPress - Fetching updated share count");
			await fetchShareCount();
			console.log("[SHARE DEBUG] handleRepostPress - Share count fetch completed");
			
			logShareState("After handleRepostPress");
		} catch (error) {
			console.error("[SHARE DEBUG] handleRepostPress - Error:", {
				voiceNoteId: voiceNote.id,
				userId: loggedInUserId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined
			});
			Alert.alert("Error", "Failed to update repost status. Please try again.");
		}
	}, [loggedInUserId, shareScale, voiceNote.id, isRepostedEffective, onShareStatusChanged, onVoiceNoteUnshared, logShareState]);

	// Handle share count long press
	const handleShareCountLongPress = useCallback(() => {
		if (Platform.OS === "web") {
			const url = `${window.location.origin}/voicenote/${voiceNote.id}`;
			navigator.clipboard.writeText(url);
			Alert.alert("Link copied", "Voice note link copied to clipboard!");
		} else {
			Share.share({
				message: `Check out this voice note: ${voiceNote.title}`,
				url: `https://yourapp.com/voicenote/${voiceNote.id}`,
			});
		}
	}, [voiceNote.id, voiceNote.title]);

	// Handle tag press
	const handleTagPress = useCallback((tag: string) => {
		router.push({
			pathname: "/search",
			params: { query: `#${tag}` },
		});
	}, [router]);

	// Handle progress bar interactions
	const handleProgressBarPress = useCallback((event: any) => {
		// Implementation for progress bar press
	}, []);

	const handleProgressBarDrag = useCallback((event: any) => {
		// Implementation for progress bar drag
	}, []);

	const handleProgressBarRelease = useCallback(() => {
		// Implementation for progress bar release
	}, []);

	// Handle comment popup close
	const handleCloseCommentPopup = useCallback(() => {
		setShowCommentPopup(false);
	}, []);

	// Handle comment added
	const handleCommentAdded = useCallback((newComment: Comment) => {
		setComments(prev => [newComment, ...prev]);
		setCommentsCount(prev => prev + 1);
	}, []);

	// Load initial data
	useEffect(() => {
		const loadInitialData = async () => {
			if (!voiceNote.id || !loggedInUserId) {
				console.log("[SHARE DEBUG] loadInitialData - Missing requirements:", {
					hasVoiceNoteId: !!voiceNote.id,
					hasLoggedInUserId: !!loggedInUserId
				});
				return;
			}

			logShareState("Before loadInitialData");

			console.log("[SHARE DEBUG] loadInitialData - Starting for voice note:", {
				voiceNoteId: voiceNote.id,
				userId: loggedInUserId,
				isRepostedProp
			});

			try {
				// Check like status
				const likeStatus = await checkLikeStatus(voiceNote.id, loggedInUserId);
				setIsLiked(likeStatus.isLiked);

				// Check repost status if not provided via props
				if (isRepostedProp === undefined) {
					console.log("[SHARE DEBUG] loadInitialData - Checking repost status from API");
					const repostStatus = await hasUserRepostedVoiceNote(voiceNote.id, loggedInUserId);
					console.log("[SHARE DEBUG] loadInitialData - Repost status from API:", repostStatus);
					setInternalRepostedState(repostStatus);
				} else {
					console.log("[SHARE DEBUG] loadInitialData - Using repost status from props:", isRepostedProp);
				}

				setStatsLoaded(true);
				console.log("[SHARE DEBUG] loadInitialData - Initial data loaded successfully");
				
				logShareState("After loadInitialData");
			} catch (error) {
				console.error("[SHARE DEBUG] loadInitialData - Error:", {
					voiceNoteId: voiceNote.id,
					userId: loggedInUserId,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		};

		loadInitialData();
	}, [voiceNote.id, loggedInUserId, isRepostedProp, logShareState]);

	// Fetch stats with enhanced logging for shares
	const fetchStats = useCallback(async () => {
		if (!voiceNote.id) {
			console.log("[SHARE DEBUG] fetchStats - No voice note ID, skipping");
			return;
		}

		try {
			console.log("[SHARE DEBUG] fetchStats - Starting for voice note:", voiceNote.id);
			const stats = await getVoiceNoteStats(voiceNote.id);
			console.log("[SHARE DEBUG] fetchStats - Received stats:", {
				voiceNoteId: voiceNote.id,
				stats,
				sharesFromStats: stats.shares
			});

			setLikesCount(stats.likes || 0);
			setCommentsCount(stats.comments || 0);
			setPlaysCount(stats.plays || 0);
			setSharesCount(stats.shares || 0);

			console.log("[SHARE DEBUG] fetchStats - Stats updated in state:", {
				voiceNoteId: voiceNote.id,
				likes: stats.likes || 0,
				comments: stats.comments || 0,
				plays: stats.plays || 0,
				shares: stats.shares || 0
			});
		} catch (error) {
			console.error("[SHARE DEBUG] fetchStats - Error:", {
				voiceNoteId: voiceNote.id,
				error: error instanceof Error ? error.message : String(error)
			});
		}
	}, [voiceNote.id]);

	// Fetch the actual share count
	const fetchShareCount = useCallback(async () => {
		if (!voiceNote.id) {
			console.log("[SHARE DEBUG] fetchShareCount - No voice note ID, skipping");
			return;
		}

		logShareState("Before fetchShareCount");

		try {
			console.log("[SHARE DEBUG] fetchShareCount - Starting for voice note:", voiceNote.id);
			setIsLoadingShareCount(true);
			const count = await getRepostCount(voiceNote.id);
			console.log("[SHARE DEBUG] fetchShareCount - Received count:", { voiceNoteId: voiceNote.id, count });
			setSharesCount(typeof count === "number" ? count : 0);
			console.log("[SHARE DEBUG] fetchShareCount - Share count state updated:", typeof count === "number" ? count : 0);
			
			logShareState("After fetchShareCount");
		} catch (error) {
			console.error("[SHARE DEBUG] fetchShareCount - Error:", {
				voiceNoteId: voiceNote.id,
				error: error instanceof Error ? error.message : String(error)
			});
		} finally {
			setIsLoadingShareCount(false);
			console.log("[SHARE DEBUG] fetchShareCount - Loading state set to false");
		}
	}, [voiceNote.id, logShareState]);

	return {
		// State
		isPlaying,
		progress,
		isSeeking,
		isLiked,
		likesCount,
		sharesCount,
		isLoadingShareCount,
		showCommentPopup,
		commentsCount,
		comments,
		isLoadingComments,
		playsCount,
		statsLoaded,
		isRepostedEffective,
		loggedInUserId,
		progressContainerRef,
		likeScale,
		shareScale,

		// Handlers
		handlePlayPress,
		handleProfilePress,
		handleLikePress,
		handleCommentPress,
		handlePlaysPress,
		handleRepostPress,
		handleShareCountLongPress,
		handleTagPress,
		handleProgressBarPress,
		handleProgressBarDrag,
		handleProgressBarRelease,
		handleCloseCommentPopup,
		handleCommentAdded,
		fetchShareCount,
		fetchComments,
	};
}; 