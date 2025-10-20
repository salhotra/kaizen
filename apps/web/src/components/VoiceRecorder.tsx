import { useCallback, useState } from 'react';
import { useVoiceRecorder, shouldTranscribeAudio } from '@kaizen/audio-recorder';
import { css } from '../../styled-system/css';
import { hstack, vstack } from '../../styled-system/patterns';
import { transcribeAudio } from '../services/whisper';
import { RecordButton } from '../ui/RecordButton/RecordButton';

enum ButtonState {
  Ready = 'ready',
  Recording = 'recording',
  Processing = 'processing',
}

function TranscriptList({ transcripts }: { transcripts: string[] }): React.ReactElement {
  if (transcripts.length === 0) {
    return (
      <p className={css({ color: 'gray.600', fontStyle: 'italic', textAlign: 'center' })}>
        Your transcripts will appear here...
      </p>
    );
  }

  return (
    <div className={vstack({ gap: 3, alignItems: 'stretch' })}>
      {transcripts.map((transcript, index) => (
        <div
          key={`${index}-${transcript.slice(0, 20)}`}
          className={css({
            p: 3,
            bg: 'gray.800',
            border: '1px solid',
            borderColor: 'gray.700',
            rounded: 'md',
            fontSize: 'md',
            lineHeight: '1.6',
            color: 'gray.200',
          })}
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
      <div
        className={css({
          minH: '100vh',
          bg: 'black',
          color: 'white',
        })}
      >
        <div className={vstack({ gap: 4, p: 8, alignItems: 'center' })}>
          <p className={css({ color: 'red.400', fontSize: 'lg', textAlign: 'center' })}>
            Your browser doesn't support audio recording. Please use a modern browser like Chrome,
            Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={css({
        minH: '100vh',
        bg: 'black',
        color: 'white',
      })}
    >
      <div className={vstack({ gap: 6, p: 8, maxW: '4xl', mx: 'auto' })}>
        {/* Header */}
        <div className={vstack({ gap: 2, textAlign: 'center' })}>
          <h1 className={css({ fontSize: '3xl', fontWeight: 'bold', color: 'white' })}>
            Voice to Text POC
          </h1>
          <p className={css({ fontSize: 'md', color: 'gray.400' })}>
            Tap to record • Auto-stops after 2.5s of silence
          </p>
        </div>

        {/* Microphone Button */}
        <div className={vstack({ gap: 3, alignItems: 'center', py: 8 })}>
          <RecordButton
            onClick={handleMicButtonClick}
            isRecording={recordingState === 'recording'}
            disabled={isProcessing}
          />

          {/* Status Text */}
          <p
            className={css({
              fontSize: 'lg',
              fontWeight: 'semibold',
              color:
                buttonState === 'ready'
                  ? 'red.400'
                  : buttonState === 'recording'
                    ? 'red.400'
                    : 'gray.400',
            })}
          >
            {isProcessing
              ? 'Processing...'
              : recordingState === 'recording'
                ? 'Recording...'
                : 'Ready'}
          </p>

          {/* Instructions */}
          {recordingState === 'idle' && !isProcessing && (
            <p className={css({ fontSize: 'sm', color: 'gray.400', textAlign: 'center' })}>
              Tap microphone to start recording
            </p>
          )}
          {recordingState === 'recording' && (
            <p className={css({ fontSize: 'sm', color: 'gray.400', textAlign: 'center' })}>
              Speak now • Tap to stop manually
            </p>
          )}
        </div>

        {/* Error Display */}
        {currentError && (
          <div
            className={css({
              p: 4,
              bg: 'red.900',
              border: '1px solid',
              borderColor: 'red.700',
              rounded: 'lg',
            })}
          >
            <p className={css({ color: 'red.300', fontSize: 'sm' })}>⚠️ {currentError}</p>
          </div>
        )}

        {/* Transcript Display */}
        <div className={vstack({ gap: 3, alignItems: 'stretch' })}>
          <div className={hstack({ justifyContent: 'space-between', alignItems: 'center' })}>
            <h2 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'white' })}>
              Transcript
            </h2>
            {transcripts.length > 0 && (
              <button
                type="button"
                onClick={handleClearTranscripts}
                className={css({
                  px: 4,
                  py: 2,
                  bg: 'gray.800',
                  color: 'gray.300',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  rounded: 'md',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: {
                    bg: 'gray.700',
                  },
                })}
              >
                Clear
              </button>
            )}
          </div>

          <div
            className={css({
              minH: '64',
              maxH: '96',
              overflowY: 'auto',
              p: 4,
              bg: 'gray.900',
              border: '2px solid',
              borderColor: 'gray.800',
              rounded: 'lg',
            })}
          >
            <TranscriptList transcripts={transcripts} />
          </div>

          {/* Transcript Stats */}
          {transcripts.length > 0 && (
            <div className={hstack({ gap: 4, fontSize: 'sm', color: 'gray.500' })}>
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
