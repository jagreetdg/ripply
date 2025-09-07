# Voice Recording Components

This directory contains a clean, rebuilt voice recording implementation following the guide from [galaxies.dev](https://galaxies.dev/react-native-voice-recorder-whisper-api).

## Components

### `useVoiceRecording` Hook
- **File**: `hooks/useVoiceRecording.ts`
- **Purpose**: Core voice recording logic using Expo AV
- **Features**:
  - Audio permissions handling
  - Recording start/stop functionality
  - Duration tracking with auto-stop
  - Upload simulation
  - Clean state management

### `VoiceRecorder` Component
- **File**: `VoiceRecorder.tsx`
- **Purpose**: Main recording interface
- **Features**:
  - Record/stop button with visual feedback
  - Timer display
  - Animated waveform during recording
  - Caption input
  - Upload functionality

### `VoiceNotesList` Component
- **File**: `VoiceNotesList.tsx`
- **Purpose**: Display and manage recorded voice notes
- **Features**:
  - List of recorded notes
  - Play/pause functionality
  - Delete notes with confirmation
  - Empty state handling

### `VoiceNotesScreen` Component
- **File**: `VoiceNotesScreen.tsx`
- **Purpose**: Main screen combining recorder and list
- **Features**:
  - Toggle between list and recorder views
  - Header with add/close buttons
  - State management for notes

### `VoiceWaveform` Component
- **File**: `VoiceWaveform.tsx`
- **Purpose**: Visual feedback during recording
- **Features**:
  - Animated bars during recording
  - Placeholder text when not recording
  - Smooth animations

## Usage

### Basic Usage
```tsx
import { VoiceNotesScreen } from './components/voice-post/VoiceNotesScreen';

export default function App() {
  return <VoiceNotesScreen />;
}
```

### Using Individual Components
```tsx
import { VoiceRecorder } from './components/voice-post/VoiceRecorder';

function MyScreen() {
  const handleRecordingComplete = (uri: string) => {
    console.log('Recording completed:', uri);
  };

  const handleUploadComplete = () => {
    console.log('Upload completed');
  };

  return (
    <VoiceRecorder
      onRecordingComplete={handleRecordingComplete}
      onUploadComplete={handleUploadComplete}
    />
  );
}
```

### Using the Hook
```tsx
import { useVoiceRecording } from './components/voice-post/hooks/useVoiceRecording';

function MyComponent() {
  const {
    isRecording,
    recordingDuration,
    recordingUri,
    startRecording,
    stopRecording,
    clearRecording,
    uploadRecording,
  } = useVoiceRecording({ maxDuration: 60 });

  // Use the recording functionality
}
```

## Features

- ✅ **Audio Recording**: High-quality audio recording using Expo AV
- ✅ **Permissions**: Automatic microphone permission handling
- ✅ **Visual Feedback**: Animated waveform during recording
- ✅ **Duration Tracking**: Real-time duration display with auto-stop
- ✅ **Playback**: Play recorded audio notes
- ✅ **Caption Support**: Add captions to voice notes
- ✅ **Upload Simulation**: Mock upload functionality (ready for real API integration)
- ✅ **Clean UI**: Modern, accessible interface
- ✅ **Error Handling**: Comprehensive error handling and user feedback

## Testing

To test the voice recording functionality:

1. Navigate to `/voice-test` in your app
2. Tap the "+" button to start recording
3. Tap the microphone button to start/stop recording
4. Add a caption and upload the note
5. View and play back recorded notes

## Integration Notes

- The upload functionality is currently simulated - replace the `uploadRecording` function in `useVoiceRecording.ts` with your actual API call
- The components are designed to be flexible and can be easily customized
- All components follow React Native best practices and are optimized for both iOS and Android
- The implementation is based on the guide from galaxies.dev but simplified and adapted for this project's needs

## Dependencies

- `expo-av`: For audio recording and playback
- `@expo/vector-icons`: For UI icons
- `react-native`: Core React Native components

## Future Enhancements

- Real API integration for upload/download
- Cloud storage integration
- Transcription using Whisper API
- Voice note sharing
- Advanced audio editing features
