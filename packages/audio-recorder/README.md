# @kaizen/audio-recorder

A well-architected audio recording package with layered architecture for maximum reusability and maintainability.

## Architecture

This package follows a **pragmatic layered architecture** designed for clarity, testability, and framework flexibility:

```
┌─────────────────────────────────────────┐
│           PUBLIC API (index.ts)          │
│  Exports hooks, services, core, types    │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐   ┌──────────▼────────┐
│  HOOKS LAYER   │   │  SERVICES LAYER   │
│  (React)       │   │  (Orchestration)   │
│  - Thin        │   │  - Business logic  │
│    adapters    │   │  - Validation      │
│  - State mgmt  │   │  - Analysis        │
└───────┬────────┘   └──────────┬────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │     CORE LAYER        │
        │  (Framework-agnostic)  │
        │  - Pure TS classes     │
        │  - Browser APIs        │
        │  - Event emitters      │
        └───────────┬───────────┘
                    │
        ┌───────────▼───────────┐
        │     TYPES LAYER       │
        │  (Shared contracts)    │
        └───────────────────────┘
```

### Layer Responsibilities

#### 🎯 **Core Layer** (`/core`)
Framework-agnostic TypeScript classes that handle browser API interactions.

- **`StreamManagerCore`**: MediaStream lifecycle management
- **`AudioRecorderCore`**: MediaRecorder API wrapper
- **`SilenceDetectorCore`**: Web Audio API for silence detection
- **`AudioAnalyzerCore`**: Audio decoding and metric extraction (duration, volume)

**Why?** These can be reused in Vue, Svelte, or vanilla JS projects.

#### 🔧 **Services Layer** (`/services`)
Business logic and orchestration.

- **`audio-analysis.service`**: Audio validation and quality checks

**Why?** Separates domain logic from framework concerns.

#### ⚛️ **Hooks Layer** (`/hooks`)
Thin React adapters for state management.

- **`useAudioRecorder`**: Basic audio recording hook
- **`useSilenceDetection`**: Silence monitoring hook
- **`useVoiceRecorder`**: Combined recording + silence detection

**Why?** Keeps React-specific code isolated and hooks simple.

#### 📐 **Types Layer** (`/types`)
Shared TypeScript types and interfaces.

**Why?** Single source of truth for contracts across all layers.

---

## Installation

```bash
# From the workspace root
pnpm install
```

---

## Usage

### Basic Audio Recording

```typescript
import { useAudioRecorder } from '@kaizen/audio-recorder';

function RecordingComponent() {
  const { recordingState, startRecording, stopRecording, error } = useAudioRecorder({
    onRecordingComplete: (blob) => {
      // Handle the audio blob
      console.log('Recording complete:', blob);
    }
  });

  return (
    <div>
      <button onClick={startRecording} disabled={recordingState !== 'idle'}>
        Start
      </button>
      <button onClick={stopRecording} disabled={recordingState !== 'recording'}>
        Stop
      </button>
      <p>State: {recordingState}</p>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Voice Recording with Auto-Stop

```typescript
import { useVoiceRecorder } from '@kaizen/audio-recorder';

function VoiceComponent() {
  const { recordingState, startRecording, stopRecording, error } = useVoiceRecorder({
    enableAutoStop: true,
    silenceThreshold: 5,
    silenceDuration: 2500, // Stop after 2.5s of silence
    onRecordingComplete: (blob) => {
      // Upload to server
      uploadAudioToAPI(blob);
    }
  });

  return (
    <div>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop</button>
      <p>{recordingState}</p>
    </div>
  );
}
```

### Audio Validation

```typescript
import { analyzeAudioBlob, shouldTranscribeAudio } from '@kaizen/audio-recorder';

async function validateAudio(blob: Blob) {
  const analysis = await analyzeAudioBlob(blob, {
    minDuration: 5000, // 5 seconds
    minVolumeThreshold: 10
  });

  console.log('Duration:', analysis.duration);
  console.log('Average volume:', analysis.averageVolume);
  console.log('Is valid:', analysis.isValid);
  
  if (!analysis.isValid) {
    console.log('Reason:', analysis.invalidationReason);
  }
}
```

### Advanced: Using Core Layer Directly (Non-React)

```typescript
import { 
  AudioRecorderCore, 
  StreamManagerCore,
  AudioAnalyzerCore 
} from '@kaizen/audio-recorder';

// Vanilla JavaScript/TypeScript usage
const streamManager = new StreamManagerCore();
const recorder = new AudioRecorderCore({ mimeType: 'audio/webm' });

// Set up event listeners
recorder.on({
  onStateChange: (state) => console.log('State:', state),
  onStop: (blob) => console.log('Recording done:', blob),
  onError: (error) => console.error('Error:', error)
});

// Start recording
const stream = await streamManager.getStream();
await recorder.start(stream);

// Stop recording
const audioBlob = await recorder.stop();
streamManager.stopStream();

// Analyze the recording (get raw metrics)
const { duration, averageVolume } = await AudioAnalyzerCore.analyzeBlob(audioBlob);
console.log(`Duration: ${duration}ms, Volume: ${averageVolume}`);

// Cleanup
recorder.cleanup();
streamManager.cleanup();
```

---

## API Reference

### Hooks

#### `useAudioRecorder(options?)`

Basic audio recording hook.

**Options:**
- `mimeType?: string` - Audio format (default: 'audio/webm')
- `onRecordingComplete?: (blob: Blob) => void` - Callback when done

**Returns:**
- `recordingState: 'idle' | 'recording' | 'processing'`
- `startRecording: () => Promise<void>`
- `stopRecording: () => Promise<Blob | null>`
- `error: string | null`
- `isSupported: boolean`

#### `useSilenceDetection(options?)`

Silence monitoring hook.

**Options:**
- `silenceThreshold?: number` - Threshold 0-255 (default: 5)
- `silenceDuration?: number` - Duration in ms (default: 2500)
- `onSilenceDetected?: () => void` - Callback when silence detected
- `isActive?: boolean` - Whether monitoring is active

**Returns:**
- `startMonitoring: (stream: MediaStream) => void`
- `stopMonitoring: () => void`
- `currentVolume: number`

#### `useVoiceRecorder(options?)`

Combined recording + silence detection.

**Options:**
- `silenceThreshold?: number`
- `silenceDuration?: number`
- `enableAutoStop?: boolean` - Auto-stop on silence (default: true)
- `onRecordingComplete?: (blob: Blob) => void`

**Returns:**
- Same as `useAudioRecorder`

### Services

#### `analyzeAudioBlob(blob, config?)`

Analyzes audio quality and duration.

**Config:**
- `minDuration?: number` - Minimum duration in ms (default: 5000)
- `minVolumeThreshold?: number` - Minimum volume 0-255 (default: 10)

**Returns:** `Promise<AudioAnalysisResult>`

#### `shouldTranscribeAudio(blob, config?)`

Quick validation check.

**Returns:** `Promise<boolean>`

---

## Package Structure

```
src/
├── core/                     # Framework-agnostic core logic
│   ├── stream-manager.core.ts
│   ├── audio-recorder.core.ts
│   ├── silence-detector.core.ts
│   ├── audio-analyzer.core.ts
│   └── index.ts
├── hooks/                    # React hooks (thin adapters)
│   ├── useAudioRecorder.ts
│   ├── useSilenceDetection.ts
│   ├── useVoiceRecorder.ts
│   └── index.ts
├── services/                 # Business logic & utilities
│   ├── audio-analysis.service.ts
│   └── index.ts
├── types/                    # Shared TypeScript types
│   └── index.ts
└── index.ts                  # Public API exports
```

---

## Design Principles

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Framework Independence**: Core logic can be used anywhere
3. **Testability**: Pure classes are easy to unit test
4. **Progressive Enhancement**: Use only what you need
5. **Type Safety**: Comprehensive TypeScript types throughout
   - Minimal type assertions (see `../../docs/TYPE_ASSERTION_POLICY.md`)
   - Only 1 controlled `as` cast in the entire package
6. **DRY but not over-abstracted**: Balanced approach to reusability

---

## Integration with API

This package is designed for **client-side audio capture only**. For a complete voice-to-text workout tracking system:

```typescript
// CLIENT: Capture audio
const { startRecording } = useVoiceRecorder({
  onRecordingComplete: async (blob) => {
    // Upload to your API
    const formData = new FormData();
    formData.append('audio', blob);
    
    const response = await fetch('/api/workouts/voice', {
      method: 'POST',
      body: formData
    });
    
    const workout = await response.json();
    // Display workout data to user
  }
});

// SERVER: Process audio (separate API)
// POST /api/workouts/voice
// - Transcribe with Whisper
// - Extract gym data (LLM/parsing)
// - Save to database
// - Return structured workout
```

---

## Development

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Fix lint issues
pnpm lint:fix

# Clean
pnpm clean
```

---

## Future Enhancements

- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add service orchestration layer (if needed)
- [ ] Support for AudioWorklet (advanced audio processing)
- [ ] Support for real-time streaming transcription
- [ ] Offline support with IndexedDB storage

---

## License

Private package for Kaizen monorepo.

