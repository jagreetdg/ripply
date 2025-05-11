import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
	StyleSheet,
	View,
	Animated,
	Platform,
	TouchableOpacity,
} from "react-native";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { VoiceNotesList } from "../components/profile/VoiceNotesList";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

// Base header heights without insets
const HEADER_HEIGHT_BASE = 250; 
const HEADER_HEIGHT_COLLAPSED_BASE = 60;

export default function ProfileScreen() {
	// Use useRef to maintain the animated value between renders
	const scrollY = useRef(new Animated.Value(0)).current;
	// Memoize the isScrolled state to prevent unnecessary re-renders
	const [isScrolled, setIsScrolled] = useState(false);
	const insets = useSafeAreaInsets();
	
	// Calculate actual header heights including safe area insets
	const HEADER_HEIGHT = HEADER_HEIGHT_BASE + insets.top;
	const HEADER_HEIGHT_COLLAPSED = HEADER_HEIGHT_COLLAPSED_BASE + insets.top;

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

	return (
		<View style={styles.container}>
			{/* Fixed collapsed header */}
			<Animated.View
				style={[
					styles.collapsedHeader,
					{
						opacity: collapsedHeaderOpacity,
						height: HEADER_HEIGHT_COLLAPSED,
						paddingTop: insets.top,
						transform: [
							{
								translateY: scrollY.interpolate({
									inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
									outputRange: [-HEADER_HEIGHT_COLLAPSED, 0],
									extrapolate: "clamp",
								}),
							},
						],
					},
				]}
				pointerEvents={isScrolled ? "auto" : "none"}
			>
				<ProfileHeader userId="@username" isCollapsed postCount={8} />
			</Animated.View>

			{/* Scrollable content */}
			<Animated.ScrollView
				style={{ flex: 1 }}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + 8 }]}
			>
				<Animated.View
					style={[
						styles.expandedHeader,
						{
							opacity: headerOpacity,
							height: HEADER_HEIGHT,
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
						},
					]}
				>
					<ProfileHeader userId="@username" postCount={8} />
				</Animated.View>
				<VoiceNotesList userId="@username" />
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
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 20, // Add some bottom padding
	},
	collapsedHeader: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		zIndex: 10,
		...Platform.select({
			web: {
				boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
			},
			default: {
				elevation: 5,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.2,
				shadowRadius: 4,
			},
		}),
	},
	expandedHeader: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "#fff",
		zIndex: 5,
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
		zIndex: 1000,
		...Platform.select({
			web: {
				boxShadow: "0px 4px 4.65px rgba(0, 0, 0, 0.3)",
			},
			default: {
				elevation: 8,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.3,
				shadowRadius: 4.65,
			},
		}),
	},
});
