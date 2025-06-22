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
	batchVoiceNoteStats,
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
		// Only use the initial value if it's a valid number > 0, otherwise start with 0 but show loading
		typeof voiceNote.shares === "number" && voiceNote.shares >= 0 ? voiceNote.shares : 0
	);
	const [isLoadingShareCount, setIsLoadingShareCount] = useState(
		// Start with loading if we don't have reliable initial data
		typeof voiceNote.shares !== "number" || !loggedInUserId
	);
	const [showCommentPopup, setShowCommentPopup] = useState(false);
	const [commentsCount, setCommentsCount] = useState(
		typeof voiceNote.comments === "number" && voiceNote.comments > 0 ? voiceNote.comments : 0
	);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);
	const [playsCount, setPlaysCount] = useState(normalizePlaysCount(voiceNote.plays || 0));
	
	// Comprehensive loading state management
	const [isLoadingLikeStatus, setIsLoadingLikeStatus] = useState(false);
	const [isLoadingRepostStatusInternal, setIsLoadingRepostStatusInternal] = useState(false);
	const [isLoadingSharesCount, setIsLoadingSharesCount] = useState(
		// Start with loading if we don't have reliable initial data or user
		typeof voiceNote.shares !== "number" || !loggedInUserId
	);
	const [statsLoaded, setStatsLoaded] = useState(false);
	const [initialDataLoaded, setInitialDataLoaded] = useState(false);

	// Calculate if ALL stats are loading - include shareCount in the calculation
	const isLoadingAllStats = !initialDataLoaded || isLoadingLikeStatus || isLoadingRepostStatusInternal || isLoadingSharesCount || isLoadingShareCount;

	// Animation refs
	const likeScale = useRef(new Animated.Value(1)).current;
	const shareScale = useRef(new Animated.Value(1)).current;
	const commentScale = useRef(new Animated.Value(1)).current;
	
	// Pulse animation for state changes
	const likePulse = useRef(new Animated.Value(1)).current;
	const sharePulse = useRef(new Animated.Value(1)).current;
	const commentPulse = useRef(new Animated.Value(1)).current;

	// State for preventing rapid clicks
	const [isLikeProcessing, setIsLikeProcessing] = useState(false);
	const [isShareProcessing, setIsShareProcessing] = useState(false);



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
		setInitialDataLoaded(false);
		setStatsLoaded(false);
		
		// Reset loading states based on data availability
		const hasValidShares = typeof voiceNote.shares === "number";
		setIsLoadingShareCount(!hasValidShares && !!loggedInUserId);
		setIsLoadingSharesCount(!hasValidShares && !!loggedInUserId);
		
		// Reset share count to initial value
		setSharesCount(hasValidShares && voiceNote.shares >= 0 ? voiceNote.shares : 0);
	}, [voiceNote.id, voiceNote.shares, isRepostedProp, loggedInUserId]);

	// Log state changes for debugging (simplified)
	useEffect(() => {
		console.log(`[SHARE DEBUG] State Change - ${voiceNote.id}:`, {
			sharesCount,
			isRepostedEffective,
			isLoadingAllStats,
			isLoadingShareCount,
			isLoadingSharesCount,
			initialSharesValue: voiceNote.shares,
			hasLoggedInUser: !!loggedInUserId
		});
	}, [voiceNote.id, sharesCount, isRepostedEffective, isLoadingAllStats, isLoadingShareCount, isLoadingSharesCount, voiceNote.shares, loggedInUserId]);

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

	// Handle like press with optimistic updates and debouncing
	const handleLikePress = useCallback(async () => {
		if (!loggedInUserId) {
			Alert.alert("Please log in", "You need to be logged in to like voice notes.");
			return;
		}

		// Prevent rapid clicking
		if (isLikeProcessing) {
			console.log("[LIKE DEBUG] Like already processing, ignoring click");
			return;
		}

		setIsLikeProcessing(true);

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

		// API request in background - use likeVoiceNote for toggle behavior
		try {
			const result = await likeVoiceNote(voiceNote.id, loggedInUserId);
			
			// Only update if the server response differs from our optimistic update
			// This prevents unnecessary state changes that cause visual flickering
			if (result.isLiked !== newIsLiked) {
				console.log(`[LIKE DEBUG] Server state differs from optimistic update, correcting:`, {
					optimistic: newIsLiked,
					server: result.isLiked
				});
				setIsLiked(result.isLiked);
			}
			
			if (typeof result.likesCount === 'number' && result.likesCount !== newLikesCount) {
				console.log(`[LIKE DEBUG] Server count differs from optimistic update, correcting:`, {
					optimistic: newLikesCount,
					server: result.likesCount
				});
				setLikesCount(result.likesCount);
			}
			
			console.log(`Voice note ${result.isLiked ? 'liked' : 'unliked'} successfully`);
		} catch (error) {
			console.error("Error toggling like:", error);
			
			// ROLLBACK: Revert optimistic update on error only
			setIsLiked(originalIsLiked);
			setLikesCount(originalLikesCount);
			
			// Show user-friendly error message
			let errorMessage = 'Unknown error occurred';
			if (error instanceof Error) {
				if (error.message.includes('429') || error.message.includes('already in progress')) {
					errorMessage = 'Please wait a moment before trying again';
				} else {
					errorMessage = error.message;
				}
			}
			showToast(`Failed to ${originalIsLiked ? 'unlike' : 'like'}: ${errorMessage}`, 'error');
		} finally {
			// Re-enable clicking after a short delay
			setTimeout(() => {
				setIsLikeProcessing(false);
			}, 500);
		}
	}, [loggedInUserId, likeScale, likePulse, voiceNote.id, isLiked, likesCount, showToast, isLikeProcessing]);

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

	// Handle repost press with optimistic updates and debouncing
	const handleRepostPress = useCallback(async () => {
		if (!loggedInUserId) {
			Alert.alert("Please log in", "You need to be logged in to share voice notes.");
			return;
		}

		// Prevent rapid clicking
		if (isShareProcessing) {
			console.log("[SHARE DEBUG] Share already processing, ignoring click");
			return;
		}

		setIsShareProcessing(true);

		// Store original values for potential rollback
		const originalHasUserInteracted = hasUserInteracted;
		const originalRepostedState = isRepostedEffective;
		const originalSharesCount = sharesCount;

		// OPTIMISTIC UPDATE: Immediately update UI
		const newRepostedState = !isRepostedEffective;
		const newSharesCount = newRepostedState ? sharesCount + 1 : Math.max(0, sharesCount - 1);
		
		setHasUserInteracted(true);
		setInternalRepostedState(newRepostedState);
		setSharesCount(newSharesCount);

		console.log("[SHARE DEBUG] handleRepostPress - Optimistic update applied:", {
			voiceNoteId: voiceNote.id,
			userId: loggedInUserId,
			originalState: originalRepostedState,
			newState: newRepostedState,
			originalCount: originalSharesCount,
			newCount: newSharesCount
		});

		// Enhanced share button animation
		const scaleAnimation = Animated.sequence([
			Animated.timing(shareScale, {
				toValue: 1.2,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.spring(shareScale, {
				toValue: 1,
				tension: 200,
				friction: 8,
				useNativeDriver: true,
			}),
		]);

		const pulseAnimation = Animated.sequence([
			Animated.timing(sharePulse, {
				toValue: 1.1,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(sharePulse, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
		]);

		Animated.parallel([scaleAnimation, pulseAnimation]).start();

		// API request in background
		try {
			console.log("[SHARE DEBUG] handleRepostPress - Calling toggleRepost API");
			const result = await toggleRepost(voiceNote.id, loggedInUserId);
			console.log("[SHARE DEBUG] handleRepostPress - toggleRepost result:", result);
			
			// Only update if the server response differs from our optimistic update
			// This prevents unnecessary state changes that cause visual flickering
			if (result.isReposted !== newRepostedState) {
				console.log("[SHARE DEBUG] handleRepostPress - Server state differs from optimistic update, correcting:", {
					optimistic: newRepostedState,
					server: result.isReposted
				});
				setInternalRepostedState(result.isReposted);
			}
			
			// Only update count if server response differs from optimistic update
			if (typeof result.repostCount === "number" && result.repostCount !== newSharesCount) {
				console.log("[SHARE DEBUG] handleRepostPress - Server count differs from optimistic update, correcting:", {
					optimistic: newSharesCount,
					server: result.repostCount
				});
				setSharesCount(result.repostCount);
			}
			
			if (onShareStatusChanged) {
				console.log("[SHARE DEBUG] handleRepostPress - Calling onShareStatusChanged callback");
				onShareStatusChanged(voiceNote.id, result.isReposted);
			}

			if (!result.isReposted && onVoiceNoteUnshared) {
				console.log("[SHARE DEBUG] handleRepostPress - Voice note unshared, calling callback");
				onVoiceNoteUnshared(voiceNote.id);
			}

			console.log("[SHARE DEBUG] handleRepostPress - Share toggle completed successfully");
		} catch (error) {
			console.error("[SHARE DEBUG] handleRepostPress - Error:", {
				voiceNoteId: voiceNote.id,
				userId: loggedInUserId,
				error: error instanceof Error ? error.message : String(error),
				errorStack: error instanceof Error ? error.stack : undefined
			});
			
			// ROLLBACK: Revert optimistic update on error only
			setHasUserInteracted(originalHasUserInteracted);
			setInternalRepostedState(originalRepostedState);
			setSharesCount(originalSharesCount);
			
			// Show user-friendly error message
			let errorMessage = 'Unknown error occurred';
			if (error instanceof Error) {
				if (error.message.includes('429') || error.message.includes('already in progress')) {
					errorMessage = 'Please wait a moment before trying again';
				} else {
					errorMessage = error.message;
				}
			}
			showToast(`Failed to ${originalRepostedState ? 'unshare' : 'share'}: ${errorMessage}`, 'error');
		} finally {
			// Re-enable clicking after a short delay
			setTimeout(() => {
				setIsShareProcessing(false);
			}, 500);
		}
	}, [loggedInUserId, shareScale, sharePulse, voiceNote.id, isRepostedEffective, sharesCount, hasUserInteracted, onShareStatusChanged, onVoiceNoteUnshared, showToast, isShareProcessing]);

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

	// Load initial data using batch API
	useEffect(() => {
		const loadInitialData = async () => {
			if (!voiceNote.id || !loggedInUserId) {
				console.log("[BATCH DEBUG] loadInitialData - Missing requirements:", {
					hasVoiceNoteId: !!voiceNote.id,
					hasLoggedInUserId: !!loggedInUserId
				});
							// If no user is logged in, we can still show the card but without personalized data
			if (!loggedInUserId) {
				setInitialDataLoaded(true);
				setStatsLoaded(true);
				// Stop loading states for shares since we'll use the initial data
				setIsLoadingShareCount(false);
				setIsLoadingSharesCount(false);
			}
				return;
			}

			// Prevent multiple calls for the same voice note
			if (initialDataLoaded) {
				console.log("[BATCH DEBUG] loadInitialData - Already loaded, skipping:", voiceNote.id);
				return;
			}
			
			// If we already have valid share data and this is the first load, we might not need to fetch
			const hasValidInitialShares = typeof voiceNote.shares === "number" && voiceNote.shares >= 0;
			if (hasValidInitialShares) {
				console.log("[BATCH DEBUG] loadInitialData - Using valid initial share count:", voiceNote.shares);
			}

			console.log("[BATCH DEBUG] loadInitialData - Starting batch request for voice note:", {
				voiceNoteId: voiceNote.id,
				userId: loggedInUserId,
				isRepostedProp
			});

			try {
				// Set ALL loading states including share icon highlight status
				setIsLoadingLikeStatus(true);
				setIsLoadingRepostStatusInternal(true);
				setIsLoadingSharesCount(true);
				setIsLoadingShareCount(true);

				// Use batch API to fetch all stats efficiently
				const batchResults = await batchVoiceNoteStats(voiceNote.id, loggedInUserId);
				
				console.log("[BATCH DEBUG] Batch results received:", {
					voiceNoteId: voiceNote.id,
					likeStatus: batchResults.likeStatus,
					repostStatus: batchResults.repostStatus,
					shareCount: batchResults.shareCount
				});

				// Update like status
				setIsLiked(batchResults.likeStatus.isLiked);
				setIsLoadingLikeStatus(false);
				console.log("[BATCH DEBUG] Like status loaded:", batchResults.likeStatus.isLiked);

				// Update repost status (only if not provided via props)
				if (isRepostedProp === undefined) {
					console.log("[BATCH DEBUG] loadInitialData - Using repost status from batch:", batchResults.repostStatus);
					setInternalRepostedState(batchResults.repostStatus);
				} else {
					console.log("[BATCH DEBUG] loadInitialData - Using repost status from props:", isRepostedProp);
				}
				setIsLoadingRepostStatusInternal(false);

				// Update share count
				const newShareCount = typeof batchResults.shareCount === "number" ? batchResults.shareCount : 0;
				
				// CONSISTENCY CHECK: If user has reposted but count is 0, fix it
				const userHasReposted = batchResults.repostStatus === true;
				const adjustedShareCount = userHasReposted && newShareCount === 0 ? 1 : newShareCount;
				
				if (adjustedShareCount !== newShareCount) {
					console.warn("[SHARE DEBUG] CONSISTENCY FIX APPLIED:", {
						voiceNoteId: voiceNote.id,
						originalCount: newShareCount,
						adjustedCount: adjustedShareCount,
						userHasReposted,
						reason: "User has reposted but count was 0"
					});
				}
				
				setSharesCount(adjustedShareCount);
				setIsLoadingSharesCount(false);
				console.log("[BATCH DEBUG] Share count loaded:", {
					received: batchResults.shareCount,
					userHasReposted,
					originalCount: newShareCount,
					finalCount: adjustedShareCount,
					voiceNoteId: voiceNote.id
				});

				// Share icon highlight status is determined by repost status, so mark it as loaded too
				setIsLoadingShareCount(false);
				console.log("[BATCH DEBUG] Share icon highlight status loaded");

				setStatsLoaded(true);
				setInitialDataLoaded(true);
				console.log("[BATCH DEBUG] loadInitialData - All initial data loaded successfully via batch");
			} catch (error) {
				console.error("[BATCH DEBUG] loadInitialData - Error:", {
					voiceNoteId: voiceNote.id,
					userId: loggedInUserId,
					error: error instanceof Error ? error.message : String(error)
				});
				// Ensure ALL loading states are reset even on error
				setIsLoadingLikeStatus(false);
				setIsLoadingRepostStatusInternal(false);
				setIsLoadingSharesCount(false);
				setIsLoadingShareCount(false);
				setInitialDataLoaded(true);
				setStatsLoaded(true);
			}
		};

		loadInitialData();
	}, [voiceNote.id, loggedInUserId, isRepostedProp, initialDataLoaded]);

	// ADDITIONAL CONSISTENCY CHECK: Ensure share count reflects repost status
	useEffect(() => {
		// If user has reposted but count is 0, fix it immediately
		if (isRepostedEffective && sharesCount === 0 && !isLoadingSharesCount && !isLoadingShareCount) {
			console.warn("[HOOK CONSISTENCY FIX] User has reposted but count is 0, setting to 1:", {
				voiceNoteId: voiceNote.id,
				isRepostedEffective,
				sharesCount,
				isLoadingSharesCount,
				isLoadingShareCount
			});
			setSharesCount(1);
		}
	}, [isRepostedEffective, sharesCount, isLoadingSharesCount, isLoadingShareCount, voiceNote.id]);

	// Voice notes already come with stats data, fetchStats removed to prevent 404 errors

	// Fetch the actual share count (fallback for individual updates)
	const fetchShareCount = useCallback(async () => {
		if (!voiceNote.id) {
			console.log("[SHARE DEBUG] fetchShareCount - No voice note ID, skipping");
			return;
		}

		try {
			console.log("[SHARE DEBUG] fetchShareCount - Starting individual request for voice note:", voiceNote.id);
			setIsLoadingSharesCount(true);
			const count = await getRepostCount(voiceNote.id);
			console.log("[SHARE DEBUG] fetchShareCount - Received count:", { voiceNoteId: voiceNote.id, count });
			setSharesCount(typeof count === "number" ? count : 0);
			console.log("[SHARE DEBUG] fetchShareCount - Share count state updated:", typeof count === "number" ? count : 0);
		} catch (error) {
			console.error("[SHARE DEBUG] fetchShareCount - Error:", {
				voiceNoteId: voiceNote.id,
				error: error instanceof Error ? error.message : String(error)
			});
		} finally {
			setIsLoadingSharesCount(false);
			console.log("[SHARE DEBUG] fetchShareCount - Loading state set to false");
		}
	}, [voiceNote.id]);

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
		
		// Loading states
		isLoadingAllStats,
		isLoadingLikeStatus,
		isLoadingRepostStatus: isLoadingRepostStatusInternal,
		isLoadingSharesCount,
		initialDataLoaded,
		
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