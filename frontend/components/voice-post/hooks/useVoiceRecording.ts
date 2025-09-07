import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { uploadVoicePost } from "../../../services/api/voicePostService";
import { Audio } from "expo-av";

interface UseVoiceRecordingProps {
  maxDuration?: number; // in seconds
  onAutoStop?: () => void; // Callback when auto-stop occurs
}

interface UseVoiceRecordingReturn {
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

export function useVoiceRecording({
  maxDuration = 60,
  onAutoStop,
}: UseVoiceRecordingProps = {}): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoStoppingRef = useRef(false);

  // Initialize audio permissions and settings
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("✅ Audio permissions and settings initialized");
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        Alert.alert(
          "Error",
          "Failed to initialize audio recording. Please check app permissions."
        );
      }
    };

    initAudio();

    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log("🎬 Starting recording...");
      
      // Stop any existing recording first
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.warn("Failed to stop existing recording:", e);
        }
        recordingRef.current = null;
      }
      
      // Clear previous recording
      setRecordingUri(null);
      setRecordingDuration(0);
      setAudioBlob(null);
      setIsRecording(false);
      isAutoStoppingRef.current = false;

      // Create new recording with high quality preset
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Keep UI in sync with native recording status
      try {
        recording.setOnRecordingStatusUpdate((status) => {
          // status.isRecording, status.durationMillis
          if (status?.isRecording) {
            setIsRecording(true);
          }
          if (typeof (status as any)?.durationMillis === "number") {
            const seconds = Math.floor(((status as any).durationMillis || 0) / 1000);
            setRecordingDuration(seconds);
            
            // Additional safeguard: Auto-stop if native duration exceeds limit
            if (seconds >= maxDuration && !isAutoStoppingRef.current) {
              console.log(`🚨 Native duration exceeded limit: ${seconds}s - Force stopping`);
              isAutoStoppingRef.current = true;
              onAutoStop?.();
              setTimeout(() => stopRecording().catch(console.error), 0);
            }
          }
        });
        // @ts-ignore - not always in types
        if (typeof (recording as any).setProgressUpdateInterval === "function") {
          try { (recording as any).setProgressUpdateInterval(1000); } catch {}
        }
      } catch (e) {
        console.warn("setOnRecordingStatusUpdate unsupported", e);
      }

      recordingRef.current = recording;
      
      // Start recording
      await recording.startAsync();
      setIsRecording(true);
      console.log("✅ Recording started");

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          const newDuration = prevDuration + 1;
          console.log(`⏱️ Recording duration: ${newDuration}s`);
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration && !isAutoStoppingRef.current) {
            console.log(`🔄 Auto-stopping at max duration: ${maxDuration}s`);
            isAutoStoppingRef.current = true;
            
            // Clear the interval first to prevent multiple calls
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
              durationIntervalRef.current = null;
            }
            
            // Call auto-stop callback if provided
            onAutoStop?.();
            
            // Stop recording immediately using setTimeout to avoid recursion
            setTimeout(async () => {
              try {
                await stopRecording();
              } catch (error) {
                console.error("Auto-stop error:", error);
              } finally {
                isAutoStoppingRef.current = false;
              }
            }, 0);
            
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
          errorMessage = "Audio recording is not supported. Please check your device settings.";
        }
      }
      
      Alert.alert("Recording Error", errorMessage);
    }
  }, [maxDuration]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) {
      console.log("❌ No recording to stop");
      return;
    }

    try {
      console.log("🛑 Stopping recording...");
      
      // Clear duration timer first
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      // Stop and unload the recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get the URI
      const uri = recordingRef.current.getURI();
      console.log("📁 Recording URI:", uri);

      // Set the recording URI
      setRecordingUri(uri);
      // For web compatibility, create a blob from the URI
      if (Platform.OS === "web" && uri) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          setAudioBlob(blob);
        } catch (e) {
          console.warn("Failed to create audio blob from URI", e);
        }
      }
      
      // Ensure UI stops showing recording state
      setIsRecording(false);
      recordingRef.current = null;

      console.log("✅ Recording stopped successfully");

    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
    }
  }, []);

  const clearRecording = useCallback(() => {
    console.log("🧹 Clearing recording...");
    
    // Clean up any existing recording
    if (recordingUri && Platform.OS === "web") {
      URL.revokeObjectURL(recordingUri);
    }

    setRecordingUri(null);
    setRecordingDuration(0);
    setAudioBlob(null);
    console.log("✅ Recording cleared");
  }, [recordingUri]);

  const uploadRecording = useCallback(async (caption = "") => {
    if (!recordingUri) {
      throw new Error("No recording available");
    }

    setIsUploading(true);

    try {
      // Create FormData for upload using existing API service
      const formData = new FormData();
      formData.append("audio", {
        uri: recordingUri,
        type: "audio/m4a",
        name: "voice-post.m4a",
      } as any);
      formData.append("caption", caption);
      formData.append("duration", recordingDuration.toString());

      await uploadVoicePost(formData);

      // Clear recording after successful upload
      clearRecording();

    } catch (error) {
      console.error("Failed to upload recording:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [recordingUri, recordingDuration, clearRecording]);

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
