import type { SilenceDetectionOptions } from '../types';
import { getAudioContextClass, isAudioContextSupported } from './audio-context.utils';

const SILENCE_THRESHOLD = 5;
const SILENCE_DURATION_MS = 2500;

/**
 * Event callbacks for SilenceDetectorCore
 */
export interface SilenceDetectorCoreEvents {
  onSilenceDetected?: () => void;
  onVolumeChange?: (volume: number) => void;
}

/**
 * Core class for detecting silence in audio streams
 * Uses Web Audio API to analyze audio levels in real-time
 */
export class SilenceDetectorCore {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private silenceStartTime: number | null = null;
  private currentVolume = 0;
  private isMonitoring = false;
  private events: SilenceDetectorCoreEvents = {};

  constructor(private options: SilenceDetectionOptions = {}) {
    this.options = {
      silenceThreshold: SILENCE_THRESHOLD,
      silenceDuration: SILENCE_DURATION_MS,
      ...options,
    };
  }

  /**
   * Check if Web Audio API is supported
   */
  static isSupported(): boolean {
    return isAudioContextSupported();
  }

  /**
   * Register event callbacks
   *
   * @param events - Event callbacks object
   */
  on(events: SilenceDetectorCoreEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Update options
   *
   * @param options - New options to merge with existing
   */
  updateOptions(options: Partial<SilenceDetectionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Start monitoring audio stream for silence
   *
   * @param stream - MediaStream to monitor
   * @throws Error if Web Audio API is not supported
   */
  start(stream: MediaStream): void {
    if (!SilenceDetectorCore.isSupported()) {
      throw new Error('Web Audio API is not supported in this environment');
    }

    if (this.isMonitoring) {
      console.warn('SilenceDetectorCore is already monitoring');
      return;
    }

    try {
      // Create audio context and analyser
      const AudioContextClass = getAudioContextClass();

      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      const microphone = this.audioContext.createMediaStreamSource(stream);

      // Configure analyser
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect microphone to analyser
      microphone.connect(this.analyser);

      // Reset state
      this.silenceStartTime = null;
      this.isMonitoring = true;

      // Start monitoring
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.monitorAudioLevel(dataArray);
    } catch (err) {
      console.error('Failed to start silence detection:', err);
      this.cleanup();
      throw new Error(
        `Failed to start silence detection: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stop monitoring audio stream
   */
  stop(): void {
    this.isMonitoring = false;

    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch((err) => {
        console.error('Error closing audio context:', err);
      });
      this.audioContext = null;
    }

    this.analyser = null;
    this.silenceStartTime = null;
    this.currentVolume = 0;
  }

  /**
   * Get the current volume level
   *
   * @returns Current volume (0-255)
   */
  getCurrentVolume(): number {
    return this.currentVolume;
  }

  /**
   * Check if currently monitoring
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Cleanup resources
   * Should be called when instance is no longer needed
   */
  cleanup(): void {
    this.stop();
    this.events = {};
  }

  /**
   * Monitor audio level in a loop using requestAnimationFrame
   */
  private monitorAudioLevel = (dataArray: Uint8Array<ArrayBuffer>): void => {
    if (!this.isMonitoring || !this.analyser) {
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArray.length;
    this.currentVolume = average;

    // Notify volume change
    this.events.onVolumeChange?.(average);

    // Check for silence
    const threshold = this.options.silenceThreshold ?? SILENCE_THRESHOLD;
    const duration = this.options.silenceDuration ?? SILENCE_DURATION_MS;
    const isSilent = average < threshold;
    const now = Date.now();

    if (isSilent) {
      if (this.silenceStartTime === null) {
        this.silenceStartTime = now;
      } else if (now - this.silenceStartTime >= duration) {
        // Silence detected for required duration
        this.events.onSilenceDetected?.();
        this.silenceStartTime = null;
        return;
      }
    } else {
      // Reset silence timer if sound detected
      this.silenceStartTime = null;
    }

    // Continue monitoring
    this.animationFrameId = requestAnimationFrame(() => this.monitorAudioLevel(dataArray));
  };
}

