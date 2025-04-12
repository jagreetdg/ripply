import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { FeedItem } from "./FeedItem";

// Mock data for the feed
const MOCK_FEED_ITEMS = [
	{
		id: "1",
		userId: "@sarah_music",
		userName: "Sarah",
		userAvatar: null,
		timePosted: "2h",
		voiceNote: {
			id: "1",
			duration: 120,
			title: "🎵 New song idea - let me know what you think!",
			likes: 2341,
			comments: 156,
			plays: 15723,
			shares: 432,
			backgroundImage:
				"https://images.unsplash.com/photo-1511379938547-c1f69419868d",
		},
	},
	{
		id: "2",
		userId: "@mike_thoughts",
		userName: "Mike",
		userAvatar: null,
		timePosted: "4h",
		voiceNote: {
			id: "2",
			duration: 45,
			title: "Quick life update ✨",
			likes: 892,
			comments: 73,
			plays: 3421,
			shares: 127,
			backgroundImage: null,
		},
	},
	{
		id: "3",
		userId: "@beach_lover",
		userName: "Alex",
		userAvatar: null,
		timePosted: "6h",
		voiceNote: {
			id: "3",
			duration: 180,
			title: "Sunset thoughts at the beach 🌅",
			likes: 1567,
			comments: 89,
			plays: 8932,
			shares: 345,
			backgroundImage:
				"https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
		},
	},
	{
		id: "4",
		userId: "@night_owl",
		userName: "Jamie",
		userAvatar: null,
		timePosted: "10h",
		voiceNote: {
			id: "4",
			duration: 30,
			title: "Late night vibes 🌙",
			likes: 743,
			comments: 42,
			plays: 2156,
			shares: 98,
			backgroundImage:
				"https://images.unsplash.com/photo-1519692933481-e162a57d6721",
		},
	},
	{
		id: "5",
		userId: "@fitness_guru",
		userName: "Taylor",
		userAvatar: null,
		timePosted: "12h",
		voiceNote: {
			id: "5",
			duration: 60,
			title: "Morning motivation 💪",
			likes: 456,
			comments: 28,
			plays: 1893,
			shares: 76,
			backgroundImage: null,
		},
	},
	{
		id: "6",
		userId: "@rainy_days",
		userName: "Jordan",
		userAvatar: null,
		timePosted: "1d",
		voiceNote: {
			id: "6",
			duration: 90,
			title: "Rainy day thoughts 🌧️",
			likes: 921,
			comments: 67,
			plays: 4521,
			shares: 187,
			backgroundImage:
				"https://images.unsplash.com/photo-1519692933481-e162a57d6721",
		},
	},
];

export function HomeFeed() {
	return (
		<View style={styles.container}>
			<View style={styles.feedHeader}>
				<Text style={styles.feedTitle}>For You</Text>
				<View style={styles.underline} />
			</View>

			<View style={styles.feedContent}>
				{MOCK_FEED_ITEMS.map((item) => (
					<FeedItem key={item.id} item={item} />
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	feedHeader: {
		paddingVertical: 12,
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E1E1E1",
	},
	feedTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333333",
	},
	underline: {
		marginTop: 8,
		width: 40,
		height: 3,
		backgroundColor: "#6B2FBC",
		borderRadius: 1.5,
	},
	feedContent: {
		padding: 0,
	},
});
