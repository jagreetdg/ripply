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
} from "react-native";
import { Feather, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { CommentPopup } from "../comments/CommentPopup";
import { recordShare } from "../../services/api/voiceNoteService";

// Development mode flag
const isDev = process.env.NODE_ENV === 'development' || __DEV__;

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
	onProfilePress?: () => void;
	onShare?: (voiceNoteId: string) => void;
	currentUserId?: string;
}

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatNumber = (num: number): string => {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + "m";
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + "k";
	}
	return num.toString();
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
					console.log('Error loading avatar in VoiceNoteCard');
					setImageError(true); // Mark this image as failed
				}}
				// Don't use local assets for default source
				defaultSource={Platform.OS === 'ios' ? { uri: 'https://ui-avatars.com/api/?name=' + (userId || 'U') } : undefined}
			/>
		);
	}
	
	// Fallback to default avatar with first letter
	return (
		<View
			style={[
				styles.defaultAvatar,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
				},
			]}
		>
			<Text style={[styles.defaultAvatarText, { fontSize: size * 0.4 }]}>
				{userId ? userId.charAt(0).toUpperCase() : 'U'}
			</Text>
		</View>
	);
};

export function VoiceNoteCard({
	voiceNote,
	userId,
	displayName,
	username,
	userAvatarUrl,
	timePosted,
	onPlay,
	onProfilePress,
	onShare,
	currentUserId = "550e8400-e29b-41d4-a716-446655440000", // Default user ID
}: VoiceNoteCardProps) {
	const router = useRouter();
	const [isPlaying, setIsPlaying] = useState(false);
	
	// Debug log to check the username value
	console.log('VoiceNoteCard received props:', { userId, displayName, username, userAvatarUrl, voiceNoteUsers: voiceNote.users });
	
	// Ensure we have a valid username for display and navigation
	// If username is undefined, try to extract it from voiceNote.users
	const effectiveUsername = username || voiceNote.users?.username || (displayName ? displayName.toLowerCase().replace(/\s+/g, '') : 'user');
	console.log('Using effectiveUsername:', effectiveUsername);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(typeof voiceNote.likes === 'number' ? voiceNote.likes : 0);
	const [sharesCount, setSharesCount] = useState(typeof voiceNote.shares === 'number' ? voiceNote.shares : 0);
	const [isShared, setIsShared] = useState(false);
	const [showCommentPopup, setShowCommentPopup] = useState(false);
	const [commentsCount, setCommentsCount] = useState(typeof voiceNote.comments === 'number' ? voiceNote.comments : 0);
	const progressContainerRef = useRef<View>(null);
	const likeScale = useRef(new Animated.Value(1)).current;
	const shareScale = useRef(new Animated.Value(1)).current;

	// Handle navigation to user profile
	const handleProfilePress = useCallback(() => {
		// Use the provided onProfilePress prop if available
		if (onProfilePress) {
			onProfilePress();
		} else if (effectiveUsername) {
			// Navigate to the profile by username
			console.log('Navigating to profile by username:', effectiveUsername);
			// Use the href property instead of a template string to avoid parameter conflicts
			router.push({
				pathname: '/profile/[username]',
				params: { username: effectiveUsername }
			});
		} else if (userId) {
			// Fallback to userId if username is not available
			console.log('Navigating to user profile with UUID:', userId);
			router.push({
				pathname: '/[userId]',
				params: { userId }
			});
		} else {
			// If no userId or username is provided, navigate to a default profile
			router.push('/profile/user');
		}
	}, [router, userId, username, onProfilePress]);

	// Handle like button press
	const handleLikePress = useCallback(() => {
		// Toggle like state
		setIsLiked(prevState => {
			const newLikeState = !prevState;

			// Update likes count
			setLikesCount(prevCount => newLikeState ? prevCount + 1 : prevCount - 1);

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
	}, [likeScale]);

	// Handle comment button press
	const handleCommentPress = useCallback(() => {
		setShowCommentPopup(true);
	}, []);

	// Handle comment added
	const handleCommentAdded = useCallback(() => {
		setCommentsCount(prevCount => prevCount + 1);
	}, []);

	// Handle plays button press
	const handlePlaysPress = useCallback(() => {
		// TODO: Implement plays functionality
		console.log("Plays button pressed");
		// This might show who listened to the voice note
	}, []);

	// Handle share button press (retweet-style)
	const handleSharePress = useCallback(() => {
		// Toggle shared state
		setIsShared(prevState => {
			const newSharedState = !prevState;

			// Update shares count locally
			setSharesCount(prevCount => newSharedState ? prevCount + 1 : prevCount - 1);

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

			// Record the share in the backend
			if (newSharedState && onShare) {
				onShare(voiceNote.id);
			} else if (newSharedState) {
				recordShare(voiceNote.id, currentUserId)
					.catch(error => {
						console.error('Error recording share:', error);
						// Revert the UI change if the API call fails
						setIsShared(false);
						setSharesCount(prevCount => prevCount - 1);
					});
			}

			return newSharedState;
		});
	}, [shareScale, voiceNote.id, currentUserId, onShare]);

	// Handle system share (native share sheet)
	const handleSystemShare = useCallback(async () => {
		try {
			const result = await Share.share({
				message: `Check out this voice note: ${voiceNote.title}`,
				url: `https://ripply.app/voice-notes/${voiceNote.id}`,
				title: voiceNote.title,
			});

			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					// Shared with activity type of result.activityType
					console.log(`Shared with ${result.activityType}`);
				} else {
					// Shared
					console.log('Shared');
				}
			} else if (result.action === Share.dismissedAction) {
				// Dismissed
				console.log('Share dismissed');
			}
		} catch (error) {
			Alert.alert('Error', 'Something went wrong while sharing');
		}
	}, [voiceNote.id, voiceNote.title]);

	// Handle play/pause button press
	const handlePlayPause = useCallback(() => {
		setIsPlaying(prev => !prev);
		if (onPlay) {
			onPlay();
		}
	}, [onPlay]);

	// Calculate progress based on touch position
	const calculateProgress = useCallback((pageX: number) => {
		if (progressContainerRef.current) {
			progressContainerRef.current.measure((x, y, width, height, pageXOffset, pageYOffset) => {
				const containerStart = pageXOffset;
				const newProgress = Math.max(0, Math.min(1, (pageX - containerStart) / width));
				setProgress(newProgress);
			});
		}
	}, []);

	// Handle seek start
	const handleSeekStart = useCallback((event: any) => {
		setIsSeeking(true);
		calculateProgress(event.nativeEvent.pageX);
	}, [calculateProgress]);

	// Handle seek move
	const handleSeekMove = useCallback((event: any) => {
		if (isSeeking) {
			calculateProgress(event.nativeEvent.pageX);
		}
	}, [isSeeking, calculateProgress]);

	// Handle seek end
	const handleSeekEnd = useCallback(() => {
		setIsSeeking(false);
	}, []);

	// Render progress bar
	const renderProgressBar = useCallback(() => (
		<View
			ref={progressContainerRef}
			style={styles.progressContainer}
		>
			<View style={styles.progressBackground} />
			<View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
			<Pressable
				style={styles.progressHitSlop}
				onPressIn={handleSeekStart}
				onTouchMove={handleSeekMove}
				onPressOut={handleSeekEnd}
			/>
		</View>
	), [progress, handleSeekStart, handleSeekMove, handleSeekEnd]);

	// Render the card with or without background image
	if (!voiceNote.backgroundImage) {
		return (
			<>
				<View style={[styles.container, styles.plainContainer]}>
					<View style={styles.content}>
						{/* User info and options header */}
						{(userId || displayName) && (
							<View style={styles.cardHeader}>
								<TouchableOpacity style={styles.userInfoContainer} onPress={handleProfilePress}>
									<DefaultProfilePicture 
										userId={userId || "user"} 
										size={32} 
										avatarUrl={userAvatarUrl || voiceNote.userAvatarUrl || null}
									/>
									<View style={styles.userInfo}>
										<Text style={styles.displayName}>{displayName || "User"}</Text>
										<Text style={styles.username}>@{effectiveUsername}</Text>
									</View>
								</TouchableOpacity>
								<View style={styles.headerActions}>
									{timePosted && <Text style={styles.timePosted}>{timePosted}</Text>}
									<TouchableOpacity style={styles.optionsButton}>
										<Feather name="more-horizontal" size={16} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
									</TouchableOpacity>
								</View>
							</View>
						)}
						<Text style={styles.title}>{voiceNote.title}</Text>

						<View style={styles.playerContainer}>
							<TouchableOpacity
								onPress={handlePlayPause}
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
										textShadowRadius: 1
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
									<TouchableOpacity key={index} style={styles.tagItem} activeOpacity={0.7}>
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
									{isLiked ? (
										<Animated.View style={{ transform: [{ scale: likeScale }] }}>
											<FontAwesome name="heart" size={18} color="#FF4D67" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
										</Animated.View>
									) : (
										<Feather name="heart" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
									)}
									<Text style={[styles.interactionText, isLiked && styles.likedText]}>
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
									<Feather name="message-circle" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
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
									<Feather name="headphones" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
									<Text style={styles.interactionText}>
										{formatNumber(voiceNote.plays || 0)}
									</Text>
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.interactionButton}
								activeOpacity={0.7}
								onPress={handleSharePress}
							>
								<View style={styles.interactionContent}>
									{isShared ? (
										<Animated.View style={{ transform: [{ scale: shareScale }] }}>
											<Feather name="repeat" size={18} color="#4CAF50" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
										</Animated.View>
									) : (
										<Feather name="repeat" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
									)}
									<Text style={[styles.interactionText, isShared && styles.sharedText]}>
										{formatNumber(sharesCount)}
									</Text>
								</View>
							</TouchableOpacity>
						</View>
					</View>
				</View>
				
				{/* Comment Popup */}
				<CommentPopup
					visible={showCommentPopup}
					voiceNoteId={voiceNote.id}
					currentUserId={currentUserId}
					onClose={() => setShowCommentPopup(false)}
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
				<View style={styles.content}>
					{/* User info and options header */}
					{(userId || displayName) && (
						<View style={styles.cardHeader}>
							<TouchableOpacity style={styles.userInfoContainer} onPress={handleProfilePress}>
								<DefaultProfilePicture 
									userId={userId || "@user"} 
									size={32} 
									avatarUrl={userAvatarUrl || voiceNote.userAvatarUrl || null}
								/>
								<View style={styles.userInfo}>
									<Text style={styles.displayName}>{displayName || "User"}</Text>
									<Text style={styles.username}>@{username || "user"}</Text>
								</View>
							</TouchableOpacity>
							<View style={styles.headerActions}>
								{timePosted && <Text style={styles.timePosted}>{timePosted}</Text>}
								<TouchableOpacity style={styles.optionsButton}>
									<Feather name="more-horizontal" size={16} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
								</TouchableOpacity>
							</View>
						</View>
					)}
					<Text style={styles.title}>{voiceNote.title}</Text>

					<View style={styles.playerContainer}>
						<TouchableOpacity
							onPress={handlePlayPause}
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
									textShadowRadius: 1
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
								<TouchableOpacity key={index} style={styles.tagItem} activeOpacity={0.7}>
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
								{isLiked ? (
									<Animated.View style={{ transform: [{ scale: likeScale }] }}>
										<FontAwesome name="heart" size={18} color="#FF4D67" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
									</Animated.View>
								) : (
									<Feather name="heart" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
								)}
								<Text style={[styles.interactionText, isLiked && styles.likedText]}>
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
								<Feather name="message-circle" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
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
								<Feather name="headphones" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
								<Text style={styles.interactionText}>
									{formatNumber(voiceNote.plays || 0)}
								</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.interactionButton}
							activeOpacity={0.7}
							onPress={handleSharePress}
						>
							<View style={styles.interactionContent}>
								{isShared ? (
									<Animated.View style={{ transform: [{ scale: shareScale }] }}>
										<Feather name="repeat" size={18} color="#4CAF50" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
									</Animated.View>
								) : (
									<Feather name="repeat" size={18} color="#666666" style={{textShadowColor: "#FFFFFF", textShadowOffset: {width: 0.5, height: 0.5}, textShadowRadius: 1}} />
								)}
								<Text style={[styles.interactionText, isShared && styles.sharedText]}>
									{formatNumber(sharesCount)}
								</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</ImageBackground>
			
			{/* Comment Popup */}
			<CommentPopup
				visible={showCommentPopup}
				voiceNoteId={voiceNote.id}
				currentUserId={currentUserId}
				onClose={() => setShowCommentPopup(false)}
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
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
	},
	interactionButton: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 8,
		marginHorizontal: 12,
		width: 60,
	},
	interactionContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: 60,
	},
	interactionText: {
		fontSize: 14,
		color: "#666666",
		marginLeft: 6,
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
	defaultAvatar: {
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#fff",
	},
	defaultAvatarText: {
		color: "white",
		fontWeight: "bold",
		textShadowColor: "#000000",
		textShadowOffset: { width: 0.5, height: 0.5 },
		textShadowRadius: 1,
	},
});
