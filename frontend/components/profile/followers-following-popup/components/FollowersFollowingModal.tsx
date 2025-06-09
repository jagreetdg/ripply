import React from "react";
import {
	View,
	Text,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	ActivityIndicator,
	SafeAreaView,
	Dimensions,
	useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../../context/ThemeContext";
import Colors, { hexToRgba, opacityValues } from "../../../../constants/Colors";
import { UserItem } from "./UserItem";
import { UserType } from "../types";

interface FollowersFollowingModalProps {
	visible: boolean;
	users: UserType[];
	loading: boolean;
	isFollowersTab: boolean;
	currentUserId?: string;
	renderKey: number;
	onClose: () => void;
	onProfilePress: (username: string) => void;
	onFollowChange: (
		userId: string,
		isFollowing: boolean,
		updatedCount?: number
	) => void;
}

export const FollowersFollowingModal: React.FC<
	FollowersFollowingModalProps
> = ({
	visible,
	users,
	loading,
	isFollowersTab,
	currentUserId,
	renderKey,
	onClose,
	onProfilePress,
	onFollowChange,
}) => {
	const { colors, isDarkMode } = useTheme();
	const screenHeight = Dimensions.get("window").height;
	const { width: windowWidth } = useWindowDimensions();

	// Determine responsiveness based on window width
	const isNarrowScreen = windowWidth < 500;
	const isVeryNarrowScreen = windowWidth < 350;

	const getModalWidth = () => {
		if (isVeryNarrowScreen) {
			return "95%";
		} else if (isNarrowScreen) {
			return "90%";
		} else {
			return "80%";
		}
	};

	const handleSafeClose = () => {
		console.log("FollowersFollowingPopup close button pressed");
		onClose();
	};

	const renderUserItem = ({ item }: { item: UserType }) => (
		<UserItem
			user={item}
			currentUserId={currentUserId}
			onProfilePress={onProfilePress}
			onFollowChange={onFollowChange}
		/>
	);

	if (!visible) {
		return null;
	}

	return (
		<View
			key={`followers-modal-${renderKey}`}
			style={[
				styles.modalOverlayAbsolute,
				{
					backgroundColor: isDarkMode
						? colors.modalOverlay
						: hexToRgba(colors.black, opacityValues.semitransparent),
				},
			]}
			onStartShouldSetResponder={() => {
				console.log("FollowersFollowingPopup background press intercepted");
				return true;
			}}
		>
			<View
				style={[
					styles.modalContainer,
					{
						maxHeight: screenHeight * 0.7,
						backgroundColor: colors.background,
						width: getModalWidth(),
					},
				]}
			>
				<SafeAreaView
					style={[styles.container, { backgroundColor: colors.background }]}
				>
					<View style={[styles.header, { borderBottomColor: colors.border }]}>
						<View style={styles.placeholder} />
						<Text style={[styles.title, { color: colors.text }]}>
							{isFollowersTab ? "Followers" : "Following"}
						</Text>
						<TouchableOpacity
							style={styles.closeButton}
							onPress={handleSafeClose}
						>
							<Feather name="x" size={22} color={colors.text} />
						</TouchableOpacity>
					</View>

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={colors.tint} />
						</View>
					) : users.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
								No {isFollowersTab ? "followers" : "following"} yet
							</Text>
						</View>
					) : (
						<FlatList
							data={users}
							renderItem={renderUserItem}
							keyExtractor={(item) => item?.id || Math.random().toString()}
							contentContainerStyle={styles.listContent}
						/>
					)}
				</SafeAreaView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	modalOverlayAbsolute: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 9999,
	},
	modalContainer: {
		borderRadius: 12,
		overflow: "hidden",
		elevation: 5,
		shadowColor: Colors.light.shadow,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		maxWidth: 600,
	},
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 16,
		borderBottomWidth: 1,
	},
	closeButton: {
		padding: 4,
		width: 30,
		height: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
	},
	placeholder: {
		width: 30,
		height: 30,
	},
	loadingContainer: {
		paddingVertical: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 16,
	},
	emptyText: {
		fontSize: 16,
		textAlign: "center",
	},
	listContent: {
		padding: 16,
	},
});
