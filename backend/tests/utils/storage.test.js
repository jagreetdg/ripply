/**
 * Tests for profile picture storage helpers
 */

const path = require("path");

// Mocks
const mockUpload = jest.fn(async () => ({ error: null }));
const mockGetPublicUrl = jest.fn((p) => ({
	data: { publicUrl: `https://cdn.example.com/${p}` },
}));
const mockCreateSignedUrl = jest.fn(async (p, exp) => ({
	data: { signedUrl: `https://signed.example.com/${p}?exp=${exp}` },
	error: null,
}));
const mockRemove = jest.fn(async () => ({ error: null }));

const mockFrom = jest.fn((bucket) => ({
	upload: mockUpload,
	getPublicUrl: mockGetPublicUrl,
	createSignedUrl: mockCreateSignedUrl,
	remove: mockRemove,
	_bucket: bucket,
}));

jest.mock("../../src/config/supabase", () => {
	return {
		supabase: {
			storage: { from: mockFrom },
		},
	};
});

const {
	uploadProfilePicture,
	getProfilePictureSignedUrl,
	getProfilePicturePublicUrl,
	deleteProfilePicture,
	uploadCoverPhoto,
	uploadVoiceNote,
	getVoiceNoteSignedUrl,
	deleteVoiceNote,
	BUCKET_NAMES,
} = require("../../src/utils/storage");

describe("storage helpers - profile pictures", () => {
	const userId = "user-123";
	const fakeFile = {
		name: "avatar.png",
		mimetype: "image/png",
		buffer: Buffer.from([1, 2, 3]),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("uploads profile picture and returns public URL", async () => {
		const url = await uploadProfilePicture(userId, fakeFile);

		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.PROFILE_PICTURES);
		expect(mockUpload).toHaveBeenCalledTimes(1);

		const [uploadedPath, uploadedBuffer, options] = mockUpload.mock.calls[0];
		expect(uploadedPath).toMatch(new RegExp(`^${userId}/[\\w-]+\\.png$`));
		expect(Buffer.isBuffer(uploadedBuffer)).toBe(true);
		expect(options).toMatchObject({ contentType: "image/png", upsert: false });

		// getPublicUrl called with the same path
		expect(mockGetPublicUrl).toHaveBeenCalledTimes(1);
		expect(mockGetPublicUrl).toHaveBeenCalledWith(uploadedPath);

		expect(url).toBe(`https://cdn.example.com/${uploadedPath}`);
	});

	it("rejects non-image uploads", async () => {
		const badFile = {
			name: "file.txt",
			mimetype: "text/plain",
			buffer: Buffer.from("hi"),
		};
		await expect(uploadProfilePicture(userId, badFile)).rejects.toThrow(
			"Invalid file type"
		);
	});

	it("generates signed URL for a given path", async () => {
		const p = `${userId}/some.png`;
		const url = await getProfilePictureSignedUrl(p, 600);
		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.PROFILE_PICTURES);
		expect(mockCreateSignedUrl).toHaveBeenCalledWith(p, 600);
		expect(url).toBe(`https://signed.example.com/${p}?exp=600`);
	});

	it("returns public URL for a given path", () => {
		const p = `${userId}/some.png`;
		const url = getProfilePicturePublicUrl(p);
		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.PROFILE_PICTURES);
		expect(mockGetPublicUrl).toHaveBeenCalledWith(p);
		expect(url).toBe(`https://cdn.example.com/${p}`);
	});

	it("deletes a profile picture by path", async () => {
		const p = `${userId}/old.png`;
		await deleteProfilePicture(p);
		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.PROFILE_PICTURES);
		expect(mockRemove).toHaveBeenCalledWith([p]);
	});
});

describe("storage helpers - cover photos", () => {
	const userId = "user-456";
	const fakeFile = {
		name: "cover.jpg",
		mimetype: "image/jpeg",
		buffer: Buffer.from([4, 5, 6]),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("uploads cover photo and returns public URL", async () => {
		const url = await uploadCoverPhoto(userId, fakeFile);

		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.COVER_PHOTOS);
		expect(mockUpload).toHaveBeenCalledTimes(1);

		const [uploadedPath, uploadedBuffer, options] = mockUpload.mock.calls[0];
		expect(uploadedPath).toMatch(new RegExp(`^${userId}/[\\w-]+\\.jpg$`));
		expect(Buffer.isBuffer(uploadedBuffer)).toBe(true);
		expect(options).toMatchObject({ contentType: "image/jpeg", upsert: false });

		expect(mockGetPublicUrl).toHaveBeenCalledWith(uploadedPath);
		expect(url).toBe(`https://cdn.example.com/${uploadedPath}`);
	});
});

describe("storage helpers - voice notes", () => {
	const userId = "user-789";
	const fakeAudio = Buffer.from([7, 8, 9]);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("uploads voice note (private) and returns signed URL", async () => {
		const url = await uploadVoiceNote(userId, fakeAudio);
		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.VOICE_NOTES);
		expect(mockUpload).toHaveBeenCalledTimes(1);
		const [uploadedPath, uploadedBuffer, options] = mockUpload.mock.calls[0];
		expect(uploadedPath).toMatch(
			new RegExp(`^${userId}/[\\w-]+\\.(webm|m4a)$`)
		);
		expect(Buffer.isBuffer(uploadedBuffer)).toBe(true);
		expect(options).toHaveProperty("contentType");
		// signed url
		expect(mockCreateSignedUrl).toHaveBeenCalledWith(uploadedPath, 600);
		expect(url).toContain(`https://signed.example.com/${uploadedPath}`);
	});

	it("generates signed URL for existing voice note path", async () => {
		const p = `${userId}/note.webm`;
		const url = await getVoiceNoteSignedUrl(p, 300);
		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.VOICE_NOTES);
		expect(mockCreateSignedUrl).toHaveBeenCalledWith(p, 300);
		expect(url).toBe(`https://signed.example.com/${p}?exp=300`);
	});

	it("deletes a voice note by path", async () => {
		const p = `${userId}/old.webm`;
		await deleteVoiceNote(p);
		expect(mockFrom).toHaveBeenCalledWith(BUCKET_NAMES.VOICE_NOTES);
		expect(mockRemove).toHaveBeenCalledWith([p]);
	});
});
