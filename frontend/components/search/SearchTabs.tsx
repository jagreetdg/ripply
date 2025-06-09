import React, { useRef } from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	Animated,
	Dimensions,
} from "react-native";
import { SearchTab } from "../../hooks/useSearch";

interface SearchTabsProps {
	activeTab: SearchTab;
	onTabChange: (tab: SearchTab) => void;
	tabIndicatorPosition: Animated.Value;
	colors: {
		background: string;
		tint: string;
		border: string;
		text: string;
		textSecondary: string;
	};
}

export const SearchTabs = ({
	activeTab,
	onTabChange,
	tabIndicatorPosition,
	colors,
}: SearchTabsProps) => {
	const windowWidth = Dimensions.get("window").width;

	// Calculate tab indicator position for animation
	const translateX = tabIndicatorPosition.interpolate({
		inputRange: [0, 1],
		outputRange: [0, windowWidth / 2],
	});

	return (
		<View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
			<TouchableOpacity
				style={[
					styles.tabButton,
					activeTab === "posts" ? styles.activeTab : null,
				]}
				onPress={() => onTabChange("posts")}
			>
				<Text
					style={[
						styles.tabText,
						{
							color: activeTab === "posts" ? colors.tint : colors.textSecondary,
						},
					]}
				>
					Posts
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[
					styles.tabButton,
					activeTab === "users" ? styles.activeTab : null,
				]}
				onPress={() => onTabChange("users")}
			>
				<Text
					style={[
						styles.tabText,
						{
							color: activeTab === "users" ? colors.tint : colors.textSecondary,
						},
					]}
				>
					Users
				</Text>
			</TouchableOpacity>

			<Animated.View
				style={[
					styles.tabIndicator,
					{
						backgroundColor: colors.tint,
						transform: [{ translateX }],
					},
				]}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	tabContainer: {
		flexDirection: "row",
		borderBottomWidth: 1,
		marginBottom: 16,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
	},
	activeTab: {
		// Active tab styles
	},
	tabText: {
		fontSize: 16,
		fontWeight: "600",
	},
	tabIndicator: {
		position: "absolute",
		bottom: 0,
		width: Dimensions.get("window").width / 2,
		height: 3,
	},
});
