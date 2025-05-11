import React, { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	View,
	StyleSheet,
	ScrollView,
	ActivityIndicator,
	Text,
	TouchableOpacity,
	Animated,
	RefreshControl,
} from "react-native";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { VoiceNotesList } from "../../components/profile/VoiceNotesList";
import {
	getUserProfileByUsername,
	getUserVoiceNotes,
	getFollowerCount,
	getFollowingCount,
} from "../../services/api/userService";
import { getVoiceBio } from "../../services/api/voiceBioService";
import { UserNotFound } from "../../components/common/UserNotFound";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { FollowButton } from "../../components/profile/FollowButton";

interface UserProfile {
	id: string;
	username: string;
	display_name: string;
	avatar_url: string | null;
	cover_photo_url: string | null;
	bio: string | null;
	is_verified: boolean;
	created_at: string;
	updated_at: string;
}

interface VoiceNote {
	id: string;
	title: string;
	duration: number;
	likes: number;
	comments: number;
	plays: number;
	users?: {
		id: string;
		username: string;
		display_name: string;
		avatar_url: string | null;
	};
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

export default function ProfileByUsernameScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const params = useLocalSearchParams<{ username: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { user: currentUser } = useUser();

	const [username, setUsername] = useState<string>("");
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
	const [loading, setLoading] = useState(true);
	const [voiceBio, setVoiceBio] = useState<VoiceBio | null>(null);
	const [userNotFound, setUserNotFound] = useState(false);
	const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
	const [isOwnProfile, setIsOwnProfile] = useState(false);
	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const scrollY = useRef(new Animated.Value(0)).current;

	const headerOpacity = useRef(new Animated.Value(1)).current;
	const collapsedHeaderOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (params.username) {
			setUsername(params.username);
		}
	}, [params.username]);

	useEffect(() => {
		if (username) {
			fetchUserData();
		}
	}, [username]);

	useEffect(() => {
		if (currentUser && username) {
			setIsOwnProfile(currentUser.username === username);
		}
	}, [currentUser, username]);

	useEffect(() => {
		const listenerId = scrollY.addListener(({ value }) => {
			const COLLAPSE_THRESHOLD = 120;
			const COLLAPSE_RANGE = 40;
			const progress = Math.max(
				0,
				Math.min(
					1,
					(value - (COLLAPSE_THRESHOLD - COLLAPSE_RANGE)) / COLLAPSE_RANGE
				)
			);

			headerOpacity.setValue(1 - progress);
			collapsedHeaderOpacity.setValue(progress);
			setIsHeaderCollapsed(progress > 0.5);
		});

		return () => {
			scrollY.removeListener(listenerId);
		};
	}, [scrollY]);

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchUserData();
		} finally {
			setRefreshing(false);
		}
	};

	const fetchUserData = async () => {
		setLoading(true);
		try {
			setUserNotFound(false);
			const userData = (await getUserProfileByUsername(
				username
			)) as UserProfile;

			if (!userData) {
				setUserNotFound(true);
				setLoading(false);
				return;
			}

			setUserProfile(userData);
			const voiceNotesData = await getUserVoiceNotes(userData.id);
			setVoiceNotes(voiceNotesData);

			const followers = await getFollowerCount(userData.id);
			const following = await getFollowingCount(userData.id);
			setFollowerCount(followers);
			setFollowingCount(following);

			try {
				const voiceBioData = (await getVoiceBio(userData.id)) as VoiceBio;
				if (voiceBioData) {
					setVoiceBio(voiceBioData);
				}
			} catch (error) {
				console.log("No voice bio found or error fetching voice bio");
			}
		} catch (error) {
			console.error("Error fetching user data:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6B2FBC" />
			</View>
		);
	}

	if (userNotFound) {
		return <UserNotFound username={username} />;
	}

	if (!userProfile) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>
					Could not load user profile. Please try again.
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={[styles.statusBarBackground, { height: insets.top }]} />

			<Animated.View
				style={[
					styles.fixedHeader,
					{
						opacity: collapsedHeaderOpacity,
						top: insets.top,
						height: 60,
					},
				]}
			>
				<View style={styles.headerContent}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Feather name="arrow-left" size={24} color="#333" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>{userProfile.display_name}</Text>
					{isOwnProfile && (
						<TouchableOpacity
							style={styles.editButton}
							onPress={() => router.push("/profile/edit")}
						>
							<Feather name="edit" size={20} color="#6B2FBC" />
						</TouchableOpacity>
					)}
				</View>
			</Animated.View>

			<ScrollView
				style={styles.scrollView}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: false }
				)}
				scrollEventThrottle={8}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor="#6B2FBC"
						colors={["#6B2FBC"]}
					/>
				}
			>
				<Animated.View style={{ opacity: headerOpacity }}>
					<View style={{ paddingTop: insets.top }} />
					<ProfileHeader
						userId={userProfile.username}
						displayName={userProfile.display_name}
						avatarUrl={userProfile.avatar_url}
						coverPhotoUrl={userProfile.cover_photo_url}
						bio={userProfile.bio || undefined}
						isVerified={userProfile.is_verified}
						isCollapsed={false}
						postCount={voiceNotes.length}
						isOwnProfile={isOwnProfile}
					/>
				</Animated.View>

				<View style={styles.statsContainer}>
					<TouchableOpacity style={styles.statsItem}>
						<Text style={styles.statsNumber}>{followingCount}</Text>
						<Text style={styles.statsLabel}>Following</Text>
					</TouchableOpacity>
					<View style={styles.statsDivider} />
					<TouchableOpacity style={styles.statsItem}>
						<Text style={styles.statsNumber}>{voiceNotes.length}</Text>
						<Text style={styles.statsLabel}>Notes</Text>
					</TouchableOpacity>
					<View style={styles.statsDivider} />
					<TouchableOpacity style={styles.statsItem}>
						<Text style={styles.statsNumber}>{followerCount}</Text>
						<Text style={styles.statsLabel}>Followers</Text>
					</TouchableOpacity>
				</View>

				{!isOwnProfile && (
					<View style={styles.followButtonContainer}>
						<FollowButton
							userId={userProfile.id}
							onFollowChange={(isFollowing) => {
								setFollowerCount((prev) =>
									isFollowing ? prev + 1 : Math.max(0, prev - 1)
								);
							}}
						/>
					</View>
				)}

				<VoiceNotesList
					userId={userProfile.id}
					username={userProfile.username}
					displayName={userProfile.display_name}
					voiceNotes={voiceNotes}
				/>
			</ScrollView>

			{isOwnProfile && (
				<TouchableOpacity
					style={[styles.editProfileButton, { bottom: insets.bottom + 16 }]}
					onPress={() => router.push("/profile/edit")}
				>
					<Feather name="edit-2" size={24} color="white" />
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	statusBarBackground: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "#FFFFFF",
		zIndex: 101,
	},
	fixedHeader: {
		position: "absolute",
		left: 0,
		right: 0,
		zIndex: 100,
		backgroundColor: "#FFFFFF",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 3,
	},
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		height: "100%",
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		color: "#6B2FBC",
		fontSize: 18,
		fontWeight: "600",
	},
	editButton: {
		marginLeft: "auto",
		padding: 8,
	},
	scrollView: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "#e74c3c",
		textAlign: "center",
	},
	statsContainer: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
		paddingVertical: 16,
		backgroundColor: "#fff",
	},
	statsItem: {
		alignItems: "center",
		width: "30%",
	},
	statsNumber: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
		color: "#333",
	},
	statsLabel: {
		fontSize: 14,
		color: "#666",
	},
	statsDivider: {
		width: 1,
		height: 30,
		backgroundColor: "#eee",
	},
	followButtonContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: "center",
	},
	editProfileButton: {
		position: "absolute",
		right: 16,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#6B2FBC",
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		zIndex: 1000,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
});
