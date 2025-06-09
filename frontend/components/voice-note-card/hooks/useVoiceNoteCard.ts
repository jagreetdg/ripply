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
	}, [isPlaying, onPlayPress, onPlay, voiceNote.id]);

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

		const newLikedState = !isLiked;
		setIsLiked(newLikedState);
		setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

		try {
			if (newLikedState) {
				await likeVoiceNote(voiceNote.id, loggedInUserId);
			} else {
				await unlikeVoiceNote(voiceNote.id, loggedInUserId);
			}
		} catch (error) {
			console.error("Error updating like status:", error);
			// Revert on error
			setIsLiked(!newLikedState);
			setLikesCount(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
		}
	}, [loggedInUserId, isLiked, likeScale, voiceNote.id]);

	// Handle comment press
	const handleCommentPress = useCallback(() => {
		setShowCommentPopup(true);
		fetchComments();
	}, [fetchComments]);

	// Handle plays press
	const handlePlaysPress = useCallback(() => {
		console.log(`Voice note ${voiceNote.id} has been played ${playsCount} times`);
	}, [voiceNote.id, playsCount]);

	// Handle repost press
	const handleRepostPress = useCallback(async () => {
		if (!loggedInUserId) {
			Alert.alert("Please log in", "You need to be logged in to repost voice notes.");
			return;
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

		try {
			const result = await toggleRepost(voiceNote.id, loggedInUserId);
			const newRepostedState = result.isReposted;
			
			setInternalRepostedState(newRepostedState);
			
			if (onShareStatusChanged) {
				onShareStatusChanged(voiceNote.id, newRepostedState);
			}

			if (!newRepostedState && onVoiceNoteUnshared) {
				onVoiceNoteUnshared(voiceNote.id);
			}

			await fetchShareCount();
		} catch (error) {
			console.error("Error toggling repost:", error);
			Alert.alert("Error", "Failed to update repost status. Please try again.");
		}
	}, [loggedInUserId, shareScale, voiceNote.id, onShareStatusChanged, onVoiceNoteUnshared, fetchShareCount]);

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
		console.log("Tag pressed:", tag);
		router.push({
			pathname: "/search",
			params: { query: `#${tag}` },
		});
	}, [router]);

	// Handle progress bar interactions
	const handleProgressBarPress = useCallback((event: any) => {
		// Implementation for progress bar press
		console.log("Progress bar pressed");
	}, []);

	const handleProgressBarDrag = useCallback((event: any) => {
		// Implementation for progress bar drag
		console.log("Progress bar dragged");
	}, []);

	const handleProgressBarRelease = useCallback(() => {
		// Implementation for progress bar release
		console.log("Progress bar released");
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
			if (!voiceNote.id || !loggedInUserId) return;

			try {
				// Check like status
				const likeStatus = await checkLikeStatus(voiceNote.id, loggedInUserId);
				setIsLiked(likeStatus.isLiked);

				// Check repost status if not provided via props
				if (isRepostedProp === undefined) {
					const repostStatus = await hasUserRepostedVoiceNote(voiceNote.id, loggedInUserId);
					setInternalRepostedState(repostStatus);
				}

				setStatsLoaded(true);
			} catch (error) {
				console.error("Error loading initial data:", error);
			}
		};

		loadInitialData();
	}, [voiceNote.id, loggedInUserId, isRepostedProp]);

	// Fetch stats
	useEffect(() => {
		const fetchStats = async () => {
			if (!voiceNote.id) return;

			try {
				const stats = await getVoiceNoteStats(voiceNote.id);
				setLikesCount(stats.likes);
				setCommentsCount(stats.comments);
				setPlaysCount(normalizePlaysCount(stats.plays));
				setSharesCount(stats.shares);
			} catch (error) {
				console.error(`Error fetching stats for voice note ${voiceNote.id}:`, error);
			}
		};

		fetchStats();
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