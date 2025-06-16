import { useState, useCallback } from 'react';
import { getUserVoiceNotes, getUserSharedVoiceNotes } from '../../../services/api';

interface VoiceNote {
  id: string;
  created_at: string;
  shared_at?: string;
  is_shared?: boolean;
  [key: string]: any; // For other voice note properties
}

interface ProfileVoiceNotesState {
  voiceNotes: VoiceNote[];
  loadingVoiceNotes: boolean;
  voiceNotesError: string | null;
}

interface ProfileVoiceNotesActions {
  loadVoiceNotes: (userId: string) => Promise<void>;
  refreshVoiceNotes: (userId: string) => Promise<void>;
  clearVoiceNotes: () => void;
  addVoiceNote: (note: VoiceNote) => void;
  updateVoiceNote: (noteId: string, updates: Partial<VoiceNote>) => void;
  removeVoiceNote: (noteId: string) => void;
}

export const useProfileVoiceNotes = (): ProfileVoiceNotesState & ProfileVoiceNotesActions => {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loadingVoiceNotes, setLoadingVoiceNotes] = useState(false);
  const [voiceNotesError, setVoiceNotesError] = useState<string | null>(null);

  const sortVoiceNotes = (notes: VoiceNote[]): VoiceNote[] => {
    return notes.sort((a, b) => {
      const dateA = a.is_shared && a.shared_at 
        ? new Date(a.shared_at) 
        : new Date(a.created_at);
      const dateB = b.is_shared && b.shared_at 
        ? new Date(b.shared_at) 
        : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  };

  const loadVoiceNotes = useCallback(async (userId: string) => {
    if (!userId) {
      setVoiceNotesError('User ID is required');
      return;
    }

    setLoadingVoiceNotes(true);
    setVoiceNotesError(null);

    try {
      // Load both regular and shared voice notes in parallel
      const [notes, sharedNotes] = await Promise.all([
        getUserVoiceNotes(userId),
        getUserSharedVoiceNotes(userId),
      ]);

      // Combine and sort by creation/share time
      const allNotes = [...notes, ...sharedNotes];
      const sortedNotes = sortVoiceNotes(allNotes);
      
      setVoiceNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading voice notes:', error);
      setVoiceNotesError('Failed to load voice notes');
      setVoiceNotes([]);
    } finally {
      setLoadingVoiceNotes(false);
    }
  }, []);

  const refreshVoiceNotes = useCallback(async (userId: string) => {
    // Refresh without changing loading state (for pull-to-refresh)
    await loadVoiceNotes(userId);
  }, [loadVoiceNotes]);

  const clearVoiceNotes = () => {
    setVoiceNotes([]);
    setVoiceNotesError(null);
    setLoadingVoiceNotes(false);
  };

  const addVoiceNote = (note: VoiceNote) => {
    setVoiceNotes(prevNotes => {
      const newNotes = [note, ...prevNotes];
      return sortVoiceNotes(newNotes);
    });
  };

  const updateVoiceNote = (noteId: string, updates: Partial<VoiceNote>) => {
    setVoiceNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  };

  const removeVoiceNote = (noteId: string) => {
    setVoiceNotes(prevNotes => 
      prevNotes.filter(note => note.id !== noteId)
    );
  };

  return {
    // State
    voiceNotes,
    loadingVoiceNotes,
    voiceNotesError,

    // Actions
    loadVoiceNotes,
    refreshVoiceNotes,
    clearVoiceNotes,
    addVoiceNote,
    updateVoiceNote,
    removeVoiceNote,
  };
}; 