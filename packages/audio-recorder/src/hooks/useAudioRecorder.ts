import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecorderCore } from '../core';
import { StreamManagerCore } from '../core';
import { RecordingState } from '../types';

export interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
  isSupported: boolean;
}

export interface UseAudioRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob) => void;
  mimeType?: string;
}

/**
 * React hook for audio recording using MediaRecorder API
 * Thin adapter around AudioRecorderCore for React state management
 *
 * @param options - Configuration options
 * @returns Audio recorder controls and state
 */
export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { onRecordingComplete, mimeType = 'audio/webm' } = options;

  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorderCore | null>(null);
  const streamManagerRef = useRef<StreamManagerCore | null>(null);

  // Check if recording is supported
  const isSupported = AudioRecorderCore.isSupported() && StreamManagerCore.isSupported();

  // Initialize core instances
  useEffect(() => {
    recorderRef.current = new AudioRecorderCore({ mimeType });
    streamManagerRef.current = new StreamManagerCore();

    // Set up event listeners
    recorderRef.current.on({
      onStateChange: setRecordingState,
      onError: (err) => setError(err.message),
      onStop: (blob) => {
        if (blob.size > 0) {
          onRecordingComplete?.(blob);
        }
      },
    });

    // Cleanup on unmount
    return () => {
      recorderRef.current?.cleanup();
      streamManagerRef.current?.cleanup();
    };
  }, [mimeType, onRecordingComplete]);

  /**
   * Start recording audio from the user's microphone
   */
  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      return;
    }

    if (!recorderRef.current || !streamManagerRef.current) {
      setError('Recorder not initialized');
      return;
    }

    try {
      setError(null);

      // Get media stream
      const stream = await streamManagerRef.current.getStream({
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      });

      // Start recording
      await recorderRef.current.start(stream);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to start recording. Please try again.');
      }
      setRecordingState(RecordingState.Idle);
    }
  }, [isSupported]);

  /**
   * Stop recording and return the audio blob
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current || recordingState !== 'recording') {
      return null;
    }

    try {
      const audioBlob = await recorderRef.current.stop();

      // Stop the stream
      streamManagerRef.current?.stopStream();

      return audioBlob.size > 0 ? audioBlob : null;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
      return null;
    }
  }, [recordingState]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    error,
    isSupported,
  };
}
