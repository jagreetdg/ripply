import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ImageBackground,
	Platform,
	Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DefaultAvatar from "../../DefaultAvatar";
import DefaultCoverPhoto from "../../DefaultCoverPhoto";
import { getDefaultCoverPhoto } from "../../../utils/defaultImages";

interface ProfilePhotoSectionProps {
	userId: string;
	avatarUrl: string | null;
	coverPhotoUrl: string | null;
	onSelectAvatar: () => void;
	onSelectCoverPhoto: () => void;
	onOpenPhotoViewer: (type: "profile" | "cover") => void;
	colors: any;
	isDarkMode: boolean;
	fadeAnim: Animated.Value;
	scaleAnim: Animated.Value;
}

// Create a custom hover component for web
const HoverableView = ({
	children,
	onHoverIn,
	onHoverOut,
	style,
	...props
}: any) => {
	// Only add hover styles on web platform
	if (Platform.OS === "web") {
		return (
			<View
				style={[style, { position: "relative" }]}
				onMouseEnter={onHoverIn}
				onMouseLeave={onHoverOut}
				{...props}
			>
				{children}
			</View>
		);
	}

	// Return regular view for mobile platforms
	return (
		<View style={style} {...props}>
			{children}
		</View>
	);
};

export const ProfilePhotoSection: React.FC<ProfilePhotoSectionProps> = ({
	userId,
	avatarUrl,
	coverPhotoUrl,
	onSelectAvatar,
	onSelectCoverPhoto,
	onOpenPhotoViewer,
	colors,
	isDarkMode,
	fadeAnim,
	scaleAnim,
}) => {
	const [isImageHovered, setIsImageHovered] = useState(false);
	const [isCoverHovered, setIsCoverHovered] = useState(false);

	// Dynamic styles that need theme context
	const dynamicStyles = StyleSheet.create({
		avatarContainer: {
			width: 110,
			height: 110,
			borderRadius: 55,
			overflow: "hidden",
			backgroundColor: colors.background,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 3 },
			shadowOpacity: 0.25,
			shadowRadius: 6,
			elevation: 6,
			alignItems: "center",
			justifyContent: "center",
			borderWidth: 1,
			borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
		},
		avatar: {
			width: 100,
			height: 100,
			borderRadius: 50,
			borderWidth: isDarkMode ? 1 : 0,
			borderColor: "rgba(255,255,255,0.2)",
		},
	});

	const defaultCoverPhoto = getDefaultCoverPhoto();

	return (
		<Animated.View
			style={[
				styles.photoSection,
				{
					opacity: fadeAnim,
					transform: [{ scale: scaleAnim }],
				},
			]}
		>
			{/* Cover Photo */}
			<View style={styles.coverPhotoContainer}>
				<HoverableView
					style={styles.coverPhotoWrapper}
					onHoverIn={() => setIsCoverHovered(true)}
					onHoverOut={() => setIsCoverHovered(false)}
				>
					<TouchableOpacity
						style={styles.coverPhotoTouchable}
						onPress={() => onOpenPhotoViewer("cover")}
						activeOpacity={0.8}
					>
						{coverPhotoUrl ? (
							<ImageBackground
								source={{ uri: coverPhotoUrl }}
								style={styles.coverPhoto}
								resizeMode="cover"
							>
								<LinearGradient
									colors={["transparent", "rgba(0,0,0,0.3)"]}
									style={styles.coverGradient}
								/>
							</ImageBackground>
						) : (
							<DefaultCoverPhoto style={styles.coverPhoto} />
						)}

						{/* Cover Photo Overlay */}
						<View
							style={[
								styles.coverPhotoOverlay,
								{
									backgroundColor: isCoverHovered
										? "rgba(0,0,0,0.4)"
										: "rgba(0,0,0,0.2)",
								},
							]}
						>
							<TouchableOpacity
								style={[styles.photoButton, { backgroundColor: colors.card }]}
								onPress={onSelectCoverPhoto}
							>
								<Feather name="camera" size={16} color={colors.text} />
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</HoverableView>

				{/* Avatar positioned over cover photo */}
				<View style={styles.avatarPositioning}>
					<View style={dynamicStyles.avatarContainer}>
						<HoverableView
							style={styles.avatarWrapper}
							onHoverIn={() => setIsImageHovered(true)}
							onHoverOut={() => setIsImageHovered(false)}
						>
							<TouchableOpacity
								style={styles.avatarTouchable}
								onPress={() => onOpenPhotoViewer("profile")}
								activeOpacity={0.8}
							>
								{avatarUrl ? (
									<Image
										source={{ uri: avatarUrl }}
										style={dynamicStyles.avatar}
										resizeMode="cover"
									/>
								) : (
									<DefaultAvatar userId={userId} size={100} />
								)}

								{/* Avatar Overlay */}
								<View
									style={[
										styles.avatarOverlay,
										{
											backgroundColor: isImageHovered
												? "rgba(0,0,0,0.4)"
												: "rgba(0,0,0,0.2)",
										},
									]}
								>
									<TouchableOpacity
										style={[
											styles.photoButton,
											{ backgroundColor: colors.card },
										]}
										onPress={onSelectAvatar}
									>
										<Feather name="camera" size={14} color={colors.text} />
									</TouchableOpacity>
								</View>
							</TouchableOpacity>
						</HoverableView>
					</View>
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	photoSection: {
		marginBottom: 20,
	},
	coverPhotoContainer: {
		position: "relative",
		height: 200,
		borderRadius: 16,
		overflow: "hidden",
	},
	coverPhotoWrapper: {
		flex: 1,
	},
	coverPhotoTouchable: {
		flex: 1,
	},
	coverPhoto: {
		width: "100%",
		height: "100%",
	},
	coverGradient: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		height: 60,
	},
	coverPhotoOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarPositioning: {
		position: "absolute",
		bottom: -55,
		left: 20,
	},
	avatarWrapper: {
		position: "relative",
	},
	avatarTouchable: {
		position: "relative",
	},
	avatarOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
	},
	photoButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 4,
	},
});
