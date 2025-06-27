import { useState, useCallback, useRef, useEffect } from "react";
import { Animated, View } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../context/UserContext";
import { useToast } from "../../../components/common/Toast";
import {
	getComments,
	recordPlay,
} from "../../../services/api";
import { VoiceNoteCardProps, Comment, CommentsResponse } from "../VoiceNoteCardTypes";
import { normalizePlaysCount } from "../VoiceNoteCardUtils";

/**
 * Simplified version of useVoiceNoteCard that only handles:
 * - Audio playback state
 * - Comments functionality
 * - Navigation and UI state
 * - NOT like/share interactions (handled by dedicated hooks)
 */
export const useVoiceNoteCardSimple = ({
	voiceNote,
	userId,
	currentUserId,
	onPlay,
	onPlayPress,
	onProfilePress,
	onUserProfilePress,
}: Pick<VoiceNoteCardProps, 
	"voiceNote" | "userId" | "currentUserId" |
	"onPlay" | "onPlayPress" | "onProfilePress" | "onUserProfilePress"
>) => {
	const router = useRouter();
	const { user } = useUser();
	const { showToast } = useToast();
	const progressContainerRef = useRef<View>(null);

	// Get user ID from context first, then props
	const loggedInUserId = user?.id || currentUserId || userId;

	// Audio state
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);

	// Comments state
	const [showCommentPopup, setShowCommentPopup] = useState(false);
	const [commentsCount, setCommentsCount] = useState(
		typeof voiceNote.comments === "number" && voiceNote.comments > 0 ? voiceNote.comments : 0
	);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoadingComments, setIsLoadingComments] = useState(false);

	// Plays count (display only)
	const [playsCount, setPlaysCount] = useState(normalizePlaysCount(voiceNote.plays || 0));

	// Animation refs (only for comments - like/share handled by their hooks)
	const commentScale = useRef(new Animated.Value(1)).current;
	const commentPulse = useRef(new Animated.Value(1)).current;

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

	// Handle comment press with animation
	const handleCommentPress = useCallback(() => {
		// Enhanced comment button animation
		const scaleAnimation = Animated.sequence([
			Animated.timing(commentScale, {
				toValue: 1.2,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.spring(commentScale, {
				toValue: 1,
				tension: 200,
				friction: 8,
				useNativeDriver: true,
			}),
		]);

		const pulseAnimation = Animated.sequence([
			Animated.timing(commentPulse, {
				toValue: 1.1,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(commentPulse, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
		]);

		Animated.parallel([scaleAnimation, pulseAnimation]).start();

		setShowCommentPopup(true);
		fetchComments();
	}, [commentScale, commentPulse, fetchComments]);

	// Handle plays button press (no special functionality for now)
	const handlePlaysPress = useCallback(() => {
		console.log("Plays pressed - no special action for now");
	}, []);

	// Handle tag press
	const handleTagPress = useCallback((tag: string) => {
		router.push(`/search?query=%23${encodeURIComponent(tag)}`);
	}, [router]);

	// Handle progress bar interactions
	const handleProgressBarPress = useCallback((event: any) => {
		// Implementation for progress bar press
		// Calculate position based on touch event and container width
		if (progressContainerRef.current && event.nativeEvent) {
			const { locationX } = event.nativeEvent;
			// Layout measurement would be needed here for accurate calculation
			console.log('Progress bar pressed at:', locationX);
		}
	}, []);

	const handleProgressBarDrag = useCallback((event: any) => {
		// Implementation for progress bar drag
		setIsSeeking(true);
		// Update progress based on drag position
	}, []);

	const handleProgressBarRelease = useCallback(() => {
		// Implementation for progress bar release
		setIsSeeking(false);
		// Seek to the final position
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

	return {
		// User info
		loggedInUserId,
		
		// Audio state
		isPlaying,
		progress,
		isSeeking,
		progressContainerRef,
		
		// Comments state
		showCommentPopup,
		commentsCount,
		comments,
		isLoadingComments,
		
		// Display state
		playsCount,
		
		// Animation values (comments only)
		commentScale,
		commentPulse,
		
		// Handlers
		handlePlayPress,
		handleProfilePress,
		handleCommentPress,
		handlePlaysPress,
		handleTagPress,
		handleProgressBarPress,
		handleProgressBarDrag,
		handleProgressBarRelease,
		handleCloseCommentPopup,
		handleCommentAdded,
	};
}; 