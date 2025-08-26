import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { useUser } from "../../../context/UserContext";
import { uploadVoicePost } from "../../../services/api/voicePostService";
import { validateAudioBlob, validateRecordingConstraints, getBestSupportedAudioType } from "../utils/audioValidation";

interface UseVoicePostRecordingProps {
	maxDuration?: number; // in seconds
}

interface UseVoicePostRecordingReturn {
	isRecording: boolean;
	recordingDuration: number;
	recordingUri: string | null;
	audioBlob: Blob | null;
	isUploading: boolean;
	startRecording: () => Promise<void>;
	stopRecording: () => Promise<void>;
	clearRecording: () => void;
	uploadRecording: (caption?: string) => Promise<void>;
}

export function useVoicePostRecording({
	maxDuration = 60,
}: UseVoicePostRecordingProps = {}): UseVoicePostRecordingReturn {
	const { user } = useUser();
	const [isRecording, setIsRecording] = useState(false);
	const [recordingDuration, setRecordingDuration] = useState(0);
	const [recordingUri, setRecordingUri] = useState<string | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);

	// Initialize MediaRecorder API (Web/Browser only)
	const initializeMediaRecorder = useCallback(async (): Promise<MediaRecorder> => {
		if (Platform.OS !== "web") {
			throw new Error("MediaRecorder API is only available on web platform");
		}

		// Check browser support
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error("MediaRecorder API is not supported in this browser");
		}

		if (!window.MediaRecorder) {
			throw new Error("MediaRecorder is not supported in this browser");
		}

		try {
			// Request microphone permission
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 44100,
				},
			});

			streamRef.current = stream;

			// Create MediaRecorder with optimal settings
			const bestMimeType = getBestSupportedAudioType();
			const options: MediaRecorderOptions = {};
			
			if (bestMimeType) {
				options.mimeType = bestMimeType;
			}

			const mediaRecorder = new MediaRecorder(stream, options);

			// Handle data available
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			// Handle recording stop
			mediaRecorder.onstop = () => {
				if (audioChunksRef.current.length > 0) {
					const audioBlob = new Blob(audioChunksRef.current, {
						type: mediaRecorder.mimeType || "audio/webm",
					});
					const audioUrl = URL.createObjectURL(audioBlob);
					
					setAudioBlob(audioBlob);
					setRecordingUri(audioUrl);
				}

				// Clean up stream
				if (streamRef.current) {
					streamRef.current.getTracks().forEach((track) => track.stop());
					streamRef.current = null;
				}
			};

			// Handle errors
			mediaRecorder.onerror = (event) => {
				console.error("MediaRecorder error:", event);
				Alert.alert("Recording Error", "An error occurred while recording. Please try again.");
			};

			return mediaRecorder;
		} catch (error) {
			console.error("Failed to initialize MediaRecorder:", error);
			throw error;
		}
	}, []);

	const startRecording = useCallback(async () => {
		try {
			// Validate recording constraints before starting
			const constraintValidation = validateRecordingConstraints(maxDuration, 10 * 1024 * 1024); // 10MB max
			if (!constraintValidation.isValid) {
				Alert.alert("Recording Error", constraintValidation.error);
				return;
			}

			// Clear previous recording
			audioChunksRef.current = [];
			setRecordingUri(null);
			setAudioBlob(null);

			// Initialize MediaRecorder
			const mediaRecorder = await initializeMediaRecorder();
			mediaRecorderRef.current = mediaRecorder;

			// Start recording
			mediaRecorder.start(100); // Record in 100ms chunks for smooth data flow
			setIsRecording(true);
			setRecordingDuration(0);

			// Start duration timer
			durationIntervalRef.current = setInterval(() => {
				setRecordingDuration((prevDuration) => {
					const newDuration = prevDuration + 1;
					
					// Auto-stop at max duration
					if (newDuration >= maxDuration) {
						stopRecording();
						return maxDuration;
					}
					
					return newDuration;
				});
			}, 1000);

		} catch (error) {
			console.error("Failed to start recording:", error);
			setIsRecording(false);
			
			let errorMessage = "Failed to start recording. Please try again.";
			
			if (error instanceof Error) {
				if (error.message.includes("Permission denied")) {
					errorMessage = "Microphone permission denied. Please allow microphone access and try again.";
				} else if (error.message.includes("not supported")) {
					errorMessage = "Audio recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.";
				}
			}
			
			Alert.alert("Recording Error", errorMessage);
		}
	}, [maxDuration, initializeMediaRecorder]);

	const stopRecording = useCallback(async () => {
		if (!mediaRecorderRef.current || !isRecording) {
			return;
		}

		try {
			// Stop the MediaRecorder
			if (mediaRecorderRef.current.state === "recording") {
				mediaRecorderRef.current.stop();
			}

			// Clear duration timer
			if (durationIntervalRef.current) {
				clearInterval(durationIntervalRef.current);
				durationIntervalRef.current = null;
			}

			setIsRecording(false);
			mediaRecorderRef.current = null;

		} catch (error) {
			console.error("Failed to stop recording:", error);
			Alert.alert("Error", "Failed to stop recording. Please try again.");
		}
	}, [isRecording]);

	const clearRecording = useCallback(() => {
		// Clean up any existing recording
		if (recordingUri) {
			URL.revokeObjectURL(recordingUri);
		}

		setRecordingUri(null);
		setAudioBlob(null);
		setRecordingDuration(0);
		audioChunksRef.current = [];
	}, [recordingUri]);

	const uploadRecording = useCallback(async (caption = "") => {
		if (!audioBlob || !user) {
			throw new Error("No recording or user available");
		}

		setIsUploading(true);

		try {
			// Validate audio before uploading
			const validation = await validateAudioBlob(audioBlob, recordingDuration, {
				maxDuration,
				maxFileSize: 10 * 1024 * 1024, // 10MB
			});

			if (!validation.isValid) {
				throw new Error(validation.error || "Audio validation failed");
			}

			// Create FormData for upload
			const formData = new FormData();
			
			// Use appropriate file extension based on MIME type
			const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 
								  audioBlob.type.includes('mp4') ? 'mp4' : 'audio';
			
			formData.append("audio", audioBlob, `voice-post.${fileExtension}`);
			formData.append("caption", caption);
			formData.append("duration", recordingDuration.toString());

			// Upload via API service
			await uploadVoicePost(formData);

			// Clear recording after successful upload
			clearRecording();

		} catch (error) {
			console.error("Failed to upload recording:", error);
			throw error;
		} finally {
			setIsUploading(false);
		}
	}, [audioBlob, user, recordingDuration, maxDuration, clearRecording]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Stop recording if in progress
			if (mediaRecorderRef.current && isRecording) {
				stopRecording();
			}

			// Clear timer
			if (durationIntervalRef.current) {
				clearInterval(durationIntervalRef.current);
			}

			// Clean up recording URI
			if (recordingUri) {
				URL.revokeObjectURL(recordingUri);
			}

			// Clean up stream
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	return {
		isRecording,
		recordingDuration,
		recordingUri,
		audioBlob,
		isUploading,
		startRecording,
		stopRecording,
		clearRecording,
		uploadRecording,
	};
}
