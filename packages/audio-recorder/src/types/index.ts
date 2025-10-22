/**
 * Recording state machine states
 */
export enum RecordingState {
  Idle = 'idle',
  Recording = 'recording',
  Processing = 'processing',
}

/**
 * Configuration for silence detection
 */
export interface SilenceDetectionOptions {
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
}

/**
 * Audio constraints for MediaStream
 */
export interface AudioConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  sampleRate?: number;
}

/**
 * Audio metrics extracted from analysis
 */
export interface AudioMetrics {
  /**
   * Duration of the audio in milliseconds
   */
  duration: number;

  /**
   * Average volume level (0-255)
   */
  averageVolume: number;
}

/**
 * Configuration for audio validation
 */
export interface AudioValidationConfig {
  /**
   * Minimum duration in milliseconds
   * @default 5000 (5 seconds)
   */
  minDuration?: number;

  /**
   * Minimum average volume threshold (0-255)
   * Values below this indicate likely silence
   * @default 10
   */
  minVolumeThreshold?: number;
}

/**
 * Result of audio analysis
 */
export interface AudioAnalysisResult {
  /**
   * Whether the audio meets the validation criteria
   */
  isValid: boolean;

  /**
   * Duration of the audio in milliseconds
   */
  duration: number;

  /**
   * Average volume level (0-255)
   */
  averageVolume: number;

  /**
   * Reason for invalidity (if applicable)
   */
  invalidationReason?: string;
}

/**
 * Media stream error types
 */
export class MediaStreamError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_ALLOWED' | 'NOT_FOUND' | 'NOT_SUPPORTED' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'MediaStreamError';
  }
}

/**
 * Audio recording error types
 */
export class AudioRecordingError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_SUPPORTED' | 'RECORDING_FAILED' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'AudioRecordingError';
  }
}
