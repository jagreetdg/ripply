import React, { useRef, useState, useEffect } from "react";
import { StyleSheet, View, Animated, Platform } from "react-native";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { VoiceNotesList } from "../components/profile/VoiceNotesList";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 350; // Full header height
const HEADER_HEIGHT_COLLAPSED = 60; // Collapsed header height

export default function ProfileScreen() {
	const scrollY = useRef(new Animated.Value(0)).current;
	const [isScrolled, setIsScrolled] = useState(false);
	const insets = useSafeAreaInsets();

	useEffect(() => {
		const scrollListener = scrollY.addListener(({ value }) => {
			setIsScrolled(value > 0);
		});
		return () => scrollY.removeListener(scrollListener);
	}, []);

	const headerOpacity = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
		outputRange: [1, 0],
		extrapolate: "clamp",
	});

	const collapsedHeaderOpacity = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT - HEADER_HEIGHT_COLLAPSED],
		outputRange: [0, 1],
		extrapolate: "clamp",
	});

	const handleScroll = Animated.event(
		[{ nativeEvent: { contentOffset: { y: scrollY } } }],
		{ useNativeDriver: true }
	);

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			{/* Fixed collapsed header */}
			<Animated.View
				style={[
					styles.collapsedHeader,
					{
						opacity: collapsedHeaderOpacity,
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
					<ProfileHeader userId="@username" postCount={8} />
				</Animated.View>
				<VoiceNotesList userId="@username" />
			</Animated.ScrollView>
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
});
