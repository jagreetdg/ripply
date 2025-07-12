const { supabase } = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const BUCKET_NAMES = {
	PROFILE_PICTURES: "profile-pictures",
	COVER_PHOTOS: "cover-pictures",
	VOICE_NOTES: "voice-notes", // As per STORAGE_ARCHITECTURE.md, this should be voice-memos
};

/**
 * Uploads a profile picture for a user.
 * @param {string} userId - The ID of the user.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadProfilePicture(userId, file) {
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
 * Uploads a cover photo for a user.
 * @param {string} userId - The ID of the user.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadCoverPhoto(userId, file) {
	// TODO: Implement cover photo upload
	return Promise.resolve("");
}

/**
 * Uploads a voice note for a user.
 * @param {string} userId - The ID of the user.
 * @param {Blob} blob - The voice note blob to upload.
 * @returns {Promise<string>} The signed URL of the uploaded file.
 */
async function uploadVoiceNote(userId, blob) {
	// TODO: Implement voice note upload
	return Promise.resolve("");
}

/**
 * Gets the public or signed URL for a media file.
 * @param {string} path - The path of the file in the bucket.
 * @param {boolean} isPrivate - Whether the file is in a private bucket.
 * @returns {Promise<string>} The public or signed URL.
 */
async function getMediaURL(path, isPrivate) {
	// TODO: Implement getMediaURL
	return Promise.resolve("");
}

module.exports = {
	uploadProfilePicture,
	uploadCoverPhoto,
	uploadVoiceNote,
	getMediaURL,
	BUCKET_NAMES,
};
