interface AudioValidationResult {
	isValid: boolean;
	error?: string;
	details?: {
		type: string;
		size: number;
		duration: number;
	};
}

interface AudioValidationOptions {
	maxDuration?: number; // in seconds
	maxFileSize?: number; // in bytes (default 10MB)
	allowedMimeTypes?: string[];
}

const DEFAULT_OPTIONS: Required<AudioValidationOptions> = {
	maxDuration: 60, // 60 seconds
	maxFileSize: 10 * 1024 * 1024, // 10MB
	allowedMimeTypes: [
		'audio/webm',
		'audio/webm;codecs=opus',
		'audio/mp4',
		'audio/mpeg',
		'audio/ogg',
		'audio/wav',
	],
};

/**
 * Validate audio blob for type, size, and duration
 */
export async function validateAudioBlob(
	audioBlob: Blob,
	recordingDuration: number,
	options: AudioValidationOptions = {}
): Promise<AudioValidationResult> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	try {
		// 1. Check file size
		if (audioBlob.size > opts.maxFileSize) {
			return {
				isValid: false,
				error: `File size too large. Maximum allowed: ${formatFileSize(opts.maxFileSize)}`,
				details: {
					type: audioBlob.type,
					size: audioBlob.size,
					duration: recordingDuration,
				},
			};
		}

		// 2. Check MIME type
		if (!opts.allowedMimeTypes.includes(audioBlob.type)) {
			return {
				isValid: false,
				error: `Unsupported audio format: ${audioBlob.type}. Supported formats: ${opts.allowedMimeTypes.join(', ')}`,
				details: {
					type: audioBlob.type,
					size: audioBlob.size,
					duration: recordingDuration,
				},
			};
		}

		// 3. Check duration
		if (recordingDuration > opts.maxDuration) {
			return {
				isValid: false,
				error: `Recording too long. Maximum allowed: ${opts.maxDuration} seconds`,
				details: {
					type: audioBlob.type,
					size: audioBlob.size,
					duration: recordingDuration,
				},
			};
		}

		// 4. Check minimum duration (at least 1 second)
		if (recordingDuration < 1) {
			return {
				isValid: false,
				error: 'Recording too short. Minimum duration: 1 second',
				details: {
					type: audioBlob.type,
					size: audioBlob.size,
					duration: recordingDuration,
				},
			};
		}

		// 5. Additional validation: check if audio actually contains data
		if (audioBlob.size < 1000) { // Less than 1KB is suspicious for audio
			return {
				isValid: false,
				error: 'Recording appears to be empty or corrupted',
				details: {
					type: audioBlob.type,
					size: audioBlob.size,
					duration: recordingDuration,
				},
			};
		}

		// 6. Try to validate audio content by creating an audio element (browser only)
		if (typeof window !== 'undefined') {
			const audioElement = new Audio();
			const audioUrl = URL.createObjectURL(audioBlob);

			try {
				await new Promise<void>((resolve, reject) => {
					audioElement.onloadedmetadata = () => {
						// Check if the audio element reports a reasonable duration
						const audioDuration = audioElement.duration;
						
						// Handle Infinity or NaN durations (common with webm)
						if (!isFinite(audioDuration) || isNaN(audioDuration)) {
							console.warn('Audio element reports invalid duration, skipping duration validation');
							resolve();
							return;
						}

						const audioDurationRounded = Math.round(audioDuration);
						const recordingDurationRounded = Math.round(recordingDuration);

						// Allow some tolerance (±3 seconds) for duration mismatch
						if (Math.abs(audioDurationRounded - recordingDurationRounded) > 3) {
							console.warn(`Duration mismatch: recorded ${recordingDuration}s but audio is ${audioDuration}s, but continuing anyway`);
							// Don't reject for duration mismatch, just warn
						}

						resolve();
					};

					audioElement.onerror = () => {
						reject(new Error('Invalid or corrupted audio file'));
					};

					// Set a timeout for loading
					setTimeout(() => {
						reject(new Error('Audio validation timeout'));
					}, 5000);

					audioElement.src = audioUrl;
				});
			} catch (error) {
				// For validation timeout or corrupt file, still reject
				if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('corrupted'))) {
					return {
						isValid: false,
						error: error.message,
						details: {
							type: audioBlob.type,
							size: audioBlob.size,
							duration: recordingDuration,
						},
					};
				}
				// For other errors, just warn and continue
				console.warn('Audio validation warning:', error);
			} finally {
				URL.revokeObjectURL(audioUrl);
			}
		}

		// All validations passed
		return {
			isValid: true,
			details: {
				type: audioBlob.type,
				size: audioBlob.size,
				duration: recordingDuration,
			},
		};

	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : 'Unknown validation error',
			details: {
				type: audioBlob.type,
				size: audioBlob.size,
				duration: recordingDuration,
			},
		};
	}
}

/**
 * Check if MediaRecorder supports a specific MIME type
 */
export function isAudioTypeSupported(mimeType: string): boolean {
	if (typeof window === 'undefined' || !window.MediaRecorder) {
		return false;
	}

	return MediaRecorder.isTypeSupported(mimeType);
}

/**
 * Get the best supported audio MIME type for MediaRecorder
 */
export function getBestSupportedAudioType(): string {
	const preferredTypes = [
		'audio/webm;codecs=opus',
		'audio/webm',
		'audio/mp4',
		'audio/mpeg',
	];

	for (const type of preferredTypes) {
		if (isAudioTypeSupported(type)) {
			return type;
		}
	}

	// Fallback to default (browser will choose)
	return '';
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	if (bytes === 0) return '0 Bytes';
	
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const size = bytes / Math.pow(1024, i);
	
	return `${Math.round(size * 100) / 100} ${sizes[i]}`;
}

/**
 * Validate audio constraints before starting recording
 */
export function validateRecordingConstraints(
	maxDuration: number,
	maxFileSize: number
): AudioValidationResult {
	// Check if constraints are reasonable
	if (maxDuration < 1 || maxDuration > 300) { // 1 second to 5 minutes
		return {
			isValid: false,
			error: 'Invalid duration constraint. Must be between 1 and 300 seconds.',
		};
	}

	if (maxFileSize < 1000 || maxFileSize > 100 * 1024 * 1024) { // 1KB to 100MB
		return {
			isValid: false,
			error: 'Invalid file size constraint. Must be between 1KB and 100MB.',
		};
	}

	// Check browser support
	if (typeof window !== 'undefined') {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			return {
				isValid: false,
				error: 'Media recording is not supported in this browser.',
			};
		}

		if (!window.MediaRecorder) {
			return {
				isValid: false,
				error: 'MediaRecorder API is not supported in this browser.',
			};
		}
	}

	return {
		isValid: true,
	};
}
