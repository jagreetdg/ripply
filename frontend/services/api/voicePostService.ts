import { apiRequest } from './config';

export interface VoicePost {
	id: string;
	user_id: string;
	audio_url: string;
	caption?: string;
	duration: number;
	created_at: string;
	updated_at: string;
	like_count: number;
	comment_count: number;
	share_count: number;
}

export interface CreateVoicePostRequest {
	audio: Blob;
	caption?: string;
	duration: number;
}

/**
 * Upload a new voice post
 */
export async function uploadVoicePost(formData: FormData): Promise<VoicePost> {
	try {
		// Extract data from FormData
		const audioBlob = formData.get('audio') as Blob;
		const caption = formData.get('caption') as string;
		const duration = parseInt(formData.get('duration') as string);

		if (!audioBlob) {
			throw new Error('Audio file is required');
		}

		// For demo purposes, create a mock audio URL
		// In production, this would be a proper Supabase storage upload
		const mockAudioUrl = `https://mock-storage.supabase.co/voice-notes/${Date.now()}.webm`;

		// Create a voice note record
		// The backend gets user_id from the authentication token
		const response = await apiRequest('/api/voice-notes', {
			method: 'POST',
			body: {
				title: caption || 'Voice Note',
				description: caption,
				audio_url: mockAudioUrl,
				duration: duration,
				is_public: true
			},
			requiresAuth: true
		});

		return response;
	} catch (error) {
		console.error('Failed to upload voice post:', error);
		throw new Error('Failed to upload voice post');
	}
}

/**
 * Get user's voice posts
 */
export async function getUserVoicePosts(userId: string): Promise<VoicePost[]> {
	try {
		const response = await apiRequest(`/api/users/${userId}/voice-notes`, {
			method: 'GET',
			requiresAuth: true
		});
		return response;
	} catch (error) {
		console.error('Failed to get user voice posts:', error);
		throw new Error('Failed to get user voice posts');
	}
}

/**
 * Delete a voice post
 */
export async function deleteVoicePost(postId: string): Promise<void> {
	try {
		await apiRequest(`/api/voice-notes/${postId}`, {
			method: 'DELETE',
			requiresAuth: true
		});
	} catch (error) {
		console.error('Failed to delete voice post:', error);
		throw new Error('Failed to delete voice post');
	}
}

/**
 * Like/unlike a voice post
 */
export async function toggleVoicePostLike(postId: string): Promise<{ liked: boolean; like_count: number }> {
	try {
		const response = await apiRequest(`/api/voice-notes/${postId}/like`, {
			method: 'POST',
			requiresAuth: true
		});
		return response;
	} catch (error) {
		console.error('Failed to toggle voice post like:', error);
		throw new Error('Failed to toggle like');
	}
}

/**
 * Share a voice post
 */
export async function shareVoicePost(postId: string): Promise<{ shared: boolean; share_count: number }> {
	try {
		const response = await apiRequest(`/api/voice-notes/${postId}/share`, {
			method: 'POST',
			requiresAuth: true
		});
		return response;
	} catch (error) {
		console.error('Failed to share voice post:', error);
		throw new Error('Failed to share voice post');
	}
}
