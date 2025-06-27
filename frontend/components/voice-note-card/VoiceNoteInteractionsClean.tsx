import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "../../context/UserContext";
import { useVoiceNoteLikeNew } from "./hooks/useVoiceNoteLikeNew";
import { useVoiceNoteShareNew } from "./hooks/useVoiceNoteShareNew";
import { VoiceNote } from "../../services/api/modules/types/voiceNoteTypes";

interface VoiceNoteInteractionsCleanProps {
	voiceNote: VoiceNote;
	onOpenComments: () => void;
	onLikeStatusChanged?: (isLiked: boolean, likesCount: number) => void;
	onShareStatusChanged?: (isShared: boolean, sharesCount: number) => void;
}

export const VoiceNoteInteractionsClean: React.FC<
	VoiceNoteInteractionsCleanProps
> = ({
	voiceNote,
	onOpenComments,
	onLikeStatusChanged,
	onShareStatusChanged,
}) => {
	const { user } = useUserContext();

	console.log(
		`[CLEAN INTERACTIONS] Render: voiceNoteId=${voiceNote.id}, user=${user?.id}`
	);

	// Use new clean hooks
	const {
		isLiked,
		likesCount,
		isLoading: likeLoading,
		isProcessing: likeProcessing,
		toggleLike,
	} = useVoiceNoteLikeNew({
		voiceNoteId: voiceNote.id,
		userId: user?.id || null,
		initialLikesCount: voiceNote.likes || 0,
		initialIsLiked: false, // Will be loaded from API
		onLikeStatusChanged,
	});

	const {
		isShared,
		sharesCount,
		isLoading: shareLoading,
		isProcessing: shareProcessing,
		toggleShare,
	} = useVoiceNoteShareNew({
		voiceNoteId: voiceNote.id,
		userId: user?.id || null,
		initialSharesCount: voiceNote.shares || 0,
		initialIsShared: false, // Will be loaded from API
		onShareStatusChanged,
	});

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				marginTop: 12,
				paddingHorizontal: 4,
			}}
		>
			{/* Like Button */}
			<TouchableOpacity
				onPress={toggleLike}
				disabled={!user || likeProcessing}
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginRight: 20,
					opacity: !user ? 0.5 : 1,
				}}
			>
				{likeProcessing ? (
					<ActivityIndicator
						size="small"
						color="#FF6B6B"
						style={{ marginRight: 6 }}
					/>
				) : (
					<Ionicons
						name={isLiked ? "heart" : "heart-outline"}
						size={20}
						color={isLiked ? "#FF6B6B" : "#666"}
						style={{ marginRight: 6 }}
					/>
				)}
				<Text
					style={{
						color: isLiked ? "#FF6B6B" : "#666",
						fontSize: 14,
						opacity: likeLoading ? 0.5 : 1,
					}}
				>
					{likesCount}
				</Text>
			</TouchableOpacity>

			{/* Comments Button */}
			<TouchableOpacity
				onPress={onOpenComments}
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginRight: 20,
				}}
			>
				<Ionicons
					name="chatbubble-outline"
					size={20}
					color="#666"
					style={{ marginRight: 6 }}
				/>
				<Text style={{ color: "#666", fontSize: 14 }}>
					{voiceNote.comments || 0}
				</Text>
			</TouchableOpacity>

			{/* Share Button */}
			<TouchableOpacity
				onPress={toggleShare}
				disabled={!user || shareProcessing}
				style={{
					flexDirection: "row",
					alignItems: "center",
					opacity: !user ? 0.5 : 1,
				}}
			>
				{shareProcessing ? (
					<ActivityIndicator
						size="small"
						color="#4ECDC4"
						style={{ marginRight: 6 }}
					/>
				) : (
					<Ionicons
						name={isShared ? "repeat" : "repeat-outline"}
						size={20}
						color={isShared ? "#4ECDC4" : "#666"}
						style={{ marginRight: 6 }}
					/>
				)}
				<Text
					style={{
						color: isShared ? "#4ECDC4" : "#666",
						fontSize: 14,
						opacity: shareLoading ? 0.5 : 1,
					}}
				>
					{sharesCount}
				</Text>
			</TouchableOpacity>
		</View>
	);
};
