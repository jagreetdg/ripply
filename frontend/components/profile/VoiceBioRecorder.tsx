import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { createOrUpdateVoiceBio, deleteVoiceBio } from '../../services/api/voiceBioService';
import * as FileSystem from 'expo-file-system';

interface VoiceBioRecorderProps {
  userId: string;
  onVoiceBioUpdated: () => void;
  existingVoiceBio?: {
    id: string;
    audio_url: string;
    duration: number;
    transcript?: string;
  } | null;
}

export function VoiceBioRecorder({ 
  userId, 
  onVoiceBioUpdated,
  existingVoiceBio 
}: VoiceBioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const playbackPosition = useRef(0);

  // Initialize audio
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
        Alert.alert('Error', 'Failed to initialize audio recording. Please check app permissions.');
      }
    };

    initAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  // Load existing voice bio for playback if available
  useEffect(() => {
    if (existingVoiceBio?.audio_url && !recordingUri) {
      setRecordingDuration(existingVoiceBio.duration);
    }
  }, [existingVoiceBio]);

  const startRecording = async () => {
    try {
      // Unload any existing recording
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
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

  const playRecording = async () => {
    if (!recordingUri && !existingVoiceBio?.audio_url) {
      Alert.alert('Error', 'No recording available to play.');
      return;
    }

    try {
      // If we already have a sound object, use it
      if (sound) {
        await sound.playFromPositionAsync(playbackPosition.current);
      } else {
        // Create a new sound object
        const source = recordingUri || (existingVoiceBio?.audio_url || '');
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

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      playbackPosition.current = status.positionMillis;
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        playbackPosition.current = 0;
      }
    }
  };

  const saveVoiceBio = async () => {
    if (!recordingUri && !existingVoiceBio?.audio_url) {
      Alert.alert('Error', 'Please record a voice bio first.');
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, you would upload the file to a storage service
      // For now, we'll just use the local URI or existing URL
      const audioUrl = recordingUri || (existingVoiceBio?.audio_url || '');
      
      // Create or update the voice bio
      await createOrUpdateVoiceBio(userId, {
        audio_url: audioUrl || '',
        duration: recordingDuration,
        transcript: '', // Could be generated with speech-to-text in a real app
      });
      
      Alert.alert('Success', 'Voice bio saved successfully!');
      onVoiceBioUpdated();
    } catch (error) {
      console.error('Failed to save voice bio:', error);
      Alert.alert('Error', 'Failed to save voice bio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCurrentVoiceBio = async () => {
    if (!existingVoiceBio && !recordingUri) return;
    
    Alert.alert(
      'Delete Voice Bio',
      'Are you sure you want to delete your voice bio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUploading(true);
            try {
              await deleteVoiceBio(userId);
              setRecordingUri(null);
              setRecordingDuration(0);
              if (sound) {
                await sound.unloadAsync();
                setSound(null);
              }
              Alert.alert('Success', 'Voice bio deleted successfully!');
              onVoiceBioUpdated();
            } catch (error) {
              console.error('Failed to delete voice bio:', error);
              Alert.alert('Error', 'Failed to delete voice bio. Please try again.');
            } finally {
              setIsUploading(false);
            }
          }
        }
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Bio</Text>
      <Text style={styles.description}>
        Record a short introduction for your profile (max 60 seconds)
      </Text>
      
      <View style={styles.controls}>
        {isRecording ? (
          <>
            <View style={styles.durationContainer}>
              <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
              <View style={styles.recordingIndicator} />
            </View>
            <TouchableOpacity 
              style={[styles.button, styles.stopButton]} 
              onPress={stopRecording}
              disabled={isUploading}
            >
              <Feather name="square" size={24} color="white" />
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        ) : recordingUri || existingVoiceBio ? (
          <>
            <View style={styles.durationContainer}>
              <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.playButton]} 
                onPress={isPlaying ? pausePlayback : playRecording}
                disabled={isUploading}
              >
                <Feather name={isPlaying ? "pause" : "play"} size={24} color="white" />
                <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.recordButton]} 
                onPress={startRecording}
                disabled={isUploading}
              >
                <Feather name="mic" size={24} color="white" />
                <Text style={styles.buttonText}>Re-record</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={saveVoiceBio}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Feather name="save" size={24} color="white" />
                    <Text style={styles.buttonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]} 
                onPress={deleteCurrentVoiceBio}
                disabled={isUploading}
              >
                <Feather name="trash-2" size={24} color="white" />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.recordButton]} 
            onPress={startRecording}
            disabled={isUploading}
          >
            <Feather name="mic" size={24} color="white" />
            <Text style={styles.buttonText}>Record</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6B2FBC',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  controls: {
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  duration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  recordButton: {
    backgroundColor: '#6B2FBC',
    flex: 1,
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    width: '100%',
  },
  playButton: {
    backgroundColor: '#3498db',
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  noVoiceBioText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
});
