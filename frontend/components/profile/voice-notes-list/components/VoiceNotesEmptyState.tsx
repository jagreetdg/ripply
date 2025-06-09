import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../../../context/ThemeContext";
import { getStyles } from "../VoiceNotesListStyles";

interface VoiceNotesEmptyStateProps {
	isLoading: boolean;
	activeTab?: string;
	isOwnProfile?: boolean;
	listHeaderComponent?: React.ReactNode;
}

export const VoiceNotesEmptyState: React.FC<VoiceNotesEmptyStateProps> = ({
	isLoading,
	activeTab,
	isOwnProfile,
	listHeaderComponent,
}) => {
	const { colors, isDarkMode } = useTheme();
	const router = useRouter();
	const styles = getStyles(colors, listHeaderComponent, isDarkMode);

	if (isLoading) {
		return (
			<View style={styles.emptyContainer}>
				<ActivityIndicator size="large" color={colors.tint} />
				<Text
					style={[
						styles.emptyText,
						{ marginTop: 16, color: colors.textSecondary },
					]}
				>
					Loading voice notes...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.emptyContainer}>
			<Feather
				name={activeTab === "shared" ? "repeat" : "mic-off"}
				size={60}
				color={colors.textSecondary}
				style={styles.emptyIcon}
			/>
			<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
				{activeTab === "shared"
					? isOwnProfile
						? "You haven't shared any voice notes yet."
						: "This user hasn't shared any voice notes yet."
					: isOwnProfile
					? "You haven't created any voice notes yet."
					: "This user hasn't created any voice notes yet."}
			</Text>
			{isOwnProfile && activeTab === "voicenotes" && (
				<TouchableOpacity
					style={styles.recordButton}
					onPress={() => router.push("/voicenote/create")}
				>
					<Feather name="mic" size={20} color={colors.white} />
					<Text style={styles.recordButtonText}>Record First Voice Note</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};
