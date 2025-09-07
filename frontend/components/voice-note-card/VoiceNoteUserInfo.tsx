import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { VoiceNoteProfilePicture } from "./VoiceNoteProfilePicture"; // Path remains ./

interface VoiceNoteUserInfoProps {
	styles: any;
	userId: string;
	displayName: string;
	username: string;
	avatarUrl: string | null;
	timePosted?: string;
	hasBackgroundImage: boolean;
	onProfilePress: () => void;
	colors: any;
}

/**
 * Component for the user info header in VoiceNoteCard
 */
export const VoiceNoteUserInfo: React.FC<VoiceNoteUserInfoProps> = ({
	styles,
	userId,
	displayName,
	username,
	avatarUrl,
	timePosted,
	hasBackgroundImage,
	onProfilePress,
	colors,
}) => {
	// Screen width state for responsive behavior
	const [screenWidth, setScreenWidth] = useState(
		Dimensions.get("window").width
	);

	// Threshold for hiding timestamp on narrow screens (380px)
	const NARROW_SCREEN_THRESHOLD = 380;
	const shouldShowTimestamp = screenWidth >= NARROW_SCREEN_THRESHOLD;

	// Listen to screen dimension changes
	useEffect(() => {
		const subscription = Dimensions.addEventListener("change", ({ window }) => {
			setScreenWidth(window.width);
		});

		return () => subscription?.remove();
	}, []);

	// Determine if we should use the "OnImage" variants of styles
	const useOnImageStyles = hasBackgroundImage;

	return (
		<View style={styles.cardHeader}>
			<TouchableOpacity
				style={styles.userInfoContainer}
				onPress={onProfilePress}
			>
				<VoiceNoteProfilePicture
					userId={userId || "user"}
					size={32}
					avatarUrl={avatarUrl}
				/>
				<View style={styles.userInfo}>
					<Text
						style={
							useOnImageStyles ? styles.displayNameOnImage : styles.displayName
						}
					>
						{displayName}
					</Text>
					<Text
						style={useOnImageStyles ? styles.usernameOnImage : styles.username}
					>
						@{username}
					</Text>
				</View>
			</TouchableOpacity>
			<View style={styles.headerActions}>
				{timePosted && shouldShowTimestamp && (
					<Text
						style={
							useOnImageStyles ? styles.timePostedOnImage : styles.timePosted
						}
					>
						{timePosted}
					</Text>
				)}
				<TouchableOpacity style={styles.optionsButton}>
					<Feather
						name="more-horizontal"
						size={16}
						color={useOnImageStyles ? colors.card : colors.tabIconDefault}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};
