import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { hexToRgba, opacityValues } from "../../../constants/Colors";

interface VoiceNoteRepostAttributionProps {
	showRepostAttribution?: boolean;
	sharedBy?: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
	} | null;
	hasBackgroundImage: boolean;
	styles: any;
	colors: any;
	isDarkMode: boolean;
}

export const VoiceNoteRepostAttribution: React.FC<
	VoiceNoteRepostAttributionProps
> = ({
	showRepostAttribution,
	sharedBy,
	hasBackgroundImage,
	styles,
	colors,
	isDarkMode,
}) => {
	const router = useRouter();

	// Only show repost attribution if explicitly requested, there's a reposter, and showRepostAttribution is true
	if (!showRepostAttribution || !sharedBy) {
		return null;
	}

	// Theme-specific colors for repost attribution
	const repostAttributionBackgroundColor = hasBackgroundImage
		? hexToRgba(colors.black, opacityValues.heavy) // Darker background for image voice notes
		: isDarkMode
		? hexToRgba(colors.black, opacityValues.nearsolid) // Darker, more opaque background for dark mode
		: hexToRgba(colors.lightGrey, opacityValues.nearsolid); // Lighter background for light mode

	const repostAttributionTextColor = hasBackgroundImage
		? colors.white // Brighter text for image backgrounds
		: isDarkMode
		? hexToRgba(colors.white, opacityValues.solid) // Light gray text for dark mode
		: colors.text; // Default text color for light mode

	const handleUsernamePress = () => {
		if (sharedBy.username) {
			router.push({
				pathname: "/profile/[username]",
				params: { username: sharedBy.username },
			});
		}
	};

	return (
		<View
			style={[
				styles.repostAttributionContainer,
				hasBackgroundImage && styles.repostAttributionContainerOnImage,
				{ backgroundColor: repostAttributionBackgroundColor },
			]}
		>
			<Feather
				name="repeat"
				size={14}
				color={hasBackgroundImage ? "#FFFFFF" : colors.tint}
				style={{ marginRight: 6 }}
			/>
			<Text
				style={[
					hasBackgroundImage
						? styles.repostAttributionTextOnImage
						: styles.repostAttributionText,
					{ color: repostAttributionTextColor },
				]}
			>
				Reposted by{" "}
				<Text
					style={[
						hasBackgroundImage
							? styles.repostAttributionUsernameOnImage
							: styles.repostAttributionUsername,
						{
							color: hasBackgroundImage ? "#FFFFFF" : colors.tint,
							fontWeight: hasBackgroundImage ? "800" : "700",
						},
					]}
					onPress={handleUsernamePress}
				>
					@{sharedBy.username || "user"}
				</Text>
			</Text>
		</View>
	);
};
