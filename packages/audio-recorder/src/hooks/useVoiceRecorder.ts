import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecordingState } from '../types';
import { useAudioRecorder } from './useAudioRecorder';
import { useSilenceDetection } from './useSilenceDetection';

export interface UseVoiceRecorderOptions {
  /**
   * Silence threshold (0-255). Values below this are considered silence.
   * @default 5
   */
  silenceThreshold?: number;

  /**
   * Duration of silence (in milliseconds) before auto-stopping
   * @default 2500 (2.5 seconds)
   */
  silenceDuration?: number;

  /**
   * Whether to enable auto-stop on silence detection
   * @default true
   */
  enableAutoStop?: boolean;

  /**
   * Callback when recording is complete
   */
  onRecordingComplete?: (audioBlob: Blob) => void;
}

export interface UseVoiceRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
  isSupported: boolean;
}

/**
 * Combined React hook for voice recording with silence detection
 * Integrates audio recording and auto-stop on silence
 * Thin adapter that composes useAudioRecorder and useSilenceDetection
 *
 * @param options - Configuration options
 * @returns Voice recorder controls and state
 */
export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const {
    silenceThreshold = 5,
    silenceDuration = 2500,
    enableAutoStop = true,
    onRecordingComplete,
  } = options;

  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    recordingState,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    error,
    isSupported,
  } = useAudioRecorder({
    onRecordingComplete,
  });

  const handleSilenceDetected = useCallback(async () => {
    if (enableAutoStop && recordingState === 'recording') {
      await stopAudioRecording();
      setIsMonitoringActive(false);
    }
  }, [enableAutoStop, recordingState, stopAudioRecording]);

  const { startMonitoring, stopMonitoring } = useSilenceDetection({
    silenceThreshold,
    silenceDuration,
    onSilenceDetected: handleSilenceDetected,
    isActive: isMonitoringActive,
  });

  /**
   * Start recording with silence detection
   */
  const startRecording = useCallback(async (): Promise<void> => {
    await startAudioRecording();

    if (enableAutoStop) {
      // Get the media stream to monitor
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      setIsMonitoringActive(true);

      // Start monitoring after a brief delay to let recording stabilize
      setTimeout(() => {
        if (stream) {
          startMonitoring(stream);
        }
      }, 100);
    }
  }, [startAudioRecording, enableAutoStop, startMonitoring]);

  /**
   * Stop recording manually
   */
  const stopRecording = useCallback(async (): Promise<void> => {
    await stopAudioRecording();
    setIsMonitoringActive(false);
    stopMonitoring();

    // Clean up stream
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, [stopAudioRecording, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, [stopMonitoring]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    error,
    isSupported,
  };
}
