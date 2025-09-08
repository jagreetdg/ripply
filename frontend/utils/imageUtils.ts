/**
 * Image URL processing utilities
 */

const DEFAULT_API_URL = "https://ripply-backend.onrender.com";

/**
 * Process an image URL to ensure it's a valid, absolute URL
 * @param imageUrl The raw image URL from the backend
 * @param photoType The type of photo (profile, cover, etc.)
 * @param userId The user ID (for constructing API endpoints)
 * @returns A properly formatted absolute URL or null if invalid
 */
export const processImageUrl = (
	imageUrl?: string | null,
	photoType?: "profile" | "cover" | "avatar",
	userId?: string
): string | null => {
	if (!imageUrl) {
		console.log(`[IMAGE UTILS] No image URL provided`);
		return null;
	}

	const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

	console.log(`[IMAGE UTILS] Processing image URL:`, {
		originalImageUrl: imageUrl,
		photoType,
		userId,
		apiUrl,
	});

	// Handle different URL formats
	if (
		imageUrl.startsWith("http") ||
		imageUrl.startsWith("data:") ||
		imageUrl.startsWith("file:")
	) {
		console.log(`[IMAGE UTILS] Using full URL:`, imageUrl);
		return imageUrl;
	}

	// If it's a relative path starting with /, make it absolute
	if (imageUrl.startsWith("/")) {
		const fullUrl = `${apiUrl}${imageUrl}`;
		console.log(`[IMAGE UTILS] Converting relative to absolute:`, fullUrl);
		return fullUrl;
	}

	// Handle backend storage paths (uploads/, images/, etc.)
	if (
		imageUrl.includes("uploads/") ||
		imageUrl.includes("images/") ||
		imageUrl.includes("avatars/") ||
		imageUrl.includes("covers/")
	) {
		const fullUrl = `${apiUrl}/${imageUrl}`;
		console.log(`[IMAGE UTILS] Converting storage path to full URL:`, fullUrl);
		return fullUrl;
	}

	// Handle API endpoint patterns (e.g., api/users/123/avatar)
	if (
		imageUrl.includes("api/") ||
		imageUrl.includes("users/") ||
		imageUrl.includes("avatar") ||
		imageUrl.includes("cover")
	) {
		// If it doesn't start with api/, prepend it
		const apiPath = imageUrl.startsWith("api/") ? imageUrl : `api/${imageUrl}`;
		const fullUrl = `${apiUrl}/${apiPath}`;
		console.log(`[IMAGE UTILS] Converting API endpoint to full URL:`, fullUrl);
		return fullUrl;
	}

	// Check if it's a UUID or similar ID that needs to be converted to a proper endpoint
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (uuidRegex.test(imageUrl) && userId && photoType) {
		const endpointPath = photoType === "profile" || photoType === "avatar" ? "avatar" : "cover";
		const fullUrl = `${apiUrl}/api/users/${userId}/${endpointPath}`;
		console.log(`[IMAGE UTILS] Converting UUID to API endpoint:`, fullUrl);
		return fullUrl;
	}

	// If nothing else matches, try to construct a proper URL
	const fullUrl = `${apiUrl}/${imageUrl}`;
	console.log(`[IMAGE UTILS] Using fallback URL construction:`, fullUrl);
	return fullUrl;
};

/**
 * Get a fallback image URL for when the primary image fails to load
 * @param userId The user ID
 * @param displayName The user's display name
 * @param type The type of image (avatar or cover)
 * @returns A fallback image URL
 */
export const getFallbackImageUrl = (
	userId: string,
	displayName?: string,
	type: "avatar" | "cover" = "avatar"
): string => {
	if (type === "avatar") {
		// Use ui-avatars.com for avatar fallbacks
		const name = encodeURIComponent(displayName || userId || "U");
		return `https://ui-avatars.com/api/?name=${name}&background=007AFF&color=fff&size=200`;
	} else {
		// For cover photos, return null - we don't want any fallbacks for cover photos
		// as they should be optional and gracefully handle missing images
		return "";
	}
}; 