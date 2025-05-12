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
	Keyboard,
	Image,
	Modal,
	KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getComments, addComment } from "../../services/api/voiceNoteService";
import { useRouter } from "expo-router";
import DefaultAvatar from "../DefaultAvatar";

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
	currentUserId: string;
	onClose: () => void;
	onCommentAdded?: () => void;
}

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return `${diffInSeconds}s ago`;
	} else if (diffInSeconds < 3600) {
		return `${Math.floor(diffInSeconds / 60)}m ago`;
	} else if (diffInSeconds < 86400) {
		return `${Math.floor(diffInSeconds / 3600)}h ago`;
	} else if (diffInSeconds < 604800) {
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	} else {
		return date.toLocaleDateString();
	}
};

const DefaultProfilePicture = ({
	userId,
	size = 32,
	avatarUrl = null,
	onPress,
}: {
	userId: string;
	size: number;
	avatarUrl?: string | null;
	onPress?: () => void;
}) => {
	// State to track if the avatar image failed to load
	const [imageError, setImageError] = useState(false);

	// Generate the content based on whether we have a valid avatar URL
	if (avatarUrl && !imageError) {
		return (
			<Image
				source={{ uri: avatarUrl }}
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
				}}
				onError={() => {
					console.log("Error loading avatar in CommentPopup");
					setImageError(true); // Mark this image as failed
				}}
				// Use a web-based avatar service instead of local assets
				defaultSource={
					Platform.OS === "ios"
						? { uri: "https://ui-avatars.com/api/?name=" + (userId || "U") }
						: undefined
				}
			/>
		);
	}

	// Return our new DefaultAvatar
	return <DefaultAvatar userId={userId} size={size} onPress={onPress} />;
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
	const inputRef = useRef<TextInput>(null);
	const router = useRouter();

	useEffect(() => {
		if (visible) {
			fetchComments();
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

	const handleSubmitComment = async () => {
		if (!newComment.trim() || !currentUserId || !voiceNoteId) return;

		setSubmitting(true);
		try {
			const response = await addComment(voiceNoteId, {
				user_id: currentUserId,
				content: newComment.trim(),
			});
			if (response) {
				setComments((prevComments) => [response as Comment, ...prevComments]);
				setNewComment("");
				if (onCommentAdded) {
					onCommentAdded();
				}
			}
		} catch (error) {
			console.error("Error adding comment:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleProfilePress = (userId: string, username?: string) => {
		// Navigate to the user profile using username if available, otherwise use userId
		if (username) {
			console.log("Navigating to profile by username:", username);
			router.push({
				pathname: "/profile/[username]",
				params: { username },
			});
		} else {
			console.log("Navigating to profile by userId:", userId);
			router.push({
				pathname: "/[userId]",
				params: { userId },
			});
		}
	};

	const renderCommentItem = ({ item }: { item: Comment }) => (
		<View style={styles.commentItem}>
			<DefaultProfilePicture
				userId={item.user_id}
				size={40}
				avatarUrl={item.user?.avatar_url || null}
				onPress={() => handleProfilePress(item.user_id, item.user?.username)}
			/>
			<View style={styles.commentContent}>
				<View style={styles.commentHeader}>
					<TouchableOpacity
						onPress={() =>
							handleProfilePress(item.user_id, item.user?.username)
						}
					>
						<Text style={styles.commentUserName}>
							{item.user?.display_name || "User"}
						</Text>
					</TouchableOpacity>
					<Text style={styles.commentTime}>{formatDate(item.created_at)}</Text>
				</View>
				<Text style={styles.commentText}>{item.content}</Text>
			</View>
		</View>
	);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.modalContainer}>
				{/* Overlay - closes modal when tapped */}
				<TouchableOpacity
					style={styles.overlay}
					activeOpacity={1}
					onPress={onClose}
				/>

				{/* Comment popup content */}
				<View style={styles.popupContainer}>
					<View style={styles.header}>
						<Text style={styles.title}>Comments</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Feather name="x" size={24} color="#333" />
						</TouchableOpacity>
					</View>

					{loading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color="#6B2FBC" />
						</View>
					) : (
						<FlatList
							style={styles.flatList}
							data={comments}
							renderItem={renderCommentItem}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.commentsList}
							scrollEnabled={true}
							scrollEventThrottle={16}
							showsVerticalScrollIndicator={true}
							bounces={true}
							onScrollBeginDrag={() => Keyboard.dismiss()}
							ListEmptyComponent={
								<View style={styles.emptyContainer}>
									<Text style={styles.emptyText}>
										No comments yet. Be the first to comment!
									</Text>
								</View>
							}
						/>
					)}

					<KeyboardAvoidingView
						behavior={Platform.OS === "ios" ? "padding" : "height"}
						keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
					>
						<View style={styles.inputContainer}>
							<TextInput
								ref={inputRef}
								style={styles.input}
								placeholder="Add a comment..."
								value={newComment}
								onChangeText={setNewComment}
								multiline
								maxLength={500}
								autoFocus={false}
							/>
							<TouchableOpacity
								style={[
									styles.sendButton,
									(!newComment.trim() || submitting) &&
										styles.sendButtonDisabled,
								]}
								onPress={handleSubmitComment}
								disabled={!newComment.trim() || submitting}
							>
								{submitting ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<Feather name="send" size={20} color="#FFFFFF" />
								)}
							</TouchableOpacity>
						</View>
					</KeyboardAvoidingView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: "flex-end",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	popupContainer: {
		height: "80%",
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		overflow: "hidden",
		display: "flex",
		flexDirection: "column",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#EEEEEE",
		backgroundColor: "#FFFFFF",
		zIndex: 10,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333333",
	},
	closeButton: {
		padding: 4,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	flatList: {
		flex: 1,
		width: "100%",
	},
	commentsList: {
		padding: 16,
	},
	commentItem: {
		flexDirection: "row",
		marginBottom: 16,
	},
	commentContent: {
		flex: 1,
		marginLeft: 12,
		backgroundColor: "#F6F6F6",
		borderRadius: 12,
		padding: 12,
	},
	commentHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	commentUserName: {
		fontWeight: "bold",
		fontSize: 14,
		color: "#333333",
	},
	commentTime: {
		fontSize: 12,
		color: "#999999",
	},
	commentText: {
		fontSize: 14,
		color: "#333333",
		lineHeight: 20,
	},
	inputContainer: {
		flexDirection: "row",
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: "#EEEEEE",
		alignItems: "center",
	},
	input: {
		flex: 1,
		backgroundColor: "#F6F6F6",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		maxHeight: 100,
		fontSize: 14,
	},
	sendButton: {
		backgroundColor: "#6B2FBC",
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
	},
	sendButtonDisabled: {
		backgroundColor: "#CCCCCC",
	},
	emptyContainer: {
		padding: 20,
		alignItems: "center",
	},
	emptyText: {
		color: "#999999",
		textAlign: "center",
	},
});
