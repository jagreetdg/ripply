import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ImageBackground,
	Animated,
	ViewStyle,
	TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";

interface ProfileHeaderProps {
	userId: string;
	isCollapsed?: boolean;
	postCount?: number;
	name?: string;
}

interface Styles {
	container: ViewStyle;
	coverPhoto: ViewStyle;
	topBar: ViewStyle;
	iconButton: ViewStyle;
	profileInfo: ViewStyle;
	avatarContainer: ViewStyle;
	avatar: ViewStyle;
	defaultAvatar: ViewStyle;
	defaultAvatarText: TextStyle;
	nameContainer: ViewStyle;
	nameGroup: ViewStyle;
	nameRow: ViewStyle;
	name: TextStyle;
	username: TextStyle;
	verifiedBadge: TextStyle;
	biosContainer: ViewStyle;
	bio: TextStyle;
	voiceBioButton: ViewStyle;
	voiceBioContent: ViewStyle;
	iconWrapper: ViewStyle;
	playIcon: TextStyle;
	progressContainer: ViewStyle;
	progressBackground: ViewStyle;
	progressBar: ViewStyle;
	collapseButton: ViewStyle;
	stats: ViewStyle;
	statItem: ViewStyle;
	statNumber: TextStyle;
	statLabel: TextStyle;
	statDivider: ViewStyle;
	collapsedContainer: ViewStyle;
	collapsedContent: ViewStyle;
	collapsedInfo: ViewStyle;
	collapsedNameRow: ViewStyle;
	collapsedName: TextStyle;
	collapsedUsername: TextStyle;
	collapsedPostCount: TextStyle;
	voiceBioButtonPlaying: ViewStyle;
	voiceBioContainer: ViewStyle;
	voiceBioDuration: TextStyle;
}

const DefaultProfilePicture = ({ userId }: { userId: string }) => (
	<View style={styles.defaultAvatar}>
		<Text style={styles.defaultAvatarText}>
			{userId.charAt(1).toUpperCase()}
		</Text>
	</View>
);

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function ProfileHeader({
	userId,
	isCollapsed = false,
	postCount = 0,
	name = "John Doe",
}: ProfileHeaderProps) {
	const router = useRouter();
	const isVerified = true; // This would come from props or API in real app
	const [isVoiceBioPlaying, setIsVoiceBioPlaying] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isSeeking, setIsSeeking] = useState(false);
	const buttonWidth = useRef(new Animated.Value(32)).current;
	const progressInterval = useRef<NodeJS.Timeout | null>(null);
	const [wave1] = useState(new Animated.Value(0));
	const [wave2] = useState(new Animated.Value(0));
	const [wave3] = useState(new Animated.Value(0));

	const handleVoiceBioCollapse = () => {
		setIsExpanded(false);
		setIsVoiceBioPlaying(false);
		setProgress(0);
		if (progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}
		Animated.spring(buttonWidth, {
			toValue: 32,
			useNativeDriver: false,
			friction: 8,
		}).start();
	};

	useEffect(() => {
		if (isVoiceBioPlaying && !isSeeking) {
			progressInterval.current = setInterval(() => {
				setProgress((currentProgress) => {
					const newProgress = currentProgress + 0.01;
					if (newProgress >= 1) {
						handleVoiceBioCollapse();
						return 0;
					}
					return newProgress;
				});
			}, 100); // Update every 100ms for smooth animation
		} else if (!isVoiceBioPlaying && progressInterval.current) {
			clearInterval(progressInterval.current);
			progressInterval.current = null;
		}

		return () => {
			if (progressInterval.current) {
				clearInterval(progressInterval.current);
				progressInterval.current = null;
			}
		};
	}, [isVoiceBioPlaying, isSeeking]);

	const handleVoiceBioPlayPause = () => {
		setIsVoiceBioPlaying(!isVoiceBioPlaying);
		if (!isExpanded) {
			setIsExpanded(true);
			Animated.spring(buttonWidth, {
				toValue: 220,
				useNativeDriver: false,
				friction: 8,
			}).start();
		}
		// TODO: Implement actual audio playback
	};

	const handleSeekStart = () => {
		setIsSeeking(true);
	};

	const handleSeekEnd = () => {
		setIsSeeking(false);
	};

	const handleSeek = (event: any) => {
		if (!isSeeking) return;
		const { locationX } = event.nativeEvent;
		const progressBarWidth = 100; // Width of progress bar
		const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
		setProgress(newProgress);
		// TODO: Implement actual audio seeking
	};

	if (isCollapsed) {
		return (
			<View style={styles.collapsedContainer}>
				<View style={styles.collapsedContent}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.iconButton}
					>
						<Feather name="arrow-left" size={24} color="#666666" />
					</TouchableOpacity>

					<View style={styles.collapsedInfo}>
						<View style={styles.collapsedNameRow}>
							<Text style={styles.collapsedName}>{name}</Text>
							<Text style={styles.collapsedUsername}>{userId}</Text>
						</View>
						<Text style={styles.collapsedPostCount}>
							{postCount} voice notes
						</Text>
					</View>

					<TouchableOpacity style={styles.iconButton}>
						<Feather name="more-vertical" size={24} color="#666666" />
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ImageBackground
				source={{
					uri: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
				}}
				style={styles.coverPhoto}
			>
				<View style={styles.topBar}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.iconButton}
					>
						<Feather name="arrow-left" size={24} color="white" />
					</TouchableOpacity>
					<TouchableOpacity style={styles.iconButton}>
						<Feather name="more-vertical" size={24} color="white" />
					</TouchableOpacity>
				</View>
			</ImageBackground>

			<View style={styles.profileInfo}>
				<View style={styles.avatarContainer}>
					<View style={styles.avatar}>
						<DefaultProfilePicture userId={userId} />
					</View>
				</View>

				<View style={styles.nameContainer}>
					<View style={styles.nameGroup}>
						<View style={styles.nameRow}>
							<Text style={styles.name}>{name}</Text>
							{isVerified && (
								<MaterialIcons
									name="verified"
									size={24}
									color="#6B2FBC"
									style={styles.verifiedBadge}
								/>
							)}
						</View>
						<Text style={styles.username}>{userId}</Text>
						<View style={styles.voiceBioContainer}>
							<TouchableOpacity
								style={[
									styles.voiceBioButton,
									isVoiceBioPlaying && styles.voiceBioButtonPlaying,
								]}
								onPress={handleVoiceBioPlayPause}
								accessibilityLabel={
									isVoiceBioPlaying ? "Pause voice bio" : "Play voice bio"
								}
								accessibilityRole="button"
							>
								<Animated.View
									style={[styles.voiceBioContent, { width: buttonWidth }]}
								>
									<View style={styles.iconWrapper}>
										<Feather
											name={isVoiceBioPlaying ? "pause" : "play"}
											size={16}
											color="#6B2FBC"
											style={styles.playIcon}
										/>
									</View>
									{!isExpanded && (
										<Text style={styles.voiceBioDuration}>
											{formatDuration(45)}
										</Text>
									)}
									{isExpanded && (
										<>
											<View
												style={styles.progressContainer}
												onTouchStart={handleSeekStart}
												onTouchEnd={handleSeekEnd}
												onTouchMove={handleSeek}
											>
												<View style={styles.progressBackground} />
												<View
													style={[
														styles.progressBar,
														{ width: `${progress * 100}%` },
													]}
												/>
											</View>
											<TouchableOpacity
												onPress={handleVoiceBioCollapse}
												style={styles.collapseButton}
											>
												<Feather name="x" size={14} color="#666666" />
											</TouchableOpacity>
										</>
									)}
								</Animated.View>
							</TouchableOpacity>
						</View>
					</View>
				</View>

				<View style={styles.biosContainer}>
					<Text style={styles.bio}>
						My Bio is a very big blob text with all the unnecessary details of
						my life
					</Text>
				</View>
			</View>

			<View style={styles.stats}>
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>2.7m</Text>
					<Text style={styles.statLabel}>Followers</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>{postCount}</Text>
					<Text style={styles.statLabel}>Posts</Text>
				</View>
				<View style={styles.statDivider} />
				<View style={styles.statItem}>
					<Text style={styles.statNumber}>1.9k</Text>
					<Text style={styles.statLabel}>Following</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create<Styles>({
	container: {
		backgroundColor: "#FFFFFF",
	},
	coverPhoto: {
		height: 120,
		justifyContent: "flex-start",
	},
	topBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	iconButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	profileInfo: {
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 8,
		marginTop: -40,
	},
	avatarContainer: {
		padding: 3,
		backgroundColor: "#FFFFFF",
		borderRadius: 54,
		marginBottom: 4,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#E1E1E1",
		overflow: "hidden",
		position: "relative",
	},
	defaultAvatar: {
		width: "100%",
		height: "100%",
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
	},
	defaultAvatarText: {
		color: "white",
		fontSize: 40,
		fontWeight: "bold",
	},
	nameContainer: {
		alignItems: "center",
		marginTop: 4,
		marginBottom: 4,
	},
	nameGroup: {
		alignItems: "center",
		gap: 2,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 0,
	},
	name: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#000000",
	},
	username: {
		fontSize: 15,
		color: "#666666",
		lineHeight: 18,
		textAlign: "center",
		marginBottom: 2,
	},
	verifiedBadge: {
		marginLeft: 6,
		marginTop: 1,
	},
	biosContainer: {
		alignItems: "center",
		width: "100%",
		marginBottom: 8,
		paddingHorizontal: 12,
	},
	bio: {
		color: "#666666",
		fontSize: 14,
		lineHeight: 18,
		textAlign: "center",
	},
	voiceBioContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 6,
	},
	voiceBioButton: {
		backgroundColor: "rgba(107, 47, 188, 0.1)",
		borderRadius: 16,
		height: 32,
		justifyContent: "center",
		alignItems: "flex-start",
		borderWidth: 1,
		borderColor: "rgba(107, 47, 188, 0.2)",
		padding: 0,
		overflow: "hidden",
		marginTop: 6,
	},
	voiceBioButtonPlaying: {
		backgroundColor: "rgba(107, 47, 188, 0.15)",
		borderColor: "rgba(107, 47, 188, 0.3)",
	},
	voiceBioContent: {
		flexDirection: "row",
		alignItems: "center",
		height: "100%",
		minWidth: 80,
	},
	iconWrapper: {
		width: 32,
		height: 32,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	playIcon: {
		marginLeft: 10,
	},
	progressContainer: {
		flex: 1,
		height: 4,
		marginHorizontal: 12,
		borderRadius: 2,
		overflow: "hidden",
		backgroundColor: "rgba(107, 47, 188, 0.1)",
	},
	progressBackground: {
		position: "absolute",
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(107, 47, 188, 0.1)",
	},
	progressBar: {
		height: "100%",
		backgroundColor: "#6B2FBC",
		borderRadius: 2,
	},
	collapseButton: {
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 4,
	},
	stats: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "#E1E1E1",
		paddingHorizontal: 16,
	},
	statItem: {
		alignItems: "center",
		width: "30%",
	},
	statNumber: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	statLabel: {
		color: "#666666",
	},
	statDivider: {
		width: 1,
		height: 30,
		backgroundColor: "#E1E1E1",
		marginHorizontal: 8,
	},
	collapsedContainer: {
		backgroundColor: "#FFFFFF",
		height: 60,
		justifyContent: "center",
	},
	collapsedContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		gap: 16,
	},
	collapsedInfo: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	collapsedNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 2,
	},
	collapsedName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#000000",
	},
	collapsedUsername: {
		fontSize: 14,
		color: "#666666",
	},
	collapsedPostCount: {
		fontSize: 12,
		color: "#666666",
	},
	voiceBioDuration: {
		fontSize: 15,
		color: "#666666",
		marginLeft: 2,
		marginRight: 5,
		marginBottom: 2,
	},
});
