import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { PhotoViewerModal } from "../../components/profile/PhotoViewerModal";
import { useProfileEdit } from "../../hooks/profile/useProfileEdit";
import {
	ProfileEditHeader,
	ProfilePhotoSection,
	ProfileEditForm,
} from "../../components/profile/edit";

export default function EditProfileScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { colors, isDarkMode } = useTheme();

	// Use our custom hook for all profile edit logic
	const {
		// State
		mounted,
		displayName,
		setDisplayName,
		bio,
		setBio,
		username,
		setUsername,
		avatarUrl,
		coverPhotoUrl,
		isLoading,
		isCheckingUsername,
		usernameError,
		isUsernameValid,
		photoViewerVisible,
		photoViewerType,
		fadeAnim,
		scaleAnim,

		// Handlers
		handleUsernameChange,
		handleSelectImage,
		handleSelectCoverPhoto,
		handleOpenPhotoViewer,
		handleClosePhotoViewer,
		handlePhotoUpdated,
		handleSave,
	} = useProfileEdit();

	// Handle back navigation
	const handleGoBack = () => {
		if (isLoading) return;
		router.back();
	};

	// Handle save with confirmation
	const handleSaveProfile = async () => {
		const success = await handleSave();
		if (success) {
			// Optionally navigate back after successful save
			// router.back();
		}
	};

	// Don't render until mounted to avoid hydration issues
	if (!mounted) {
		return (
			<View
				style={[styles.container, { backgroundColor: colors.background }]}
			/>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Header */}
			<ProfileEditHeader
				onBack={handleGoBack}
				onSave={handleSaveProfile}
				isLoading={isLoading}
				colors={colors}
				paddingTop={insets.top}
			/>

			{/* Main Content */}
			<View style={styles.content}>
				{/* Photo Section */}
				<ProfilePhotoSection
					userId={username || "user"}
					avatarUrl={avatarUrl}
					coverPhotoUrl={coverPhotoUrl}
					onSelectAvatar={handleSelectImage}
					onSelectCoverPhoto={handleSelectCoverPhoto}
					onOpenPhotoViewer={handleOpenPhotoViewer}
					colors={colors}
					isDarkMode={isDarkMode}
					fadeAnim={fadeAnim}
					scaleAnim={scaleAnim}
				/>

				{/* Form Section */}
				<View style={styles.formSection}>
					<ProfileEditForm
						displayName={displayName}
						setDisplayName={setDisplayName}
						bio={bio}
						setBio={setBio}
						username={username}
						setUsername={setUsername}
						usernameError={usernameError}
						isUsernameValid={isUsernameValid}
						isCheckingUsername={isCheckingUsername}
						colors={colors}
						isDarkMode={isDarkMode}
						onUsernameChange={handleUsernameChange}
					/>
				</View>
			</View>

			{/* Photo Viewer Modal */}
			<PhotoViewerModal
				visible={photoViewerVisible}
				photoType={photoViewerType}
				userId={username || "user"}
				isOwnProfile={true}
				onClose={handleClosePhotoViewer}
				onPhotoUpdated={handlePhotoUpdated}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	formSection: {
		flex: 1,
		marginTop: 60, // Account for avatar overlap
	},
});
