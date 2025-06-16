import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

interface AudioRecordingState {
  recording: Audio.Recording | null;
  isRecording: boolean;
  recordingDuration: number;
  recordingUri: string | null;
}

interface AudioRecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  setRecordingDuration: (duration: number) => void;
}

export const useAudioRecording = (): AudioRecordingState & AudioRecordingActions => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio permissions and setup
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
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        Alert.alert(
          'Error',
          'Failed to initialize audio recording. Please check app permissions.'
        );
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      const uri = recording.getURI();
      if (uri) {
        setRecordingUri(uri);
      }

      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    }
  };

  const clearRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  return {
    // State
    recording,
    isRecording,
    recordingDuration,
    recordingUri,

    // Actions
    startRecording,
    stopRecording,
    clearRecording,
    setRecordingDuration,
  };
}; 