import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface ProfileEditFormProps {
	displayName: string;
	setDisplayName: (value: string) => void;
	bio: string;
	setBio: (value: string) => void;
	username: string;
	setUsername: (value: string) => void;
	usernameError: string;
	isUsernameValid: boolean;
	isCheckingUsername: boolean;
	colors: any;
	isDarkMode: boolean;
	onUsernameChange: (text: string) => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
	displayName,
	setDisplayName,
	bio,
	setBio,
	username,
	setUsername,
	usernameError,
	isUsernameValid,
	isCheckingUsername,
	colors,
	isDarkMode,
	onUsernameChange,
}) => {
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.keyboardAvoidingView}
		>
			<ScrollView
				style={styles.formContainer}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{/* Display Name Field */}
				<View style={styles.fieldContainer}>
					<Text style={[styles.label, { color: colors.text }]}>
						Display Name
					</Text>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
								color: colors.text,
							},
						]}
						value={displayName}
						onChangeText={setDisplayName}
						placeholder="Enter your display name"
						placeholderTextColor={colors.textSecondary}
						maxLength={50}
					/>
				</View>

				{/* Username Field */}
				<View style={styles.fieldContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Username</Text>
					<View style={styles.usernameContainer}>
						<TextInput
							style={[
								styles.input,
								styles.usernameInput,
								{
									backgroundColor: colors.card,
									borderColor: usernameError
										? colors.error
										: isUsernameValid
										? colors.success
										: colors.border,
									color: colors.text,
								},
							]}
							value={username}
							onChangeText={onUsernameChange}
							placeholder="Enter your username"
							placeholderTextColor={colors.textSecondary}
							autoCapitalize="none"
							autoCorrect={false}
							maxLength={30}
						/>
						{isCheckingUsername && (
							<View style={styles.usernameStatus}>
								<Feather
									name="loader"
									size={16}
									color={colors.textSecondary}
									style={styles.spinningIcon}
								/>
							</View>
						)}
						{!isCheckingUsername && username && (
							<View style={styles.usernameStatus}>
								<Feather
									name={isUsernameValid ? "check-circle" : "x-circle"}
									size={16}
									color={isUsernameValid ? colors.success : colors.error}
								/>
							</View>
						)}
					</View>
					{usernameError ? (
						<Text style={[styles.errorText, { color: colors.error }]}>
							{usernameError}
						</Text>
					) : null}
				</View>

				{/* Bio Field */}
				<View style={styles.fieldContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Bio</Text>
					<TextInput
						style={[
							styles.input,
							styles.bioInput,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
								color: colors.text,
							},
						]}
						value={bio}
						onChangeText={setBio}
						placeholder="Tell us about yourself..."
						placeholderTextColor={colors.textSecondary}
						multiline
						numberOfLines={4}
						maxLength={160}
						textAlignVertical="top"
					/>
					<Text
						style={[styles.characterCount, { color: colors.textSecondary }]}
					>
						{bio.length}/160
					</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	keyboardAvoidingView: {
		flex: 1,
	},
	formContainer: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	fieldContainer: {
		marginBottom: 24,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
	},
	usernameContainer: {
		position: "relative",
	},
	usernameInput: {
		paddingRight: 40,
	},
	usernameStatus: {
		position: "absolute",
		right: 12,
		top: 12,
	},
	spinningIcon: {
		// Add rotation animation if needed
	},
	bioInput: {
		minHeight: 100,
		paddingTop: 12,
	},
	characterCount: {
		fontSize: 12,
		textAlign: "right",
		marginTop: 4,
	},
	errorText: {
		fontSize: 12,
		marginTop: 4,
	},
});
