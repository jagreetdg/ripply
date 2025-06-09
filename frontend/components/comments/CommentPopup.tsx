import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	Platform,
	ActivityIndicator,
	Image,
	Modal,
	Alert,
	Dimensions,
	ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { getComments, addComment } from "../../services/api/voiceNoteService";

const { height: screenHeight } = Dimensions.get("window");

interface Comment {
	id: string;
	voice_note_id?: string;
	content: string;
	created_at: string;
	user_id: string;
	user?: {
		id?: string;
		username: string;
		display_name: string;
		avatar_url?: string | null;
	};
}

interface CommentPopupProps {
	visible: boolean;
	voiceNoteId: string;
	currentUserId?: string;
	onClose: () => void;
	onCommentAdded?: (comment: Comment) => void;
}

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) return `${diffInSeconds}s`;
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
	if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

	// More than 7 days - show actual date
	const options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
	};

	// If it's from a different year, include the year
	if (date.getFullYear() !== now.getFullYear()) {
		options.year = "numeric";
	}

	return date.toLocaleDateString("en-US", options);
};

export function CommentPopup({
	visible,
	voiceNoteId,
	currentUserId,
	onClose,
	onCommentAdded,
}: CommentPopupProps) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const textInputRef = useRef<TextInput>(null);
	const router = useRouter();
	const { user } = useUser();
	const { colors, isDarkMode } = useTheme();

	const loggedInUserId = user?.id || currentUserId;

	useEffect(() => {
		if (visible) {
			fetchComments();
			setTimeout(() => {
				textInputRef.current?.focus();
			}, 300);
		} else {
			setNewComment("");
		}
	}, [visible, voiceNoteId]);

	const fetchComments = async () => {
		if (!voiceNoteId) return;

		setLoading(true);
		try {
			const response = await getComments(voiceNoteId);
			if (response && typeof response === "object" && "data" in response) {
				setComments(response.data as Comment[]);
			}
		} catch (error) {
			console.error("Error fetching comments:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddComment = async () => {
		if (!newComment.trim()) return;

		if (!loggedInUserId) {
			Alert.alert(
				"Sign In Required",
				"Please sign in to comment on voice notes."
			);
			return;
		}

		if (!voiceNoteId) {
			console.error("No voice note ID provided");
			return;
		}

		setSubmitting(true);
		try {
			const response = await addComment(
				voiceNoteId,
				loggedInUserId,
				newComment.trim()
			);
			if (response) {
				const newCommentData = response as Comment;
				setComments((prev) => [newCommentData, ...prev]);
				setNewComment("");
				onCommentAdded?.(newCommentData);
			}
		} catch (error) {
			console.error("Error adding comment:", error);
			Alert.alert("Error", "Failed to add comment. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleProfilePress = (userId: string, username?: string) => {
		if (username) {
			router.push(`/profile/${username}`);
		}
		onClose();
	};

	const renderComment = ({ item }: { item: Comment }) => {
		const user = item.user;
		const displayName = user?.display_name || "User";
		const username = user?.username || "";

		return (
			<View
				style={[styles.commentItem, { backgroundColor: colors.background }]}
			>
				<View style={[styles.avatar, { backgroundColor: colors.tint }]}>
					{user?.avatar_url ? (
						<Image
							source={{ uri: user.avatar_url }}
							style={styles.avatarImage}
						/>
					) : (
						<Text style={styles.avatarText}>
							{displayName.charAt(0).toUpperCase()}
						</Text>
					)}
				</View>

				<View style={styles.commentContent}>
					<TouchableOpacity
						onPress={() => handleProfilePress(item.user_id, username)}
					>
						<Text style={[styles.displayName, { color: colors.text }]}>
							{displayName}
						</Text>
					</TouchableOpacity>

					<Text style={[styles.commentText, { color: colors.text }]}>
						{item.content}
					</Text>

					<Text style={[styles.timestamp, { color: colors.textSecondary }]}>
						{formatDate(item.created_at)}
					</Text>
				</View>
			</View>
		);
	};

	if (!visible) return null;

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.modalContainer}>
				{/* Backdrop */}
				<TouchableOpacity
					style={styles.backdrop}
					activeOpacity={1}
					onPress={onClose}
				/>

				{/* Modal content */}
				<View style={[styles.modalContent, { backgroundColor: colors.card }]}>
					{/* Header */}
					<View style={[styles.header, { borderBottomColor: colors.border }]}>
						<Text style={[styles.headerTitle, { color: colors.text }]}>
							Comments
						</Text>
						<TouchableOpacity onPress={onClose}>
							<Feather name="x" size={24} color={colors.text} />
						</TouchableOpacity>
					</View>

					{/* Comments - Using ScrollView instead of FlatList for testing */}
					<ScrollView
						style={styles.commentsContainer}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={true}
						bounces={true}
					>
						{loading ? (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" color={colors.tint} />
								<Text
									style={[styles.loadingText, { color: colors.textSecondary }]}
								>
									Loading comments...
								</Text>
							</View>
						) : comments.length === 0 ? (
							<View style={styles.emptyContainer}>
								<Feather
									name="message-circle"
									size={48}
									color={colors.textSecondary}
								/>
								<Text
									style={[styles.emptyText, { color: colors.textSecondary }]}
								>
									No comments yet
								</Text>
								<Text
									style={[styles.emptySubtext, { color: colors.textTertiary }]}
								>
									Be the first to share your thoughts!
								</Text>
							</View>
						) : (
							comments.map((comment) => (
								<View key={comment.id}>{renderComment({ item: comment })}</View>
							))
						)}
					</ScrollView>

					{/* Input section */}
					<View
						style={[
							styles.inputContainer,
							{ backgroundColor: colors.card, borderTopColor: colors.border },
						]}
					>
						<TextInput
							ref={textInputRef}
							style={[
								styles.textInput,
								{ color: colors.text, backgroundColor: colors.background },
							]}
							placeholder="Add a comment..."
							placeholderTextColor={colors.textSecondary}
							value={newComment}
							onChangeText={setNewComment}
							multiline
							maxLength={500}
							returnKeyType="send"
							onSubmitEditing={handleAddComment}
							blurOnSubmit={false}
						/>
						<TouchableOpacity
							onPress={handleAddComment}
							disabled={!newComment.trim() || submitting}
							style={[
								styles.sendButton,
								{
									backgroundColor:
										newComment.trim() && !submitting
											? colors.tint
											: colors.textTertiary,
								},
							]}
						>
							{submitting ? (
								<ActivityIndicator size="small" color={colors.white} />
							) : (
								<Feather name="send" size={16} color={colors.white} />
							)}
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	backdrop: {
		flex: 1,
	},
	modalContent: {
		height: screenHeight * 0.8,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
	},
	commentsContainer: {
		flex: 1,
		paddingHorizontal: 20,
	},
	scrollContent: {
		paddingTop: 16,
		paddingBottom: 20,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 40,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: "500",
		marginTop: 16,
		textAlign: "center",
	},
	emptySubtext: {
		fontSize: 14,
		textAlign: "center",
		marginTop: 8,
	},
	commentItem: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 16,
		marginVertical: 4,
		borderRadius: 12,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	avatarImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	avatarText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	commentContent: {
		flex: 1,
	},
	displayName: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 4,
	},
	commentText: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 4,
	},
	timestamp: {
		fontSize: 12,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
	},
	textInput: {
		flex: 1,
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginRight: 12,
		maxHeight: 100,
		fontSize: 16,
	},
	sendButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
});
