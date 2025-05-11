import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	ImageStyle,
	TouchableOpacity,
	ImageBackground,
	Animated,
	ViewStyle,
	TextStyle,
	Modal,
	Dimensions,
	Pressable,
	Platform,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { getVoiceBio } from "../../services/api/voiceBioService";
import { getDefaultCoverPhoto } from "../../utils/defaultImages";
import { DefaultProfileImage } from "../common/DefaultProfileImage";

interface ProfileHeaderProps {
	userId: string;
	isCollapsed?: boolean;
	postCount?: number;
	displayName: string;
	avatarUrl?: string | null;
	coverPhotoUrl?: string | null;
	bio?: string;
	isVerified?: boolean;
	isOwnProfile?: boolean;
}

interface VoiceBio {
	id: string;
	user_id: string;
	duration: number;
	audio_url: string;
	transcript?: string;
	created_at: string;
	updated_at: string;
}

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function ProfileHeader({
	userId,
	isCollapsed = false,
	postCount = 0,
	displayName,
	avatarUrl = null,
	coverPhotoUrl = null,
	bio = "",
	isVerified = false,
	isOwnProfile = false,
}: ProfileHeaderProps) {
	// Use default cover photo if none is provided
	const effectiveCoverPhotoUrl = coverPhotoUrl || getDefaultCoverPhoto();

	const router = useRouter();
	const [isVoiceBioPlaying, setIsVoiceBioPlaying] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const buttonWidth = useRef(new Animated.Value(32)).current;
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const [wave1] = useState(new Animated.Value(0));
	const [wave2] = useState(new Animated.Value(0));
	const [wave3] = useState(new Animated.Value(0));
	const [modalVisible, setModalVisible] = useState(false);
	const [activePhoto, setActivePhoto] = useState<"profile" | "cover" | null>(
		null
	);
	const [imageAspectRatio, setImageAspectRatio] = useState(1);
	const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
	const [loadingVoiceBio, setLoadingVoiceBio] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Fetch voice bio data
	useEffect(() => {
		const fetchVoiceBio = async () => {
			try {
				setLoadingVoiceBio(true);
				const data = await getVoiceBio(userId);
				setVoiceBio(data as VoiceBio);
			} catch (error) {
				console.log("No voice bio found or error fetching voice bio");
				setVoiceBio(null);
			} finally {
				setLoadingVoiceBio(false);
			}
		};

		fetchVoiceBio();
	}, [userId]);

	// Handle collapsing the voice bio button
	const handleVoiceBioCollapse = useCallback(() => {
		setIsExpanded(false);
		setIsVoiceBioPlaying(false);
		setProgress(0);

		// Animate the button width back to its collapsed state
		Animated.timing(buttonWidth, {
			toValue: 32,
			duration: 300,
			useNativeDriver: false,
		}).start();

		// If there's an audio element, pause it and reset
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	}, [buttonWidth]);

	// Handle voice bio play/pause
	const handleVoiceBioPlayPause = useCallback(() => {
		if (!voiceBio && !loadingVoiceBio) {
			console.log("No voice bio available");
			return;
		}

		setIsVoiceBioPlaying(!isVoiceBioPlaying);

		if (!isExpanded) {
			setIsExpanded(true);

			// Animate the button width to its expanded state
			Animated.timing(buttonWidth, {
				toValue: 240,
				duration: 300,
				useNativeDriver: false,
			}).start();
		}

		// If there's an audio element, play/pause it
		if (audioRef.current) {
			// Add ended event listener if not already added
			if (!audioRef.current.onended) {
				audioRef.current.addEventListener("ended", handleVoiceBioCollapse);
			}

			if (isVoiceBioPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play();
			}
		}
	}, [
		voiceBio,
		isVoiceBioPlaying,
		isExpanded,
		loadingVoiceBio,
		handleVoiceBioCollapse,
	]);

	// Handle seeking start
	const handleSeekStart = () => {
		setIsSeeking(true);
		if (audioRef.current && isVoiceBioPlaying) {
			audioRef.current.pause();
		}
	};

	// Handle seeking end
	const handleSeekEnd = () => {
		setIsSeeking(false);
		if (audioRef.current && isVoiceBioPlaying) {
			audioRef.current.play();
		}
	};

	// Handle seeking
	const handleSeek = (event: any) => {
		if (!isSeeking || !voiceBio) return;

		const { locationX } = event.nativeEvent;
		const progressBarWidth = 180; // Approximate width of the progress bar
		const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));

		setProgress(newProgress);
		if (audioRef.current) {
			audioRef.current.currentTime = newProgress * voiceBio.duration;
		}
	};

	// Handle photo press (profile or cover)
	const handlePhotoPress = (type: "profile" | "cover") => {
		setActivePhoto(type);
		setModalVisible(true);
	};

	// Handle edit photo
	const handleEditPhoto = () => {
		// This would typically open a photo picker or camera
		console.log(`Edit ${activePhoto} photo`);
	};

	// Handle remove photo
	const handleRemovePhoto = () => {
		// This would typically remove the photo
		console.log(`Remove ${activePhoto} photo`);
	};

	// Render the component
	return (
		<View style={styles.container}>
			{/* Cover Photo */}
			<ImageBackground
				source={{ uri: effectiveCoverPhotoUrl }}
				style={[styles.coverPhoto, isCollapsed && styles.collapsedCoverPhoto]}
				resizeMode="cover"
			>
				{isOwnProfile && (
					<TouchableOpacity
						style={styles.editCoverButton}
						onPress={() => handlePhotoPress("cover")}
					>
						<Feather name="edit-2" size={16} color="#FFFFFF" />
					</TouchableOpacity>
				)}

				{/* Profile Avatar */}
				<View style={styles.avatarContainer}>
					{avatarUrl ? (
						<TouchableOpacity onPress={() => handlePhotoPress("profile")}>
							<Image source={{ uri: avatarUrl }} style={styles.avatar} />
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={() => isOwnProfile && handlePhotoPress("profile")}
						>
							<DefaultProfileImage
								userId={userId}
								size={96}
								style={styles.avatar}
							/>
						</TouchableOpacity>
					)}

					{isOwnProfile && (
						<TouchableOpacity
							style={styles.editAvatarButton}
							onPress={() => handlePhotoPress("profile")}
						>
							<Feather name="edit-2" size={14} color="#FFFFFF" />
						</TouchableOpacity>
					)}
				</View>
			</ImageBackground>

			{/* Profile Info */}
			<View style={styles.profileInfo}>
				<View style={styles.nameContainer}>
					<Text style={styles.displayName}>{displayName}</Text>
					{isVerified && (
						<MaterialIcons
							name="verified"
							size={20}
							color="#6B2FBC"
							style={styles.verifiedIcon}
						/>
					)}
				</View>

				{/* Bio */}
				{bio && <Text style={styles.bio}>{bio}</Text>}

				{/* Voice Bio Button */}
				{!isCollapsed && (
					<View style={styles.voiceBioContainer}>
						<Animated.View
							style={[styles.voiceBioButton, { width: buttonWidth }]}
						>
							<TouchableOpacity
								style={styles.voiceBioPlayButton}
								onPress={handleVoiceBioPlayPause}
								disabled={!voiceBio && !loadingVoiceBio}
							>
								{loadingVoiceBio ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<Feather
										name={isVoiceBioPlaying ? "pause" : "play"}
										size={16}
										color="#FFFFFF"
									/>
								)}
							</TouchableOpacity>

							{isExpanded && voiceBio && (
								<View style={styles.voiceBioExpandedContent}>
									<View style={styles.progressBarContainer}>
										<TouchableOpacity
											style={styles.progressBar}
											onPressIn={handleSeekStart}
											onPressOut={handleSeekEnd}
											onPress={handleSeek}
										>
											<View style={styles.progressBarBackground} />
											<View
												style={[
													styles.progressBarFill,
													{ width: `${progress * 100}%` },
												]}
											/>
										</TouchableOpacity>
									</View>
									<Text style={styles.voiceBioDuration}>
										{formatDuration(Math.floor(progress * voiceBio.duration))} /{" "}
										{formatDuration(voiceBio.duration)}
									</Text>
								</View>
							)}
						</Animated.View>
					</View>
				)}
			</View>

			{/* Photo Edit Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setModalVisible(false)}
				>
					<BlurView intensity={10} style={styles.blurView}>
						<Pressable style={styles.modalContent}>
							<Text style={styles.modalTitle}>
								{activePhoto === "profile" ? "Profile Photo" : "Cover Photo"}
							</Text>
							<TouchableOpacity
								style={styles.modalOption}
								onPress={handleEditPhoto}
							>
								<Feather name="edit" size={20} color="#333" />
								<Text style={styles.modalOptionText}>Edit Photo</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.modalOption}
								onPress={handleRemovePhoto}
							>
								<Feather name="trash-2" size={20} color="#FF3B30" />
								<Text style={[styles.modalOptionText, { color: "#FF3B30" }]}>
									Remove Photo
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
						</Pressable>
					</BlurView>
				</Pressable>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	coverPhoto: {
		width: "100%",
		height: 180,
		justifyContent: "flex-end",
		alignItems: "center",
	},
	collapsedCoverPhoto: {
		height: 120,
	},
	avatarContainer: {
		position: "relative",
		marginBottom: -48,
	},
	avatar: {
		width: 96,
		height: 96,
		borderRadius: 48,
		borderWidth: 4,
		borderColor: "#FFFFFF",
	},
	editAvatarButton: {
		position: "absolute",
		right: 0,
		bottom: 0,
		backgroundColor: "#6B2FBC",
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#FFFFFF",
	},
	editCoverButton: {
		position: "absolute",
		top: 16,
		right: 16,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	profileInfo: {
		paddingTop: 56,
		paddingHorizontal: 16,
		paddingBottom: 16,
		backgroundColor: "#FFFFFF",
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	displayName: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333333",
	},
	verifiedIcon: {
		marginLeft: 4,
	},
	bio: {
		fontSize: 14,
		color: "#666666",
		textAlign: "center",
		marginBottom: 16,
	},
	voiceBioContainer: {
		alignItems: "center",
		marginTop: 8,
	},
	voiceBioButton: {
		height: 32,
		backgroundColor: "#6B2FBC",
		borderRadius: 16,
		flexDirection: "row",
		alignItems: "center",
		overflow: "hidden",
	},
	voiceBioPlayButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	voiceBioExpandedContent: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		paddingRight: 12,
	},
	progressBarContainer: {
		flex: 1,
		marginHorizontal: 8,
	},
	progressBar: {
		height: 4,
		borderRadius: 2,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		position: "relative",
	},
	progressBarBackground: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		borderRadius: 2,
	},
	progressBarFill: {
		position: "absolute",
		top: 0,
		left: 0,
		bottom: 0,
		backgroundColor: "#FFFFFF",
		borderRadius: 2,
	},
	voiceBioDuration: {
		fontSize: 10,
		color: "#FFFFFF",
		marginLeft: 4,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "flex-end",
	},
	blurView: {
		flex: 1,
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
	},
	modalOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#EEEEEE",
	},
	modalOptionText: {
		fontSize: 16,
		marginLeft: 12,
	},
	cancelButton: {
		marginTop: 20,
		paddingVertical: 12,
		alignItems: "center",
		backgroundColor: "#F2F2F2",
		borderRadius: 8,
	},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333333",
	},
});
