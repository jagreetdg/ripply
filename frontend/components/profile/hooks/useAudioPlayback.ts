import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export interface UseAudioPlaybackProps {
  audioUri?: string | null;
}

export const useAudioPlayback = ({ audioUri }: UseAudioPlaybackProps = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const playbackPosition = useRef(0);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      playbackPosition.current = status.positionMillis;
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        playbackPosition.current = 0;
      }
    }
  };

  const playAudio = async (uri?: string) => {
    const sourceUri = uri || audioUri;
    
    if (!sourceUri) {
      Alert.alert('Error', 'No audio available to play.');
      return;
    }

    try {
      // If we already have a sound object, use it
      if (sound) {
        await sound.playFromPositionAsync(playbackPosition.current);
      } else {
        // Create a new sound object
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: sourceUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
      }
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };

  const pauseAudio = async () => {
    if (!sound) return;
    
    try {
      await sound.pauseAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to pause playback:', error);
    }
  };

  const stopAudio = async () => {
    if (!sound) return;
    
    try {
      await sound.stopAsync();
      setIsPlaying(false);
      playbackPosition.current = 0;
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  const unloadAudio = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        playbackPosition.current = 0;
      } catch (error) {
        console.error('Failed to unload audio:', error);
      }
    }
  };

  return {
    isPlaying,
    playAudio,
    pauseAudio,
    stopAudio,
    unloadAudio,
  };
}; 