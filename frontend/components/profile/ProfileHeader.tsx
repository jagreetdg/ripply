import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ImageBackground,
	Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";

interface ProfileHeaderProps {
	userId: string;
	isCollapsed?: boolean;
	postCount?: number;
}

const DefaultProfilePicture = ({ userId }: { userId: string }) => (
	<View style={styles.defaultAvatar}>
		<Text style={styles.defaultAvatarText}>
			{userId.charAt(1).toUpperCase()}
		</Text>
	</View>
);

export function ProfileHeader({
	userId,
	isCollapsed = false,
	postCount = 0,
}: ProfileHeaderProps) {
	const router = useRouter();
	const isVerified = true; // This would come from props or API in real app
	const [isVoiceBioPlaying, setIsVoiceBioPlaying] = useState(false);
	const [wave1] = useState(new Animated.Value(0));
	const [wave2] = useState(new Animated.Value(0));
	const [wave3] = useState(new Animated.Value(0));

	useEffect(() => {
		if (isVoiceBioPlaying) {
			Animated.loop(
				Animated.sequence([
					Animated.parallel([
						Animated.sequence([
							Animated.timing(wave1, {
								toValue: 1,
								duration: 500,
								useNativeDriver: true,
							}),
							Animated.timing(wave1, {
								toValue: 0,
								duration: 500,
								useNativeDriver: true,
							}),
						]),
						Animated.sequence([
							Animated.timing(wave2, {
								toValue: 1,
								duration: 400,
								useNativeDriver: true,
							}),
							Animated.timing(wave2, {
								toValue: 0,
								duration: 400,
								useNativeDriver: true,
							}),
						]),
						Animated.sequence([
							Animated.timing(wave3, {
								toValue: 1,
								duration: 600,
								useNativeDriver: true,
							}),
							Animated.timing(wave3, {
								toValue: 0,
								duration: 600,
								useNativeDriver: true,
							}),
						]),
					]),
				])
			).start();
		} else {
			wave1.setValue(0);
			wave2.setValue(0);
			wave3.setValue(0);
		}
	}, [isVoiceBioPlaying]);

	const handleVoiceBioPlayPause = () => {
		setIsVoiceBioPlaying(!isVoiceBioPlaying);
		// TODO: Implement actual audio playback
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
						<Text style={styles.collapsedUsername}>{userId}</Text>
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
					<Text style={styles.username}>{userId}</Text>
					{isVerified && (
						<MaterialIcons
							name="verified"
							size={20}
							color="#1DA1F2"
							style={styles.verifiedBadge}
						/>
					)}
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
						<View style={styles.iconWrapper}>
							<Feather
								name={isVoiceBioPlaying ? "pause" : "play"}
								size={16}
								color="#1DA1F2"
							/>
						</View>
					</TouchableOpacity>
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

const styles = StyleSheet.create({
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
		paddingBottom: 12,
		marginTop: -40,
	},
	avatarContainer: {
		padding: 3,
		backgroundColor: "#FFFFFF",
		borderRadius: 54,
		marginBottom: 8,
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
		backgroundColor: "#1DA1F2",
		justifyContent: "center",
		alignItems: "center",
	},
	defaultAvatarText: {
		color: "white",
		fontSize: 40,
		fontWeight: "bold",
	},
	nameContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
		marginBottom: 6,
		gap: 8,
		height: 32,
	},
	username: {
		fontSize: 20,
		fontWeight: "bold",
		lineHeight: 24,
	},
	verifiedBadge: {
		marginLeft: 4,
		alignSelf: "center",
		marginTop: 3,
	},
	biosContainer: {
		alignItems: "center",
		width: "100%",
		marginBottom: 12,
		paddingHorizontal: 16,
	},
	bio: {
		color: "#666666",
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
	},
	voiceBioButton: {
		backgroundColor: "rgba(29, 161, 242, 0.1)",
		borderRadius: 16,
		width: 32,
		height: 32,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(29, 161, 242, 0.2)",
		marginLeft: 4,
		padding: 0,
	},
	voiceBioButtonPlaying: {
		backgroundColor: "rgba(29, 161, 242, 0.15)",
		borderColor: "rgba(29, 161, 242, 0.3)",
	},
	iconWrapper: {
		width: 16,
		height: 16,
		justifyContent: "center",
		alignItems: "center",
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
	},
	collapsedUsername: {
		fontSize: 16,
		fontWeight: "bold",
	},
	collapsedPostCount: {
		fontSize: 12,
		color: "#666666",
	},
});
