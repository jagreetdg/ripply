import React, { useRef, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	Animated,
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
	const [containerWidth, setContainerWidth] = useState(0);

	// Calculate responsive tab indicator position
	const translateX = tabIndicatorPosition.interpolate({
		inputRange: [0, 1],
		outputRange: [0, containerWidth / 2],
	});

	// Handle container layout to get actual width
	const handleContainerLayout = (event: any) => {
		const { width } = event.nativeEvent.layout;
		setContainerWidth(width);
	};

	return (
		<View
			style={[styles.tabContainer, { borderBottomColor: colors.border }]}
			onLayout={handleContainerLayout}
		>
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

			{containerWidth > 0 && (
				<Animated.View
					style={[
						styles.tabIndicator,
						{
							backgroundColor: colors.tint,
							width: containerWidth / 2,
							transform: [{ translateX }],
						},
					]}
				/>
			)}
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
		height: 3,
	},
});
