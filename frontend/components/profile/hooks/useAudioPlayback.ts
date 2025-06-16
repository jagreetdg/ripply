import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

interface AudioPlaybackProps {
  recordingUri?: string | null;
  existingAudioUrl?: string | null;
}

interface AudioPlaybackState {
  sound: Audio.Sound | null;
  isPlaying: boolean;
  playbackPosition: number;
}

interface AudioPlaybackActions {
  playRecording: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  unloadSound: () => Promise<void>;
}

export const useAudioPlayback = ({
  recordingUri,
  existingAudioUrl,
}: AudioPlaybackProps): AudioPlaybackState & AudioPlaybackActions => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackPosition = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      playbackPosition.current = status.positionMillis;

      if (status.didJustFinish) {
        setIsPlaying(false);
        playbackPosition.current = 0;
      }
    }
  };

  const playRecording = async () => {
    if (!recordingUri && !existingAudioUrl) {
      Alert.alert('Error', 'No recording available to play.');
      return;
    }

    try {
      // If we already have a sound object, use it
      if (sound) {
        await sound.playFromPositionAsync(playbackPosition.current);
      } else {
        // Create a new sound object
        const source = recordingUri || existingAudioUrl || '';
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: source },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
      }

      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording. Please try again.');
    }
  };

  const pausePlayback = async () => {
    if (!sound) return;

    try {
      await sound.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to pause playback:', error);
    }
  };

  const stopPlayback = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      setIsPlaying(false);
      playbackPosition.current = 0;
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  const unloadSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        playbackPosition.current = 0;
      } catch (error) {
        console.error('Failed to unload sound:', error);
      }
    }
  };

  return {
    // State
    sound,
    isPlaying,
    playbackPosition: playbackPosition.current,

    // Actions
    playRecording,
    pausePlayback,
    stopPlayback,
    unloadSound,
  };
}; 