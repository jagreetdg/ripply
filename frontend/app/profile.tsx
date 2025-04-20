import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
	StyleSheet,
	View,
	Animated,
	Platform,
	TouchableOpacity,
	Text,
	ActivityIndicator,
} from "react-native";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { VoiceNotesList } from "../components/profile/VoiceNotesList";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { getUserProfile, getUserVoiceNotes, getUserFollowers, getUserFollowing } from "../services/api/userService";
import { recordPlay } from "../services/api/voiceNoteService";
import { VoiceNote, VoiceNoteCard } from "../components/profile/VoiceNoteCard";


const HEADER_HEIGHT = 350; // Full header height
const HEADER_HEIGHT_COLLAPSED = 60; // Collapsed header height

interface ProfileScreenProps {
	userId?: string;
}

export default function ProfileScreen({ userId = "d0c028e7-a33c-4d41-a779-5d1e497b12b3" }: ProfileScreenProps) {
	// Use useRef to maintain the animated value between renders
	const scrollY = useRef(new Animated.Value(0)).current;
	// Memoize the isScrolled state to prevent unnecessary re-renders
	const [isScrolled, setIsScrolled] = useState(false);
	const [loading, setLoading] = useState(true);
	type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  cover_photo_url?: string | null;
  is_verified?: boolean;
  followers_count?: number;
  following_count?: number;
};
const [userData, setUserData] = useState<UserProfile | null>(null);
const [userVoiceNotes, setUserVoiceNotes] = useState<VoiceNote[]>([]);
	const [error, setError] = useState<string | null>(null);
	const insets = useSafeAreaInsets();
	
	// userId is now passed as a prop, with a default value if not provided

	// Set up the scroll listener only once when the component mounts
	useEffect(() => {
		const scrollListener = scrollY.addListener(({ value }) => {
			// Only update state if the scrolled status actually changes
			const newIsScrolled = value > 0;
			if (isScrolled !== newIsScrolled) {
				setIsScrolled(newIsScrolled);
			}
		});
		
		// Clean up the listener when the component unmounts
		return () => {
			scrollY.removeListener(scrollListener);
		};
	}, [isScrolled]); // Add isScrolled as a dependency
	
	// Helper function to check if a string is a UUID
	const isUUID = (id: string): boolean => {
		const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidPattern.test(id);
	};

	// Fetch user profile data
	const fetchUserProfile = useCallback(async () => {
		try {
			setLoading(true);
			console.log('Fetching profile for user ID/username:', userId);
			
			// If the ID is not a UUID, it might be a username
			// For now, we'll just try to fetch by ID as our backend expects UUIDs
			if (!isUUID(userId)) {
				console.warn('Received non-UUID user identifier:', userId);
				// In a real app, we would have an endpoint to fetch by username
				// For now, we'll use our default ID as a fallback
				// setUserId(DEFAULT_USER_ID);
			}
			
			const profileData = await getUserProfile(userId);
			
			// Get followers and following counts
			const followersData = await getUserFollowers(userId);
			const followingData = await getUserFollowing(userId);
			
			// Combine all data
			const enrichedProfile = {
				...profileData,
				followers_count: followersData?.length || 0,
				following_count: followingData?.length || 0
			} as UserProfile;
			
			console.log('Fetched user profile:', enrichedProfile);
			setUserData(enrichedProfile);
			setError(null);
		} catch (err) {
			console.error('Error fetching user profile:', err);
			setError('Failed to load user profile');
			// Set fallback data if API fails
			if (!userData) {
				setUserData({
					id: userId,
					username: '@username',
					display_name: 'User',
					bio: 'This is a fallback profile while we connect to the server.',
					avatar_url: null,
				});
			}
		}
	}, [userId]);
	
	// Fetch user voice notes
	const fetchUserVoiceNotes = useCallback(async () => {
		try {
			console.log('Fetching voice notes for user ID:', userId);
			const voiceNotesData = await getUserVoiceNotes(userId);
			console.log('Fetched voice notes:', voiceNotesData);
			setUserVoiceNotes(voiceNotesData);
		} catch (err) {
			console.error('Error fetching user voice notes:', err);
			// Set fallback data if API fails
			if (userVoiceNotes.length === 0) {
				setUserVoiceNotes([
					{
						id: '1',
						title: 'My first voice note',
						duration: 60,
						likes: 42,
						comments: 7,
						plays: 120,
						tags: ['first', 'demo'],
						shares: 0,
						backgroundImage: '',
					},
				]);
			}
		} finally {
			setLoading(false);
		}
	}, [userId]);
	
	// Load data when component mounts
	useEffect(() => {
		fetchUserProfile();
		fetchUserVoiceNotes();
	}, [fetchUserProfile, fetchUserVoiceNotes]);

	// Memoize these values to prevent recalculation on every render
	const headerOpacity = useMemo(() => {
		return scrollY.interpolate({
			inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
			outputRange: [1, 0],
			extrapolate: "clamp",
		});
	}, [scrollY]);

	const collapsedHeaderOpacity = useMemo(() => {
		return scrollY.interpolate({
			inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
			outputRange: [0, 1],
			extrapolate: "clamp",
		});
	}, [scrollY]);

	// Use useCallback to memoize the scroll handler
	const handleScroll = useCallback(
		Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
			useNativeDriver: true,
		}),
		[scrollY]
	);

	const handleNewVoiceNote = useCallback(() => {
		// TODO: Implement voice note recording
		console.log("New voice note");
	}, []);
	
	// Handle playing a voice note
	const handlePlayVoiceNote = useCallback(async (voiceNoteId: string) => {
		try {
			// Record the play in the backend
			await recordPlay(voiceNoteId, userId);
		} catch (err) {
			console.error('Error recording play:', err);
		}
	}, [userId]);
	
	// Handle refresh
	const handleRefresh = useCallback(() => {
		fetchUserProfile();
		fetchUserVoiceNotes();
	}, [fetchUserProfile, fetchUserVoiceNotes]);

	return (
		<View style={styles.container}>
			{/* Fixed collapsed header */}
			<Animated.View
				style={[
					styles.collapsedHeader,
					{
						opacity: collapsedHeaderOpacity,
						height: HEADER_HEIGHT_COLLAPSED + insets.top,
						paddingTop: insets.top,
						transform: [
							{
								translateY: scrollY.interpolate({
									inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
									outputRange: [-(HEADER_HEIGHT_COLLAPSED + insets.top), 0],
									extrapolate: "clamp",
								}),
							},
						],
					},
				]}
				pointerEvents={isScrolled ? "auto" : "none"}
			>
				<ProfileHeader 
					userId={userData?.username || '@username'} 
					isCollapsed 
					postCount={userVoiceNotes?.length || 0} 
					displayName={userData?.display_name || 'User'}
					avatarUrl={userData?.avatar_url}
					coverPhotoUrl={userData?.cover_photo_url}
					bio={userData?.bio}
					isVerified={userData?.is_verified}
				/>
			</Animated.View>

			{/* Scrollable content */}
			<Animated.ScrollView
				onScroll={handleScroll}
				scrollEventThrottle={16}
				contentContainerStyle={styles.scrollContent}
			>
				<Animated.View
					style={{
						opacity: headerOpacity,
						backgroundColor: "#fff",
						...Platform.select({
							ios: {
								shadowOpacity: scrollY.interpolate({
									inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
									outputRange: [0, 0.3],
									extrapolate: "clamp",
								}),
							},
							android: {
								elevation: scrollY.interpolate({
									inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
									outputRange: [0, 4],
									extrapolate: "clamp",
								}),
							},
						}),
					}}
				>
					<ProfileHeader 
					userId={userData?.username || '@username'} 
					postCount={userVoiceNotes?.length || 0} 
					displayName={userData?.display_name || 'User'}
					avatarUrl={userData?.avatar_url}
					coverPhotoUrl={userData?.cover_photo_url}
					bio={userData?.bio}
					isVerified={userData?.is_verified}
				/>
				</Animated.View>
                {/* Stats section - always visible */}
                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{userData?.followers_count || 0}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{userVoiceNotes?.length || 0}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{userData?.following_count || 0}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </View>
                </View>

                {/* Content section */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6B2FBC" />
                        <Text style={styles.loadingText}>Loading profile...</Text>
                    </View>
				) : error ? (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>{error}</Text>
						<TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				) : (
					<VoiceNotesList 
						userId={userData?.id || userId} 
						userName={userData?.display_name || 'User'}
						voiceNotes={userVoiceNotes} 
						onPlayVoiceNote={handlePlayVoiceNote}
						onRefresh={handleRefresh}
					/>
				)}
			</Animated.ScrollView>

			{/* Floating Action Button */}
			<TouchableOpacity
				style={[styles.fab, { bottom: insets.bottom + 16 }]}
				onPress={handleNewVoiceNote}
			>
				<Feather name="mic" size={24} color="white" />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#666',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: '#ff3b30',
		textAlign: 'center',
		marginBottom: 16,
	},
	retryButton: {
		backgroundColor: '#6B2FBC',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
	},
	retryButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
	stats: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 15,
		backgroundColor: '#fff',
		// Removed bottom border as requested
	},
	statItem: {
		alignItems: 'center',
		flex: 1,
	},
	statNumber: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	statLabel: {
		fontSize: 14,
		color: '#666',
		marginTop: 4,
	},
	statDivider: {
		width: 1,
		height: '70%',
		backgroundColor: '#eee',
		alignSelf: 'center',
	},
	scrollContent: {
		flexGrow: 1,
	},
	collapsedHeader: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: HEADER_HEIGHT_COLLAPSED,
		backgroundColor: "#fff",
		zIndex: 1,
	},
	fab: {
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
