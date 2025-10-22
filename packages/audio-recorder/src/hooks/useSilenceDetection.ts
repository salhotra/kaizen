import { useCallback, useEffect, useRef, useState } from 'react';
import { SilenceDetectorCore } from '../core';

export interface UseSilenceDetectionOptions {
  /**
   * Silence threshold (0-255). Values below this are considered silence.
   * @default 5
   */
  silenceThreshold?: number;

  /**
   * Duration of silence (in milliseconds) before triggering callback
   * @default 2500 (2.5 seconds)
   */
  silenceDuration?: number;

  /**
   * Callback triggered when silence is detected for the specified duration
   */
  onSilenceDetected?: () => void;

  /**
   * Whether silence detection is active
   * @default false
   */
  isActive?: boolean;
}

export interface UseSilenceDetectionReturn {
  startMonitoring: (stream: MediaStream) => void;
  stopMonitoring: () => void;
  currentVolume: number;
}

/**
 * React hook for detecting silence in audio stream
 * Thin adapter around SilenceDetectorCore for React state management
 * Uses Web Audio API to analyze audio levels in real-time
 *
 * @param options - Configuration options
 * @returns Silence detection controls
 */
export function useSilenceDetection(
  options: UseSilenceDetectionOptions = {}
): UseSilenceDetectionReturn {
  const {
    silenceThreshold = 5,
    silenceDuration = 2500,
    onSilenceDetected,
    isActive = false,
  } = options;

  const [currentVolume, setCurrentVolume] = useState(0);
  const detectorRef = useRef<SilenceDetectorCore | null>(null);

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new SilenceDetectorCore({
      silenceThreshold,
      silenceDuration,
      onSilenceDetected,
    });

    // Set up event listeners
    detectorRef.current.on({
      onSilenceDetected,
      onVolumeChange: setCurrentVolume,
    });

    // Cleanup on unmount
    return () => {
      detectorRef.current?.cleanup();
    };
  }, [silenceThreshold, silenceDuration, onSilenceDetected]);

  /**
   * Start monitoring audio stream for silence
   */
  const startMonitoring = useCallback(
    (stream: MediaStream): void => {
      if (!(isActive && detectorRef.current)) {
        return;
      }

      try {
        detectorRef.current.start(stream);
      } catch (err) {
        console.error('Failed to start silence detection:', err);
      }
    },
    [isActive]
  );

  /**
   * Stop monitoring audio stream
   */
  const stopMonitoring = useCallback((): void => {
    detectorRef.current?.stop();
  }, []);

  // Cleanup when isActive changes
  useEffect(() => {
    if (!isActive) {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isActive, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    currentVolume,
  };
}
