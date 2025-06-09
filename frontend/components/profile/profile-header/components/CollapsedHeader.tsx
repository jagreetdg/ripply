import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useTheme } from "../../../../context/ThemeContext";
import DefaultAvatar from "../../../DefaultAvatar";
import { CollapsedHeaderProps } from "../types";

export const CollapsedHeader: React.FC<CollapsedHeaderProps> = ({
	userId,
	displayName,
	username,
	isVerified,
	localAvatarUrl,
	onHeaderPress,
	onBackPress,
}) => {
	const { colors, isDarkMode } = useTheme();

	return (
		<BlurView
			intensity={80}
			tint={isDarkMode ? "dark" : "light"}
			style={[
				styles.collapsedContainer,
				{
					backgroundColor: isDarkMode
						? "rgba(20, 20, 20, 0.7)"
						: "rgba(255, 255, 255, 0.7)",
					borderBottomColor: isDarkMode
						? "rgba(255, 255, 255, 0.1)"
						: "rgba(0, 0, 0, 0.1)",
					shadowColor: colors.shadow,
				},
			]}
		>
			<TouchableOpacity
				onPress={onBackPress}
				style={[styles.iconButton, { backgroundColor: "transparent" }]}
			>
				<Feather name="arrow-left" size={24} color={colors.text} />
			</TouchableOpacity>

			{/* Scroll-to-top area - everything except the back button */}
			<TouchableOpacity
				onPress={onHeaderPress}
				activeOpacity={0.7}
				style={styles.collapsedContent}
			>
				<View
					style={[
						styles.avatarSmallContainer,
						{
							backgroundColor: colors.background,
							borderColor: isDarkMode
								? "rgba(255,255,255,0.15)"
								: "rgba(0,0,0,0.05)",
						},
					]}
				>
					{localAvatarUrl ? (
						<Image
							source={{ uri: localAvatarUrl }}
							style={styles.avatarSmall}
							resizeMode="cover"
						/>
					) : (
						<DefaultAvatar userId={userId} size={40} />
					)}
				</View>
				<View style={styles.collapsedInfo}>
					<View style={styles.collapsedNameRow}>
						<Text style={[styles.collapsedName, { color: colors.text }]}>
							{displayName}
						</Text>
						{isVerified && (
							<MaterialIcons
								name="verified"
								size={16}
								color={colors.tint}
								style={styles.verifiedBadge}
							/>
						)}
					</View>
					<Text
						style={[styles.collapsedUsername, { color: colors.textSecondary }]}
					>
						@{username}
					</Text>
				</View>
			</TouchableOpacity>

			{/* Right space to balance the layout */}
			<View style={styles.collapsedRightSpace} />
		</BlurView>
	);
};

const styles = StyleSheet.create({
	collapsedContainer: {
		borderBottomWidth: 1,
		flexDirection: "row",
		padding: 16,
		alignItems: "center",
		justifyContent: "space-between",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 3,
		zIndex: 100,
	},
	iconButton: {
		padding: 8,
	},
	collapsedContent: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		justifyContent: "center",
		transform: [{ translateX: -8 }],
	},
	avatarSmallContainer: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		borderWidth: 1,
	},
	avatarSmall: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	collapsedInfo: {
		marginLeft: 12,
		alignItems: "flex-start",
	},
	collapsedNameRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	collapsedName: {
		fontSize: 16,
		fontWeight: "600",
		marginRight: 4,
	},
	collapsedUsername: {
		fontSize: 14,
	},
	verifiedBadge: {
		marginLeft: 4,
		marginTop: 2,
	},
	collapsedRightSpace: {
		width: 32,
	},
});
