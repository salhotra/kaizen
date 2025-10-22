import { shouldTranscribeAudio, useVoiceRecorder } from '@kaizen/audio-recorder';
import { useCallback, useState } from 'react';
import { transcribeAudio } from '../services/whisper';
import { RecordButton } from '../ui/RecordButton/RecordButton';

enum ButtonState {
  Ready = 'ready',
  Recording = 'recording',
  Processing = 'processing',
}

function TranscriptList({ transcripts }: { transcripts: string[] }): React.ReactElement {
  if (transcripts.length === 0) {
    return <p className="text-gray-600 italic text-center">Your transcripts will appear here...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {transcripts.map((transcript, index) => (
        <div
          key={`${index}-${transcript.slice(0, 20)}`}
          className="p-3 bg-gray-800 border border-gray-700 rounded-md text-base leading-relaxed text-gray-200"
        >
          {transcript}
        </div>
      ))}
    </div>
  );
}

export function VoiceRecorder(): React.ReactElement {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      // Validate audio before sending to Whisper
      // Check if audio meets minimum duration (5s) and volume requirements
      const shouldTranscribe = await shouldTranscribeAudio(audioBlob, {
        minDuration: 5000, // 5 seconds
        minVolumeThreshold: 10, // Minimum volume level
      });

      if (!shouldTranscribe) {
        // Silently skip - audio doesn't meet requirements (too short or too quiet)
        setIsTranscribing(false);
        return;
      }

      const text = await transcribeAudio({ audioBlob });

      if (text.trim()) {
        setTranscripts((prev) => [...prev, text.trim()]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
      setTranscriptionError(errorMessage);
      console.error('Transcription error:', error);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const {
    recordingState,
    startRecording,
    stopRecording,
    error: recordingError,
    isSupported,
  } = useVoiceRecorder({
    onRecordingComplete: handleRecordingComplete,
    silenceDuration: 2500, // 2.5 seconds of silence
    enableAutoStop: true,
  });

  const handleMicButtonClick = useCallback(async () => {
    if (recordingState === 'recording') {
      await stopRecording();
    } else if (recordingState === 'idle') {
      await startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  const handleClearTranscripts = useCallback(() => {
    setTranscripts([]);
    setTranscriptionError(null);
  }, []);

  const isProcessing = recordingState === 'processing' || isTranscribing;
  const currentError = recordingError || transcriptionError;

  // Determine button state and styling
  const getButtonState = (): ButtonState => {
    if (isProcessing) return ButtonState.Processing;
    if (recordingState === 'recording') return ButtonState.Recording;
    return ButtonState.Ready;
  };

  const buttonState = getButtonState();

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex flex-col gap-4 p-8 items-center">
          <p className="text-red-400 text-lg text-center">
            Your browser doesn't support audio recording. Please use a modern browser like Chrome,
            Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold text-white">Voice to Text POC</h1>
          <p className="text-base text-gray-400">
            Tap to record • Auto-stops after 2.5s of silence
          </p>
        </div>

        {/* Microphone Button */}
        <div className="flex flex-col gap-3 items-center py-8">
          <RecordButton
            onClick={handleMicButtonClick}
            isRecording={recordingState === 'recording'}
            disabled={isProcessing}
          />

          {/* Status Text */}
          <p
            className={`text-lg font-semibold ${
              buttonState === 'ready'
                ? 'text-red-400'
                : buttonState === 'recording'
                  ? 'text-red-400'
                  : 'text-gray-400'
            }`}
          >
            {isProcessing
              ? 'Processing...'
              : recordingState === 'recording'
                ? 'Recording...'
                : 'Ready'}
          </p>

          {/* Instructions */}
          {recordingState === 'idle' && !isProcessing && (
            <p className="text-sm text-gray-400 text-center">Tap microphone to start recording</p>
          )}
          {recordingState === 'recording' && (
            <p className="text-sm text-gray-400 text-center">Speak now • Tap to stop manually</p>
          )}
        </div>

        {/* Error Display */}
        {currentError && (
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-300 text-sm">⚠️ {currentError}</p>
          </div>
        )}

        {/* Transcript Display */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Transcript</h2>
            {transcripts.length > 0 && (
              <button
                type="button"
                onClick={handleClearTranscripts}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded-md cursor-pointer transition-all hover:bg-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="min-h-64 max-h-96 overflow-y-auto p-4 bg-gray-900 border-2 border-gray-800 rounded-lg">
            <TranscriptList transcripts={transcripts} />
          </div>

          {/* Transcript Stats */}
          {transcripts.length > 0 && (
            <div className="flex gap-4 text-sm text-gray-500">
              <span>
                {transcripts.length} recording{transcripts.length !== 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span>{transcripts.join(' ').split(/\s+/).length} words</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
