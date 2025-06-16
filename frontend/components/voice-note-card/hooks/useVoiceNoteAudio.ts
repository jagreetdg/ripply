import { useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { recordPlay } from '../../../services/api';
import { normalizePlaysCount } from '../VoiceNoteCardUtils';

interface VoiceNoteAudioProps {
  voiceNote: {
    id: string;
    plays?: number;
  };
  userId?: string;
  onPlay?: () => void;
  onPlayPress?: () => void;
}

interface AudioState {
  isPlaying: boolean;
  progress: number;
  isSeeking: boolean;
  playsCount: number;
  progressContainerRef: React.RefObject<View>;
}

interface AudioActions {
  handlePlayPress: () => void;
  handleProgressBarPress: (event: any) => void;
  handleProgressBarDrag: (event: any) => void;
  handleProgressBarRelease: () => void;
  setProgress: (progress: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsSeeking: (seeking: boolean) => void;
}

export const useVoiceNoteAudio = ({
  voiceNote,
  userId,
  onPlay,
  onPlayPress,
}: VoiceNoteAudioProps): AudioState & AudioActions => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playsCount, setPlaysCount] = useState(normalizePlaysCount(voiceNote.plays || 0));
  
  // Progress container ref for audio scrubbing
  const progressContainerRef = useRef<View>(null);

  // Handle play button press
  const handlePlayPress = useCallback(() => {
    setIsPlaying(!isPlaying);
    
    if (onPlayPress) {
      onPlayPress();
    }
    
    if (onPlay) {
      onPlay();
    }

    // Record play
    if (userId) {
      recordPlay(voiceNote.id, userId).catch((error) => {
        console.error('Error recording play:', error);
      });
    }
  }, [isPlaying, onPlayPress, onPlay, voiceNote.id, userId]);

  // Handle progress bar interactions
  const handleProgressBarPress = useCallback((event: any) => {
    // Implementation for progress bar press
    // Calculate position based on touch event and container width
    if (progressContainerRef.current && event.nativeEvent) {
      const { locationX } = event.nativeEvent;
      // Layout measurement would be needed here for accurate calculation
      console.log('Progress bar pressed at:', locationX);
    }
  }, []);

  const handleProgressBarDrag = useCallback((event: any) => {
    // Implementation for progress bar drag
    setIsSeeking(true);
    // Update progress based on drag position
  }, []);

  const handleProgressBarRelease = useCallback(() => {
    // Implementation for progress bar release
    setIsSeeking(false);
    // Seek to the final position
  }, []);

  return {
    // State
    isPlaying,
    progress,
    isSeeking,
    playsCount,
    progressContainerRef,

    // Actions
    handlePlayPress,
    handleProgressBarPress,
    handleProgressBarDrag,
    handleProgressBarRelease,
    setProgress,
    setIsPlaying,
    setIsSeeking,
  };
}; 