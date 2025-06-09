import { useState, useCallback, useRef, useEffect } from "react";
import { Animated, Alert, Share, Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../context/UserContext";
import { useToast } from "../../../components/common/Toast";
import {
	likeVoiceNote,
	unlikeVoiceNote,
	getComments,
	checkLikeStatus,
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
	const { showToast } = useToast();
	const progressContainerRef = useRef<View>(null);

	// Get user ID from context first, then props
	const loggedInUserId = user?.id || currentUserId || userId;

	// Internal state for repost status (when user interacts)
	const [internalRepostedState, setInternalRepostedState] = useState<boolean>(false);
	const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);

	// Determine effective repost status - prioritize user interactions
	const isRepostedEffective = isLoadingRepostStatus
		? false
		: hasUserInteracted 
			? internalRepostedState
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
	const commentScale = useRef(new Animated.Value(1)).current;
	
	// Pulse animation for state changes
	const likePulse = useRef(new Animated.Value(1)).current;
	const sharePulse = useRef(new Animated.Value(1)).current;
	const commentPulse = useRef(new Animated.Value(1)).current;

	// Add comprehensive state logging for debugging
	const logShareState = useCallback((context: string) => {
		console.log(`[SHARE DEBUG] State Snapshot - ${context}:`, {
			voiceNoteId: voiceNote.id,
			// State values
			sharesCount,
			isLoadingShareCount,
			isRepostedEffective,
			internalRepostedState,
			hasUserInteracted,
			// Props
			isRepostedProp,
			isLoadingRepostStatus,
			// User
			loggedInUserId,
			// Voice note data
			voiceNoteShares: voiceNote.shares,
			voiceNoteIsShared: (voiceNote as any).is_shared
		});
	}, [
		voiceNote.id, 
		voiceNote.shares, 
		(voiceNote as any).is_shared,
		sharesCount,
		isLoadingShareCount,
		isRepostedEffective,
		internalRepostedState,
		hasUserInteracted,
		isRepostedProp,
		isLoadingRepostStatus,
		loggedInUserId
	]);

	// Sync with props when user hasn't interacted yet
	useEffect(() => {
		if (!hasUserInteracted && isRepostedProp !== undefined) {
			setInternalRepostedState(Boolean(isRepostedProp));
		}
	}, [isRepostedProp, hasUserInteracted]);

	// Reset interaction flag when voice note changes
	useEffect(() => {
		setHasUserInteracted(false);
		setInternalRepostedState(Boolean(isRepostedProp));
	}, [voiceNote.id, isRepostedProp]);

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

	// Handle like press with optimistic updates
	const handleLikePress = useCallback(async () => {
		if (!loggedInUserId) {
			Alert.alert("Please log in", "You need to be logged in to like voice notes.");
			return;
		}

		// Store original values for potential rollback
		const originalIsLiked = isLiked;
		const originalLikesCount = likesCount;

		// OPTIMISTIC UPDATE: Immediately update UI
		const newIsLiked = !isLiked;
		const newLikesCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
		
		setIsLiked(newIsLiked);
		setLikesCount(newLikesCount);

		// Enhanced like button animation with scale and pulse effects
		const scaleAnimation = Animated.sequence([
			Animated.timing(likeScale, {
				toValue: 1.3,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.spring(likeScale, {
				toValue: 1,
				tension: 200,
				friction: 8,
				useNativeDriver: true,
			}),
		]);

		// Pulse effect for state change
		const pulseAnimation = Animated.sequence([
			Animated.timing(likePulse, {
				toValue: 1.15,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(likePulse, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
		]);

		// Start animations immediately
		Animated.parallel([scaleAnimation, pulseAnimation]).start();

		// API request in background
		try {
			if (originalIsLiked) {
				const result = await unlikeVoiceNote(voiceNote.id, loggedInUserId);
				// Update with server response if different
				if (typeof result.likesCount === 'number' && result.likesCount !== newLikesCount) {
					setLikesCount(result.likesCount);
				}
			} else {
				const result = await likeVoiceNote(voiceNote.id, loggedInUserId);
				// Update with server response if different
				if (typeof result.likesCount === 'number' && result.likesCount !== newLikesCount) {
					setLikesCount(result.likesCount);
				}
			}
		} catch (error) {
			console.error("Error toggling like:", error);
			
			// ROLLBACK: Revert optimistic update
			setIsLiked(originalIsLiked);
			setLikesCount(originalLikesCount);
			
			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			showToast(`Failed to ${originalIsLiked ? 'unlike' : 'like'}: ${errorMessage}`, 'error');
		}
	}, [loggedInUserId, likeScale, likePulse, voiceNote.id, isLiked, likesCount, showToast]);

	// Handle comment press
	const handleCommentPress = useCallback(() => {
		// Animate comment button press
		const scaleAnimation = Animated.sequence([
			Animated.timing(commentScale, {
				toValue: 1.2,
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.spring(commentScale, {
				toValue: 1,
				tension: 180,
				friction: 6,
				useNativeDriver: true,
			}),
		]);

		// Pulse effect
		const pulseAnimation = Animated.sequence([
			Animated.timing(commentPulse, {
				toValue: 1.1,
				duration: 80,
				useNativeDriver: true,
			}),
			Animated.timing(commentPulse, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}),
		]);

		Animated.parallel([scaleAnimation, pulseAnimation]).start();

		setShowCommentPopup(true);
		fetchComments();
	}, [fetchComments, commentScale, commentPulse]);

	// Handle plays press
	const handlePlaysPress = useCallback(() => {
		// Show plays information or navigate to plays list
	}, []);

	// Handle repost press with optimistic updates
	const handleRepostPress = useCallback(async () => {
		if (!loggedInUserId) {
			console.log("[SHARE DEBUG] handleRepostPress - No logged in user, showing alert");
			Alert.alert("Please log in", "You need to be logged in to repost voice notes.");
			return;
		}

		// Store original values for potential rollback
		const originalRepostedState = isRepostedEffective;
		const originalSharesCount = sharesCount;
		const originalHasUserInteracted = hasUserInteracted;

		// OPTIMISTIC UPDATE: Immediately update UI
		const newRepostedState = !isRepostedEffective;
		const newSharesCount = newRepostedState ? sharesCount + 1 : Math.max(0, sharesCount - 1);
		
		setHasUserInteracted(true);
		setInternalRepostedState(newRepostedState);
		setSharesCount(newSharesCount);

		logShareState("Optimistic Update Applied");

		console.log("[SHARE DEBUG] handleRepostPress - Optimistic update:", {
			voiceNoteId: voiceNote.id,
			userId: loggedInUserId,
			oldState: originalRepostedState,
			newState: newRepostedState,
			oldCount: originalSharesCount,
			newCount: newSharesCount
		});

		// Enhanced share button animation with scale and pulse effects
		const scaleAnimation = Animated.sequence([
			Animated.timing(shareScale, {
				toValue: 1.35,
				duration: 160,
				useNativeDriver: true,
			}),
			Animated.spring(shareScale, {
				toValue: 1,
				tension: 220,
				friction: 9,
				useNativeDriver: true,
			}),
		]);

		// Pulse effect for state change
		const pulseAnimation = Animated.sequence([
			Animated.timing(sharePulse, {
				toValue: 1.2,
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.timing(sharePulse, {
				toValue: 1,
				duration: 250,
				useNativeDriver: true,
			}),
		]);

		// Start animations immediately
		Animated.parallel([scaleAnimation, pulseAnimation]).start();

		// API request in background
		try {
			console.log("[SHARE DEBUG] handleRepostPress - Calling toggleRepost API");
			const result = await toggleRepost(voiceNote.id, loggedInUserId);
			console.log("[SHARE DEBUG] handleRepostPress - toggleRepost result:", result);
			
			const serverRepostedState = result.isReposted;
			
			// Update with server response if different from optimistic update
			if (serverRepostedState !== newRepostedState) {
				console.log("[SHARE DEBUG] handleRepostPress - Server state differs, updating:", {
					optimistic: newRepostedState,
					server: serverRepostedState
				});
				setInternalRepostedState(serverRepostedState);
			}
			
			// Update share count from API response (this is the authoritative count)
			if (typeof result.repostCount === "number" && result.repostCount !== newSharesCount) {
				console.log("[SHARE DEBUG] handleRepostPress - Server count differs, updating:", {
					optimistic: newSharesCount,
					server: result.repostCount
				});
				setSharesCount(result.repostCount);
			}
			
			if (onShareStatusChanged) {
				console.log("[SHARE DEBUG] handleRepostPress - Calling onShareStatusChanged callback");
				onShareStatusChanged(voiceNote.id, serverRepostedState);
			}

			if (!serverRepostedState && onVoiceNoteUnshared) {
				console.log("[SHARE DEBUG] handleRepostPress - Voice note unshared, calling callback");
				onVoiceNoteUnshared(voiceNote.id);
			}

			console.log("[SHARE DEBUG] handleRepostPress - Share toggle completed successfully");
			logShareState("After handleRepostPress");
		} catch (error) {
			console.error("[SHARE DEBUG] handleRepostPress - Error:", {
				voiceNoteId: voiceNote.id,
				userId: loggedInUserId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined
			});
			
			// ROLLBACK: Revert optimistic update
			setHasUserInteracted(originalHasUserInteracted);
			setInternalRepostedState(originalRepostedState);
			setSharesCount(originalSharesCount);
			
			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			showToast(`Failed to ${originalRepostedState ? 'unshare' : 'share'}: ${errorMessage}`, 'error');
			
			logShareState("After Rollback");
		}
	}, [loggedInUserId, shareScale, sharePulse, voiceNote.id, isRepostedEffective, sharesCount, hasUserInteracted, onShareStatusChanged, onVoiceNoteUnshared, logShareState, showToast]);

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
			pathname: "/(tabs)/search",
			params: { 
				tag: tag,
				searchType: "tag",
				timestamp: Date.now().toString()
			},
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

	// Voice notes already come with stats data, fetchStats removed to prevent 404 errors

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
		
		// Animation values
		likeScale,
		shareScale,
		commentScale,
		likePulse,
		sharePulse,
		commentPulse,

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