const { supabase } = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const BUCKET_NAMES = {
	PROFILE_PICTURES: "profile-pictures",
	COVER_PHOTOS: "cover-pictures",
	VOICE_NOTES: "voice-notes", // As per STORAGE_ARCHITECTURE.md, this should be voice-memos
};

function assertValidImageFile(file) {
	if (!file) {
		throw new Error("No file provided");
	}
	if (!file.mimetype || !file.mimetype.startsWith("image/")) {
		throw new Error("Invalid file type. Only image uploads are allowed");
	}
	if (typeof file.name !== "string" || !file.name.includes(".")) {
		throw new Error("Invalid file name");
	}
	if (!file.buffer || !(file.buffer instanceof Buffer)) {
		throw new Error("Invalid file buffer");
	}
}

/**
 * Uploads a profile picture for a user.
 * @param {string} userId - The ID of the user.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadProfilePicture(userId, file) {
	assertValidImageFile(file);
	const extension = path.extname(file.name);
	const fileName = `${uuidv4()}${extension}`;
	const filePath = `${userId}/${fileName}`;

	const { error: uploadError } = await supabase.storage
		.from(BUCKET_NAMES.PROFILE_PICTURES)
		.upload(filePath, file.buffer, {
			contentType: file.mimetype,
			upsert: false,
		});

	if (uploadError) {
		throw uploadError;
	}

	const { data } = supabase.storage
		.from(BUCKET_NAMES.PROFILE_PICTURES)
		.getPublicUrl(filePath);

	return data.publicUrl;
}

/**
 * Generates a signed URL for a profile picture path
 * @param {string} path - Path within the profile pictures bucket (e.g., userId/uuid.ext)
 * @param {number} [expiresInSeconds=600] - Expiration in seconds
 * @returns {Promise<string>} Signed URL
 */
async function getProfilePictureSignedUrl(path, expiresInSeconds = 600) {
	if (!path) {
		throw new Error("Path is required to generate a signed URL");
	}
	const { data, error } = await supabase.storage
		.from(BUCKET_NAMES.PROFILE_PICTURES)
		.createSignedUrl(path, expiresInSeconds);
	if (error) {
		throw error;
	}
	return data?.signedUrl || "";
}

/**
 * Returns a public URL for a profile picture path (bucket is public per architecture)
 * @param {string} path - Path within the profile pictures bucket
 * @returns {string} Public URL
 */
function getProfilePicturePublicUrl(path) {
	if (!path) {
		throw new Error("Path is required to get public URL");
	}
	const { data } = supabase.storage
		.from(BUCKET_NAMES.PROFILE_PICTURES)
		.getPublicUrl(path);
	return data.publicUrl;
}

/**
 * Deletes a profile picture by path
 * @param {string} path - Path within the profile pictures bucket
 * @returns {Promise<void>}
 */
async function deleteProfilePicture(path) {
	if (!path) {
		throw new Error("Path is required to delete a profile picture");
	}
	const { error } = await supabase.storage
		.from(BUCKET_NAMES.PROFILE_PICTURES)
		.remove([path]);
	if (error) {
		throw error;
	}
}

/**
 * Uploads a cover photo for a user.
 * @param {string} userId - The ID of the user.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadCoverPhoto(userId, file) {
	assertValidImageFile(file);
	const extension = path.extname(file.name);
	const fileName = `${uuidv4()}${extension}`;
	const filePath = `${userId}/${fileName}`;

	const { error: uploadError } = await supabase.storage
		.from(BUCKET_NAMES.COVER_PHOTOS)
		.upload(filePath, file.buffer, {
			contentType: file.mimetype,
			upsert: false,
		});

	if (uploadError) {
		throw uploadError;
	}

	const { data } = supabase.storage
		.from(BUCKET_NAMES.COVER_PHOTOS)
		.getPublicUrl(filePath);

	return data.publicUrl;
}

/**
 * Uploads a voice note for a user.
 * @param {string} userId - The ID of the user.
 * @param {Buffer|{buffer: Buffer, mimetype?: string, name?: string}} blob - The voice note content
 * @returns {Promise<string>} The signed URL of the uploaded file (private bucket)
 */
async function uploadVoiceNote(userId, blob) {
	if (!blob) {
		throw new Error("No blob provided");
	}
	const buffer = Buffer.isBuffer(blob) ? blob : blob.buffer;
	const mimetype = !Buffer.isBuffer(blob) ? blob.mimetype : undefined;
	if (!buffer || !(buffer instanceof Buffer)) {
		throw new Error("Invalid blob buffer");
	}
	const safeMime =
		mimetype && mimetype.startsWith("audio/") ? mimetype : "audio/webm";
	const extension = safeMime === "audio/m4a" ? ".m4a" : ".webm";
	const fileName = `${uuidv4()}${extension}`;
	const filePath = `${userId}/${fileName}`;

	const { error: uploadError } = await supabase.storage
		.from(BUCKET_NAMES.VOICE_NOTES)
		.upload(filePath, buffer, {
			contentType: safeMime,
			upsert: false,
		});

	if (uploadError) {
		throw uploadError;
	}

	const { data, error } = await supabase.storage
		.from(BUCKET_NAMES.VOICE_NOTES)
		.createSignedUrl(filePath, 600);
	if (error) {
		throw error;
	}
	return data?.signedUrl || "";
}

/**
 * Gets the public or signed URL for a media file.
 * @param {string} path - The path of the file in the bucket.
 * @param {boolean} isPrivate - Whether the file is in a private bucket.
 * @returns {Promise<string>} The public or signed URL.
 */
async function getMediaURL(path, isPrivate) {
	if (!path) {
		throw new Error("Path is required to get media URL");
	}
	if (isPrivate) {
		const { data, error } = await supabase.storage
			.from(BUCKET_NAMES.VOICE_NOTES)
			.createSignedUrl(path, 600);
		if (error) {
			throw error;
		}
		return data?.signedUrl || "";
	}
	const { data } = supabase.storage
		.from(BUCKET_NAMES.PROFILE_PICTURES)
		.getPublicUrl(path);
	return data.publicUrl;
}

/**
 * Generates a signed URL for a voice note path
 * @param {string} path - Path within the voice notes bucket (e.g., userId/uuid.ext)
 * @param {number} [expiresInSeconds=600]
 * @returns {Promise<string>}
 */
async function getVoiceNoteSignedUrl(path, expiresInSeconds = 600) {
	if (!path) {
		throw new Error("Path is required to generate a signed URL");
	}
	const { data, error } = await supabase.storage
		.from(BUCKET_NAMES.VOICE_NOTES)
		.createSignedUrl(path, expiresInSeconds);
	if (error) {
		throw error;
	}
	return data?.signedUrl || "";
}

/**
 * Deletes a voice note by path
 * @param {string} path - Path within the voice notes bucket
 * @returns {Promise<void>}
 */
async function deleteVoiceNote(path) {
	if (!path) {
		throw new Error("Path is required to delete a voice note");
	}
	const { error } = await supabase.storage
		.from(BUCKET_NAMES.VOICE_NOTES)
		.remove([path]);
	if (error) {
		throw error;
	}
}

module.exports = {
	uploadProfilePicture,
	getProfilePictureSignedUrl,
	getProfilePicturePublicUrl,
	deleteProfilePicture,
	uploadCoverPhoto,
	uploadVoiceNote,
	getVoiceNoteSignedUrl,
	deleteVoiceNote,
	getMediaURL,
	BUCKET_NAMES,
};
