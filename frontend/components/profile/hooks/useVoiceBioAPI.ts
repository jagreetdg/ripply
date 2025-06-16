import { useState } from 'react';
import { Alert } from 'react-native';
import { createOrUpdateVoiceBio, deleteVoiceBio } from '../../../services/api';

interface VoiceBioAPIProps {
  userId: string;
  onVoiceBioUpdated: () => void;
}

interface VoiceBioAPIState {
  isUploading: boolean;
}

interface VoiceBioAPIActions {
  saveVoiceBio: (audioUrl: string, duration: number) => Promise<void>;
  deleteCurrentVoiceBio: () => Promise<void>;
}

export const useVoiceBioAPI = ({
  userId,
  onVoiceBioUpdated,
}: VoiceBioAPIProps): VoiceBioAPIState & VoiceBioAPIActions => {
  const [isUploading, setIsUploading] = useState(false);

  const saveVoiceBio = async (audioUrl: string, duration: number) => {
    if (!audioUrl) {
      Alert.alert('Error', 'Please record a voice bio first.');
      return;
    }

    setIsUploading(true);
    try {
      // Create or update the voice bio
      await createOrUpdateVoiceBio(userId, {
        audio_url: audioUrl,
        duration: duration,
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
              Alert.alert('Success', 'Voice bio deleted successfully!');
              onVoiceBioUpdated();
            } catch (error) {
              console.error('Failed to delete voice bio:', error);
              Alert.alert(
                'Error',
                'Failed to delete voice bio. Please try again.'
              );
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return {
    // State
    isUploading,

    // Actions
    saveVoiceBio,
    deleteCurrentVoiceBio,
  };
}; 